namespace Cicclo.Api.Features.Sessions;

public sealed record CreateSessionResponse(
    Guid SessionId,
    long BalanceCents);