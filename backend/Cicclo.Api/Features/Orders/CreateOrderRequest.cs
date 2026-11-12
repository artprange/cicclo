using System.Text.Json.Serialization;

namespace Cicclo.Api.Features.Orders;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record CreateOrderRequest(string? ServiceId);