namespace Cicclo.Api.Domain;

public sealed class DemoSession
{
    public Guid Id {get;}
    public Money Balance {get; private set;}
    public DemoSession()
    {
        Id = Guid.NewGuid();
        Balance = new Money(5000);
    }
}