namespace Cicclo.Api.Domain;

public enum OrderError
{
    SessionNotFound,
    ServiceNotFound,
    InsufficientFunds,
    IdempotencyKeyReused
}