using Cicclo.Api.Features.Services;

var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.MapGet("/", () => Results.Ok(new
{
    name = "Cicclo.Api"
}));

app.MapGet("/api/services", () =>
{
    var services = ServiceCatalog.All
        .Select(service => new ServiceResponse(
            service.Id,
            service.Name,
            service.Price.Cents))
        .ToArray();

    return Results.Ok(services);
});

app.Run();

public partial class Program
{
}