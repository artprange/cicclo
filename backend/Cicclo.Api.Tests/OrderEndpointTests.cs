using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Cicclo.Api.Features.Orders;
using Cicclo.Api.Features.Sessions;
using Cicclo.Api.Features.Wallet;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Cicclo.Api.Tests;

public sealed class OrderEndpointTests
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public OrderEndpointTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CheckoutFlow_ReturnsOrdersAndBusinessErrors()
    {
        using var client = _factory.CreateClient();

        var sessionId = await CreateSessionAsync(client);
        var key = Guid.NewGuid().ToString();

        using var firstResponse = await SendOrderAsync(
            client,
            sessionId,
            key,
            """{"serviceId":"wash"}""");

        var firstOrder = await ReadOrderAsync(firstResponse);

        Assert.NotEqual(Guid.Empty, firstOrder.OrderId);
        Assert.Equal("wash", firstOrder.ServiceId);
        Assert.Equal(1890L, firstOrder.ChargedCents);
        Assert.Equal(3110L, firstOrder.BalanceAfterCents);
        Assert.Equal("confirmed", firstOrder.Status);

        using var replayResponse = await SendOrderAsync(
            client,
            sessionId,
            key,
            """{"serviceId":"wash"}""");

        var replayOrder = await ReadOrderAsync(replayResponse);

        Assert.Equal(firstOrder, replayOrder);
        await AssertWalletBalanceAsync(client, sessionId, 3110);

        using var conflictResponse = await SendOrderAsync(
            client,
            sessionId,
            key,
            """{"serviceId":"dry"}""");

        await AssertProblemAsync(
            conflictResponse,
            HttpStatusCode.Conflict,
            "IDEMPOTENCY_KEY_REUSED");

        await AssertWalletBalanceAsync(client, sessionId, 3110);

        using var dryResponse = await SendOrderAsync(
            client,
            sessionId,
            Guid.NewGuid().ToString(),
            """{"serviceId":"dry"}""");

        var dryOrder = await ReadOrderAsync(dryResponse);

        Assert.Equal(2090L, dryOrder.ChargedCents);
        Assert.Equal(1020L, dryOrder.BalanceAfterCents);

        using var insufficientResponse = await SendOrderAsync(
            client,
            sessionId,
            Guid.NewGuid().ToString(),
            """{"serviceId":"wash"}""");

        await AssertProblemAsync(
            insufficientResponse,
            HttpStatusCode.Conflict,
            "INSUFFICIENT_FUNDS");

        await AssertWalletBalanceAsync(client, sessionId, 1020);
    }

    [Fact]
    public async Task UnknownService_ReturnsNotFoundWithoutDebit()
    {
        using var client = _factory.CreateClient();

        var sessionId = await CreateSessionAsync(client);

        using var response = await SendOrderAsync(
            client,
            sessionId,
            Guid.NewGuid().ToString(),
            """{"serviceId":"unknown"}""");

        await AssertProblemAsync(
            response,
            HttpStatusCode.NotFound,
            "SERVICE_NOT_FOUND");

        await AssertWalletBalanceAsync(client, sessionId, 5000);
    }

    [Theory]
    [InlineData("")]
    [InlineData("{")]
    [InlineData("null")]
    [InlineData("{}")]
    [InlineData("""{"serviceId":null}""")]
    [InlineData("""{"serviceId":""}""")]
    [InlineData("""{"serviceId":"   "}""")]
    [InlineData("""{"serviceId":123}""")]
    [InlineData("""{"serviceId":"wash","priceCents":1}""")]
    [InlineData("""{"serviceId":"wash","balanceCents":999999}""")]
    public async Task InvalidBody_ReturnsBadRequestWithoutDebit(string body)
    {
        using var client = _factory.CreateClient();

        var sessionId = await CreateSessionAsync(client);

        using var response = await SendOrderAsync(
            client,
            sessionId,
            Guid.NewGuid().ToString(),
            body);

        await AssertProblemAsync(
            response,
            HttpStatusCode.BadRequest,
            "INVALID_REQUEST");

        await AssertWalletBalanceAsync(client, sessionId, 5000);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("invalid-key")]
    [InlineData("00000000-0000-0000-0000-000000000000")]
    public async Task InvalidKey_ReturnsBadRequestWithoutDebit(string? key)
    {
        using var client = _factory.CreateClient();

        var sessionId = await CreateSessionAsync(client);

        using var response = await SendOrderAsync(
            client,
            sessionId,
            key,
            """{"serviceId":"wash"}""");

        await AssertProblemAsync(
            response,
            HttpStatusCode.BadRequest,
            "INVALID_REQUEST");

        await AssertWalletBalanceAsync(client, sessionId, 5000);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("invalid-session")]
    [InlineData("00000000-0000-0000-0000-000000000000")]
    [InlineData("11111111-1111-1111-1111-111111111111")]
    public async Task InvalidSession_ReturnsNotFound(string? sessionId)
    {
        using var client = _factory.CreateClient();

        using var response = await SendOrderAsync(
            client,
            sessionId,
            Guid.NewGuid().ToString(),
            """{"serviceId":"wash"}""");

        await AssertProblemAsync(
            response,
            HttpStatusCode.NotFound,
            "SESSION_NOT_FOUND");
    }

    [Fact]
    public async Task NonJsonBody_ReturnsBadRequestWithoutDebit()
    {
        using var client = _factory.CreateClient();

        var sessionId = await CreateSessionAsync(client);

        using var response = await SendOrderAsync(
            client,
            sessionId,
            Guid.NewGuid().ToString(),
            """{"serviceId":"wash"}""",
            "text/plain");

        await AssertProblemAsync(
            response,
            HttpStatusCode.BadRequest,
            "INVALID_REQUEST");

        await AssertWalletBalanceAsync(client, sessionId, 5000);
    }

    private static async Task<HttpResponseMessage> SendOrderAsync(
        HttpClient client,
        string? sessionId,
        string? key,
        string body,
        string contentType = "application/json")
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            "/api/orders");

        if (sessionId is not null)
        {
            request.Headers.Add("X-Demo-Session", sessionId);
        }

        if (key is not null)
        {
            request.Headers.Add("Idempotency-Key", key);
        }

        request.Content = new StringContent(
            body,
            Encoding.UTF8,
            contentType);

        return await client.SendAsync(request);
    }

    private static async Task<string> CreateSessionAsync(HttpClient client)
    {
        using var response = await client.PostAsync(
            "/api/demo/sessions",
            content: null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var session = await response.Content
            .ReadFromJsonAsync<CreateSessionResponse>();

        Assert.NotNull(session);
        Assert.Equal(5000L, session.BalanceCents);

        return session.SessionId.ToString();
    }

    private static async Task<OrderResponse> ReadOrderAsync(
        HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(
            "application/json",
            response.Content.Headers.ContentType?.MediaType);

        var order = await response.Content
            .ReadFromJsonAsync<OrderResponse>();

        Assert.NotNull(order);

        return order;
    }

    private static async Task AssertWalletBalanceAsync(
        HttpClient client,
        string sessionId,
        long expectedBalance)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            "/api/wallet");

        request.Headers.Add("X-Demo-Session", sessionId);

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var wallet = await response.Content
            .ReadFromJsonAsync<WalletResponse>();

        Assert.NotNull(wallet);
        Assert.Equal(expectedBalance, wallet.BalanceCents);
    }

    private static async Task AssertProblemAsync(
        HttpResponseMessage response,
        HttpStatusCode expectedStatus,
        string expectedCode)
    {
        Assert.Equal(expectedStatus, response.StatusCode);
        Assert.Equal(
            "application/problem+json",
            response.Content.Headers.ContentType?.MediaType);

        var content = await response.Content.ReadAsStringAsync();

        using var document = JsonDocument.Parse(content);

        Assert.Equal(
            expectedCode,
            document.RootElement.GetProperty("code").GetString());

        Assert.Equal(
            (int)expectedStatus,
            document.RootElement.GetProperty("status").GetInt32());
    }
}