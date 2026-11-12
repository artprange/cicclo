using Cicclo.Api.Domain;

namespace Cicclo.Api.Features.Services;

public static class ServiceCatalog
{
    public static IReadOnlyList<LaundryService> All {get;} =
    Array.AsReadOnly(
        new[]
    {
        new LaundryService("wash", "Lavagem", new Money(1890)),
        new LaundryService("dry", "Secagem", new Money(2090))
    });
}