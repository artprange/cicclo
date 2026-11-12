using System.Text.Json;
using Cicclo.Api.Domain;
using Cicclo.Api.Infrastructure;

namespace Cicclo.Api.Features.Orders;

public static class OrderEndpoints
{
    public static void MapOrderEndpoints(this WebApplication app)
    {
        app.MapPost("/api/orders", CreateOrderAsync);
    }

    private static async Task<IResult> CreateOrderAsync(
        HttpRequest request,
        InMemoryDemoStore store,
        CancellationToken cancellationToken)
    {
        var sessionHeader = request.Headers["X-Demo-Session"];

        if (sessionHeader.Count != 1 ||
            !Guid.TryParse(sessionHeader[0], out var sessionId))
        {
            return ToProblem(OrderError.SessionNotFound);
        }

        var keyHeader = request.Headers["Idempotency-Key"];

        if (keyHeader.Count != 1 ||
            !Guid.TryParse(keyHeader[0], out var idempotencyKey) ||
            idempotencyKey == Guid.Empty)
        {
            return InvalidRequest(
                "Informe uma Idempotency-Key válida.");
        }

        if (!request.HasJsonContentType())
        {
            return InvalidRequest(
                "Envie o corpo da solicitação como application/json.");
        }

        CreateOrderRequest? body;

        try
        {
            body = await request.ReadFromJsonAsync<CreateOrderRequest>(
                cancellationToken);
        }
        catch (JsonException)
        {
            return InvalidRequest(
                "O corpo da solicitação deve conter apenas um serviceId válido.");
        }

        if (body is null || string.IsNullOrWhiteSpace(body.ServiceId))
        {
            return InvalidRequest(
                "Informe o serviço desejado em serviceId.");
        }

        var result = store.PlaceOrder(
            sessionId,
            body.ServiceId,
            idempotencyKey);

        if (result.Order is not { } order)
        {
            return ToProblem(result.Error);
        }

        return Results.Ok(new OrderResponse(
            order.OrderId,
            order.ServiceId,
            order.Charged.Cents,
            order.BalanceAfter.Cents,
            order.Status,
            order.CreatedAtUtc));
    }

    private static IResult InvalidRequest(string detail)
    {
        return Problem(
            StatusCodes.Status400BadRequest,
            "INVALID_REQUEST",
            "Solicitação inválida",
            detail);
    }

    private static IResult ToProblem(OrderError? error)
    {
        return error switch
        {
            OrderError.SessionNotFound => Problem(
                StatusCodes.Status404NotFound,
                "SESSION_NOT_FOUND",
                "Sessão não encontrada",
                "Crie uma nova sessão de demonstração para continuar."),

            OrderError.ServiceNotFound => Problem(
                StatusCodes.Status404NotFound,
                "SERVICE_NOT_FOUND",
                "Serviço não encontrado",
                "Escolha um serviço disponível no catálogo."),

            OrderError.InsufficientFunds => Problem(
                StatusCodes.Status409Conflict,
                "INSUFFICIENT_FUNDS",
                "Saldo insuficiente",
                "Seu saldo não é suficiente para solicitar esse serviço."),

            OrderError.IdempotencyKeyReused => Problem(
                StatusCodes.Status409Conflict,
                "IDEMPOTENCY_KEY_REUSED",
                "Chave de operação já utilizada",
                "Esta chave já foi utilizada para outro serviço."),

            _ => Problem(
                StatusCodes.Status500InternalServerError,
                "INTERNAL_ERROR",
                "Erro interno",
                "Não foi possível concluir a solicitação.")
        };
    }

    private static IResult Problem(
        int statusCode,
        string code,
        string title,
        string detail)
    {
        return Results.Problem(
            statusCode: statusCode,
            title: title,
            detail: detail,
            extensions: new Dictionary<string, object?>
            {
                ["code"] = code
            });
    }
}