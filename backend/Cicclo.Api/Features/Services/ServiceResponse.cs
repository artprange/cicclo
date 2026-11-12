namespace Cicclo.Api.Features.Services;

public sealed record ServiceResponse(
    string Id,
    string Name,
    long PriceCents);