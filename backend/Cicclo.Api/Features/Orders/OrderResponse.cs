namespace Cicclo.Api.Features.Orders;

public sealed record OrderResponse(
    Guid OrderId,
    string ServiceId,
    long ChargedCents,
    long BalanceAfterCents,
    string Status,
    DateTimeOffset CreatedAtUtc);