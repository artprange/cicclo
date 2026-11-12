using Cicclo.Api.Domain;
using Xunit;

namespace Cicclo.Api.Tests;

public sealed class MoneyTests
{
    [Theory]
    [InlineData(0L)]
    [InlineData(1890L)]
    [InlineData(2090L)]
    [InlineData(5000L)]
    public void Constructor_PreservesNonNegativeCents(long cents)
    {
        var money = new Money(cents);

        Assert.Equal(cents, money.Cents);
    }

    [Theory]
    [InlineData(-1L)]
    [InlineData(-1890L)]
    public void Constructor_RejectsNegativeCents(long cents)
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new Money(cents));
    }
}