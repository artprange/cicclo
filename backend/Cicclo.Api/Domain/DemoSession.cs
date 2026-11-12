namespace Cicclo.Api.Domain;

public sealed class DemoSession
{
    private readonly object _syncRoot = new();
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
}