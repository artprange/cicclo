using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Cicclo.Api.Tests;

public sealed class ServicesEndpointTests
    : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public ServicesEndpointTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GetServices_ReturnsExpectedCatalog()
    {
        using var client = _factory.CreateClient();

        using var response = await client.GetAsync("/api/services");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(
            "application/json",
            response.Content.Headers.ContentType?.MediaType);

        var content = await response.Content.ReadAsStringAsync();

        using var document = JsonDocument.Parse(content);

        var services = document.RootElement;

        Assert.Equal(JsonValueKind.Array, services.ValueKind);
        Assert.Equal(2, services.GetArrayLength());

        AssertService(services[0], "wash", "Lavagem", 1890);
        AssertService(services[1], "dry", "Secagem", 2090);
    }

    private static void AssertService(
        JsonElement service,
        string expectedId,
        string expectedName,
        long expectedPriceCents)
    {
        Assert.Equal(3, service.EnumerateObject().Count());
        Assert.Equal(expectedId, service.GetProperty("id").GetString());
        Assert.Equal(expectedName, service.GetProperty("name").GetString());
        Assert.Equal(
            expectedPriceCents,
            service.GetProperty("priceCents").GetInt64());
    }
}