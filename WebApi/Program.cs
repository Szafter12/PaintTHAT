using Microsoft.EntityFrameworkCore;
using WebApi.Data;
using WebApi.Services;

/*
- TODO
- Rejestracja hosta (email, haslo, haslo_powtorzenie, create_at, is_active, )
- logowanie
- Polaczenie z google
- reset hasla
- profil Hosta 
- Jak host usunie pokojo (wyjdzie z gry albo cos) to musisz dac isActive na 0
- Dodanie swaggera
*/

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                       ?? "Data Source=paintthat.db";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));

builder.Services.AddScoped<IGameService, GameService>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddCors(options => {
    options.AddPolicy("AllowReact", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

var drawingsPath = Path.Combine(app.Environment.ContentRootPath, "wwwroot", "drawings");
Directory.CreateDirectory(drawingsPath);

app.UseStaticFiles();
app.UseCors("AllowReact");
app.UseAuthorization();
app.MapControllers();

app.Run();