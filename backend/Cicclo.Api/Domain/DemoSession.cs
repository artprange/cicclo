namespace Cicclo.Api.Domain;

public sealed class DemoSession
{
    private readonly object _syncRoot = new();

    private readonly Dictionary<
        Guid,
        (string ServiceId, OrderResult Result)> _requests = new();

    private Money _balance = new(5000);

    public Guid Id { get; } = Guid.NewGuid();

    public Money Balance
    {
        get
        {
            lock (_syncRoot)
            {
                return _balance;
            }
        }
    }

    public OrderResult PlaceOrder(
        string serviceId,
        Guid idempotencyKey,
        IReadOnlyList<LaundryService> services)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(serviceId);

        if (idempotencyKey == Guid.Empty)
        {
            throw new ArgumentException(
                "The idempotency key must not be empty.",
                nameof(idempotencyKey));
        }

        lock (_syncRoot)
        {
            if (_requests.TryGetValue(idempotencyKey, out var previous))
            {
                return previous.ServiceId == serviceId
                    ? previous.Result
                    : OrderResult.Failure(OrderError.IdempotencyKeyReused);
            }

            var service = services.FirstOrDefault(
                candidate => candidate.Id == serviceId);

            var result = CreateOrderResult(service);

            _requests.Add(idempotencyKey, (serviceId, result));

            if (result.Order is { } order)
            {
                _balance = order.BalanceAfter;
            }

            return result;
        }
    }

    private OrderResult CreateOrderResult(LaundryService? service)
    {
        if (service is null)
        {
            return OrderResult.Failure(OrderError.ServiceNotFound);
        }

        if (_balance.Cents < service.Price.Cents)
        {
            return OrderResult.Failure(OrderError.InsufficientFunds);
        }

        var order = new Order(
            Guid.NewGuid(),
            service.Id,
            service.Price,
            new Money(_balance.Cents - service.Price.Cents),
            DateTimeOffset.UtcNow);

        return OrderResult.Success(order);
    }

    public Money Reset()
{
    lock (_syncRoot)
    {
        _requests.Clear();
        _balance = new Money(5000);

        return _balance;
    }
}
}