namespace Cicclo.Api.Domain;

public sealed class LaundryService
{
    public string Id {get;}
    public string Name {get;}
    public Money Price {get;}

    public LaundryService(string id, string name, Money price)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(id);
        ArgumentException.ThrowIfNullOrWhiteSpace(name);

        Id = id;
        Name = name;
        Price = price;
    }
}