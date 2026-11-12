using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Cicclo.Api.Features.Sessions;
using Cicclo.Api.Features.Wallet;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Cicclo.Api.Tests;

public sealed class DemoSessionEndpointTests
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public DemoSessionEndpointTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CreateSessions_ReturnsDistinctWalletsWithInitialBalance()
    {
        using var client = _factory.CreateClient();

        var firstSession = await CreateSessionAsync(client);
        var secondSession = await CreateSessionAsync(client);

        Assert.NotEqual(Guid.Empty, firstSession.SessionId);
        Assert.NotEqual(Guid.Empty, secondSession.SessionId);
        Assert.NotEqual(firstSession.SessionId, secondSession.SessionId);

        Assert.Equal(5000L, firstSession.BalanceCents);
        Assert.Equal(5000L, secondSession.BalanceCents);

        await AssertWalletBalanceAsync(client, firstSession.SessionId);
        await AssertWalletBalanceAsync(client, secondSession.SessionId);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("invalid-session")]
    [InlineData("00000000-0000-0000-0000-000000000000")]
    [InlineData("11111111-1111-1111-1111-111111111111")]
    public async Task GetWallet_WithoutKnownSession_ReturnsNotFound(
        string? sessionId)
    {
        using var client = _factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/wallet");

        if (sessionId is not null)
        {
            request.Headers.Add("X-Demo-Session", sessionId);
        }

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(
            "application/problem+json",
            response.Content.Headers.ContentType?.MediaType);

        var content = await response.Content.ReadAsStringAsync();

        using var document = JsonDocument.Parse(content);

        Assert.Equal(
            "SESSION_NOT_FOUND",
            document.RootElement.GetProperty("code").GetString());
    }

    private static async Task<CreateSessionResponse> CreateSessionAsync(
        HttpClient client)
    {
        using var response = await client.PostAsync(
            "/api/demo/sessions",
            content: null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var session = await response.Content
            .ReadFromJsonAsync<CreateSessionResponse>();

        Assert.NotNull(session);

        return session;
    }

    private static async Task AssertWalletBalanceAsync(
        HttpClient client,
        Guid sessionId)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, "/api/wallet");

        request.Headers.Add("X-Demo-Session", sessionId.ToString());

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var wallet = await response.Content
            .ReadFromJsonAsync<WalletResponse>();

        Assert.NotNull(wallet);
        Assert.Equal(5000L, wallet.BalanceCents);
    }
}