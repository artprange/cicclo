using Cicclo.Api.Features.Services;
using Cicclo.Api.Features.Sessions;
using Cicclo.Api.Features.Wallet;
using Cicclo.Api.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<InMemoryDemoStore>();

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

app.MapPost("/api/demo/sessions", (InMemoryDemoStore store) =>
{
    var session = store.CreateSession();

    var response = new CreateSessionResponse(
        session.Id,
        session.Balance.Cents);

    return Results.Json(
        response,
        statusCode: StatusCodes.Status201Created);
});

app.MapGet("/api/wallet", IResult (
    HttpRequest request,
    InMemoryDemoStore store) =>
{
    var sessionHeader = request.Headers["X-Demo-Session"];

    if (sessionHeader.Count != 1 ||
        !Guid.TryParse(sessionHeader[0], out var sessionId) ||
        !store.TryGetBalance(sessionId, out var balance))
    {
        return Results.Problem(
            statusCode: StatusCodes.Status404NotFound,
            title: "Sessão não encontrada",
            detail: "Crie uma nova sessão de demonstração para continuar.",
            extensions: new Dictionary<string, object?>
            {
                ["code"] = "SESSION_NOT_FOUND"
            });
    }

    return Results.Ok(new WalletResponse(balance.Cents));
});

app.Run();

public partial class Program
{
}