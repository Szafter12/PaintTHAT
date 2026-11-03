using Microsoft.EntityFrameworkCore;
using WebApi.Data;
using WebApi.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Add controllers and OpenAPI/Swagger support
builder.Services.AddControllers();

// 2. Configure Entity Framework Core with SQLite
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
                       ?? "Data Source=paintthat.db";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));

// 3. Register the GameService for dependency injection
builder.Services.AddScoped<IGameService, GameService>();

// 4. Configuration for CORS to allow requests from React frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Check if the "wwwroot/drawings" directory exists, if not, create it
var drawingsPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "drawings");
Directory.CreateDirectory(drawingsPath);

// 5. Serving static files
app.UseStaticFiles();

// 6. Enable CORS
app.UseCors("AllowReact");

app.UseAuthorization();
app.MapControllers();

app.Run();