namespace Cicclo.Api.Domain;

public sealed record Order(
    Guid OrderId,
    string ServiceId,
    Money Charged,
    Money BalanceAfter,
    DateTimeOffset CreatedAtUtc
)
{
    public string Status => "confirmed";
}