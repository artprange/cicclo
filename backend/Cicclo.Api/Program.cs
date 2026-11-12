using Cicclo.Api.Features.Services;
using Cicclo.Api.Features.Sessions;
using Cicclo.Api.Features.Wallet;
using Cicclo.Api.Infrastructure;
using Cicclo.Api.Features.Orders;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<InMemoryDemoStore>();

const string LocalWebCorsPolicy = "LocalWeb";

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy(LocalWebCorsPolicy, policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:8081",
                    "http://127.0.0.1:8081")
                .WithMethods("GET", "POST")
                .WithHeaders(
                    "Content-Type",
                    "X-Demo-Session",
                    "Idempotency-Key");
        });
    });
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseCors(LocalWebCorsPolicy);
}

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(context =>
        Results.Problem(
            statusCode: StatusCodes.Status500InternalServerError,
            title: "Erro interno",
            detail: "Não foi possível concluir a solicitação.",
            extensions: new Dictionary<string, object?>
            {
                ["code"] = "INTERNAL_ERROR"
            })
        .ExecuteAsync(context));
});

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
app.MapOrderEndpoints();
app.MapPost("/api/demo/sessions/reset", IResult (
    HttpRequest request,
    InMemoryDemoStore store) =>
{
    var sessionHeader = request.Headers["X-Demo-Session"];

    if (sessionHeader.Count != 1 ||
        !Guid.TryParse(sessionHeader[0], out var sessionId) ||
        !store.TryResetSession(sessionId, out var balance))
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