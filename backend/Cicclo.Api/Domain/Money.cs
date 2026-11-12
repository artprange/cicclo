namespace Cicclo.Api.Domain;

public readonly record struct Money
{
    public long Cents { get; }

    public Money(long cents)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(cents);

        Cents = cents;
    }
}