using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Cicclo.Api.Features.Sessions;
using Cicclo.Api.Features.Wallet;
using Cicclo.Api.Infrastructure;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Cicclo.Api.Tests;

public sealed class DemoResetTests
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public DemoResetTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public void Reset_RestoresBalanceClearsKeysAndPreservesOtherSessions()
    {
        var store = new InMemoryDemoStore();
        var firstSession = store.CreateSession();
        var secondSession = store.CreateSession();
        var key = Guid.NewGuid();

        var firstOrder = store.PlaceOrder(firstSession.Id, "wash", key);
        var secondOrder = store.PlaceOrder(
            secondSession.Id,
            "dry",
            Guid.NewGuid());

        Assert.NotNull(firstOrder.Order);
        Assert.NotNull(secondOrder.Order);

        Assert.True(store.TryResetSession(firstSession.Id, out var resetBalance));
        Assert.Equal(5000L, resetBalance.Cents);

        Assert.True(store.TryGetBalance(firstSession.Id, out var firstBalance));
        Assert.Equal(5000L, firstBalance.Cents);

        Assert.True(store.TryGetBalance(secondSession.Id, out var secondBalance));
        Assert.Equal(2910L, secondBalance.Cents);

        var afterReset = store.PlaceOrder(firstSession.Id, "dry", key);

        Assert.Null(afterReset.Error);
        Assert.NotNull(afterReset.Order);
        Assert.NotEqual(firstOrder.Order.OrderId, afterReset.Order.OrderId);
        Assert.Equal(2910L, afterReset.Order.BalanceAfter.Cents);
    }

    [Fact]
    public void Reset_UnknownSession_DoesNotCreateWallet()
    {
        var store = new InMemoryDemoStore();
        var sessionId = Guid.NewGuid();

        Assert.False(store.TryResetSession(sessionId, out _));
        Assert.False(store.TryGetBalance(sessionId, out _));
    }

    [Fact]
    public async Task ResetEndpoint_RestoresPurchasedWallet()
    {
        using var client = _factory.CreateClient();

        using var sessionResponse = await client.PostAsync(
            "/api/demo/sessions",
            content: null);

        Assert.Equal(HttpStatusCode.Created, sessionResponse.StatusCode);

        var session = await sessionResponse.Content
            .ReadFromJsonAsync<CreateSessionResponse>();

        Assert.NotNull(session);

        client.DefaultRequestHeaders.Add(
            "X-Demo-Session",
            session.SessionId.ToString());

        using var orderRequest = new HttpRequestMessage(
            HttpMethod.Post,
            "/api/orders");

        orderRequest.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());
        orderRequest.Content = JsonContent.Create(new { serviceId = "wash" });

        using var orderResponse = await client.SendAsync(orderRequest);

        Assert.Equal(HttpStatusCode.OK, orderResponse.StatusCode);

        using var resetResponse = await client.PostAsync(
            "/api/demo/sessions/reset",
            content: null);

        Assert.Equal(HttpStatusCode.OK, resetResponse.StatusCode);

        var resetWallet = await resetResponse.Content
            .ReadFromJsonAsync<WalletResponse>();

        Assert.NotNull(resetWallet);
        Assert.Equal(5000L, resetWallet.BalanceCents);

        var currentWallet = await client.GetFromJsonAsync<WalletResponse>(
            "/api/wallet");

        Assert.NotNull(currentWallet);
        Assert.Equal(5000L, currentWallet.BalanceCents);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("invalid-session")]
    [InlineData("11111111-1111-1111-1111-111111111111")]
    public async Task ResetEndpoint_UnknownSession_ReturnsNotFound(
        string? sessionId)
    {
        using var client = _factory.CreateClient();

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            "/api/demo/sessions/reset");

        if (sessionId is not null)
        {
            request.Headers.Add("X-Demo-Session", sessionId);
        }

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(
            "application/problem+json",
            response.Content.Headers.ContentType?.MediaType);

        using var document = JsonDocument.Parse(
            await response.Content.ReadAsStringAsync());

        Assert.Equal(
            "SESSION_NOT_FOUND",
            document.RootElement.GetProperty("code").GetString());
    }
}