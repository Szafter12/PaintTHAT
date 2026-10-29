using Microsoft.EntityFrameworkCore;
using WebApi.Data;
using WebApi.Models;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<app_db>(options => options.UseSqlite("data source = Paint THAT"));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}


app.UseAuthorization();

app.MapControllers();
// seedowanie bazy hasłami
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<app_db>();

    // 1. Tworzy plik bazy i buduje tabele (Users, Words) jeśli ich nie ma
    db.Database.Migrate();

    // 2. Wypełnia tabelę początkowymi hasłami
    if (!db.Words.Any())
    {
        db.Words.AddRange(
            new words { Text = "Pies", Difficulty = "łatwy" },
            new words { Text = "Samochód", Difficulty = "łatwy" },
            new words { Text = "Komputer", Difficulty = "średni" },
            new words { Text = "Żyrafa", Difficulty = "trudny" }
        );
        db.SaveChanges();
    }
}

app.Run();
