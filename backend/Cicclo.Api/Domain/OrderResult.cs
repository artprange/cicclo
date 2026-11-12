namespace Cicclo.Api.Domain;

public sealed class OrderResult
{
    public Order? Order { get; }

    public OrderError? Error { get; }

    private OrderResult(Order? order, OrderError? error)
    {
        Order = order;
        Error = error;
    }

    public static OrderResult Success(Order order)
    {
        return new OrderResult(order, null);
    }

    public static OrderResult Failure(OrderError error)
    {
        return new OrderResult(null, error);
    }
}