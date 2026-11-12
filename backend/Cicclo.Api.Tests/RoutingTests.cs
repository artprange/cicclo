using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Cicclo.Api.Tests;

public sealed class RoutingTests
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public RoutingTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Theory]
    [InlineData("GET", "/api")]
    [InlineData("GET", "/api/not-found")]
    [InlineData("POST", "/api/not-found")]
    [InlineData("GET", "/api/missing.js")]
    [InlineData("GET", "/healthz/not-found")]
    public async Task UnknownReservedRoute_ReturnsProblemInsteadOfHtml(
        string method,
        string path)
    {
        using var client = _factory.CreateClient();

        using var request = new HttpRequestMessage(
            new HttpMethod(method),
            path);

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(
            "application/problem+json",
            response.Content.Headers.ContentType?.MediaType);

        using var document = JsonDocument.Parse(
            await response.Content.ReadAsStringAsync());

        Assert.Equal(
            "ENDPOINT_NOT_FOUND",
            document.RootElement.GetProperty("code").GetString());
    }
}