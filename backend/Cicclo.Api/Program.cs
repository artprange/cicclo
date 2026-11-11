var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.MapGet("/", () => Results.Ok(new
{
    name = "Cicclo.Api"
}));

app.Run();

public partial class Program
{
}