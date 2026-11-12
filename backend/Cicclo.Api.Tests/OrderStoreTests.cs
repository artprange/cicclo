using Cicclo.Api.Domain;
using Cicclo.Api.Infrastructure;
using Xunit;

namespace Cicclo.Api.Tests;

public sealed class OrderStoreTests
{
    [Theory]
    [InlineData("wash", 1890L, 3110L)]
    [InlineData("dry", 2090L, 2910L)]
    public void PlaceOrder_ChargesCatalogPrice(
        string serviceId,
        long expectedCharge,
        long expectedBalance)
    {
        var store = new InMemoryDemoStore();
        var session = store.CreateSession();

        var result = store.PlaceOrder(
            session.Id,
            serviceId,
            Guid.NewGuid());

        Assert.Null(result.Error);
        Assert.NotNull(result.Order);
        Assert.NotEqual(Guid.Empty, result.Order.OrderId);
        Assert.Equal(serviceId, result.Order.ServiceId);
        Assert.Equal(expectedCharge, result.Order.Charged.Cents);
        Assert.Equal(expectedBalance, result.Order.BalanceAfter.Cents);
        Assert.Equal("confirmed", result.Order.Status);
        Assert.Equal(TimeSpan.Zero, result.Order.CreatedAtUtc.Offset);
        AssertBalance(store, session.Id, expectedBalance);
    }

    [Fact]
    public void PlaceOrder_WithInsufficientFunds_PreservesBalance()
    {
        var store = new InMemoryDemoStore();
        var session = store.CreateSession();

        var wash = store.PlaceOrder(session.Id, "wash", Guid.NewGuid());
        var dry = store.PlaceOrder(session.Id, "dry", Guid.NewGuid());

        Assert.NotNull(wash.Order);
        Assert.NotNull(dry.Order);
        AssertBalance(store, session.Id, 1020);

        var key = Guid.NewGuid();
        var rejected = store.PlaceOrder(session.Id, "wash", key);
        var replay = store.PlaceOrder(session.Id, "wash", key);

        Assert.Null(rejected.Order);
        Assert.Equal(OrderError.InsufficientFunds, rejected.Error);
        Assert.Null(replay.Order);
        Assert.Equal(rejected.Error, replay.Error);
        AssertBalance(store, session.Id, 1020);
    }

    [Fact]
    public void PlaceOrder_ReplayPreservesOriginalOrderAndCurrentBalance()
    {
        var store = new InMemoryDemoStore();
        var session = store.CreateSession();
        var key = Guid.NewGuid();

        var first = store.PlaceOrder(session.Id, "wash", key);
        var replay = store.PlaceOrder(session.Id, "wash", key);

        Assert.NotNull(first.Order);
        Assert.Null(replay.Error);
        Assert.Equal(first.Order, replay.Order);
        AssertBalance(store, session.Id, 3110);

        var second = store.PlaceOrder(session.Id, "dry", Guid.NewGuid());

        Assert.NotNull(second.Order);

        var laterReplay = store.PlaceOrder(session.Id, "wash", key);

        Assert.Null(laterReplay.Error);
        Assert.Equal(first.Order, laterReplay.Order);
        Assert.Equal(3110L, first.Order.BalanceAfter.Cents);
        AssertBalance(store, session.Id, 1020);
    }

    [Fact]
    public void PlaceOrder_ReusedKeyWithDifferentService_DoesNotChargeAgain()
    {
        var store = new InMemoryDemoStore();
        var session = store.CreateSession();
        var key = Guid.NewGuid();

        var first = store.PlaceOrder(session.Id, "wash", key);
        var conflict = store.PlaceOrder(session.Id, "dry", key);
        var replay = store.PlaceOrder(session.Id, "wash", key);

        Assert.NotNull(first.Order);
        Assert.Null(conflict.Order);
        Assert.Equal(OrderError.IdempotencyKeyReused, conflict.Error);
        Assert.Equal(first.Order, replay.Order);
        AssertBalance(store, session.Id, 3110);
    }

    [Fact]
    public void PlaceOrder_IsolatesBalancesAndKeysBySession()
    {
        var store = new InMemoryDemoStore();
        var firstSession = store.CreateSession();
        var secondSession = store.CreateSession();
        var sharedKey = Guid.NewGuid();

        var first = store.PlaceOrder(firstSession.Id, "wash", sharedKey);

        Assert.NotNull(first.Order);
        AssertBalance(store, firstSession.Id, 3110);
        AssertBalance(store, secondSession.Id, 5000);

        var second = store.PlaceOrder(secondSession.Id, "dry", sharedKey);

        Assert.Null(second.Error);
        Assert.NotNull(second.Order);
        Assert.NotEqual(first.Order.OrderId, second.Order.OrderId);
        AssertBalance(store, firstSession.Id, 3110);
        AssertBalance(store, secondSession.Id, 2910);
    }

    [Fact]
    public void PlaceOrder_UnknownService_PreservesBalance()
    {
        var store = new InMemoryDemoStore();
        var session = store.CreateSession();

        var result = store.PlaceOrder(
            session.Id,
            "unknown",
            Guid.NewGuid());

        Assert.Null(result.Order);
        Assert.Equal(OrderError.ServiceNotFound, result.Error);
        AssertBalance(store, session.Id, 5000);
    }

    [Fact]
    public void PlaceOrder_UnknownSession_DoesNotCreateWallet()
    {
        var store = new InMemoryDemoStore();
        var unknownSessionId = Guid.NewGuid();

        var result = store.PlaceOrder(
            unknownSessionId,
            "wash",
            Guid.NewGuid());

        Assert.Null(result.Order);
        Assert.Equal(OrderError.SessionNotFound, result.Error);
        Assert.False(store.TryGetBalance(unknownSessionId, out _));
    }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task PlaceOrder_ConcurrentRequests_RespectBalanceAndIdempotency(
        bool reuseKey)
    {
        var store = new InMemoryDemoStore();
        var session = store.CreateSession();
        var sharedKey = Guid.NewGuid();

        using var barrier = new Barrier(3);

        var tasks = Enumerable.Range(0, 3)
            .Select(_ => Task.Factory.StartNew(
                () =>
                {
                    var key = reuseKey ? sharedKey : Guid.NewGuid();

                    if (!barrier.SignalAndWait(TimeSpan.FromSeconds(10)))
                    {
                        throw new TimeoutException(
                            "Concurrent requests did not reach the start barrier.");
                    }

                    return store.PlaceOrder(session.Id, "wash", key);
                },
                CancellationToken.None,
                TaskCreationOptions.LongRunning,
                TaskScheduler.Default))
            .ToArray();

        var results = await Task.WhenAll(tasks);

        if (reuseKey)
        {
            var firstOrder = results[0].Order;

            Assert.NotNull(firstOrder);

            Assert.All(results, result =>
            {
                Assert.Null(result.Error);
                Assert.Equal(firstOrder, result.Order);
            });

            AssertBalance(store, session.Id, 3110);
        }
        else
        {
             var accepted = results
                .Where(result => result.Order is not null)
                .ToArray();

            var rejected = Assert.Single(
                results,
                result => result.Order is null);

            Assert.Equal(2, accepted.Length);
            Assert.All(accepted, result => Assert.Null(result.Error));
            Assert.Equal(OrderError.InsufficientFunds, rejected.Error);

            Assert.Equal(
                2,
                accepted.Select(result => result.Order!.OrderId)
                    .Distinct()
                    .Count());

            AssertBalance(store, session.Id, 1220);
        }
    }

    private static void AssertBalance(
        InMemoryDemoStore store,
        Guid sessionId,
        long expectedBalance)
    {
        Assert.True(store.TryGetBalance(sessionId, out var balance));
        Assert.Equal(expectedBalance, balance.Cents);
    }
}