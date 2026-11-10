using Microsoft.EntityFrameworkCore;
using WebApi.Models;

namespace WebApi.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        if (await context.Words.AnyAsync())
        {
            return;
        }

        var defaultWords = new List<string>
        {
            "Pies", "Kot", "Żyrafa", "Słoń", "Pingwin", "Krokodyl", "Królik", "Papuga",
            "Rekin", "Delfin", "Wąż", "Żaba", "Niedźwiedź", "Ślimak", "Bocian",
            "Klawiatura", "Monitor", "Telefon", "Zegarek", "Parasol", "Klucz", "Kubek",
            "Książka", "Nożyczki", "Plecak", "Okulary", "Portfel", "Krzesło", "Drabina",
            "Jabłko", "Banan", "Pizza", "Hamburger", "Arbuz", "Kawa", "Czekolada",
            "Lody", "Marchewka", "Ser", "Tort", "Truskawka", "Sushi", "Pączek",
            "Samochód", "Rower", "Samolot", "Rakieta", "Pociąg", "Łódź podwodna",
            "Zamek", "Latarnia morska", "Szpital", "Most", "Piramida", "Wulkan",
            "Programista", "Lekarz", "Strażak", "Policjant", "Kucharz", "Astronauta",
            "Pirat", "Czarodziej", "Detektyw", "Malarz", "Nurek", "Superbohater",
            "Słońce", "Księżyc", "Tęcza", "Błyskawica", "Chmura", "Ognisko",
            "Wodospad", "Kometa", "Kaktus", "Grzyb", "Choinka", "Śnieżka"
        };

        var wordEntities = defaultWords.Select(word => new Word { Text = word });

        await context.Words.AddRangeAsync(wordEntities);
        await context.SaveChangesAsync();
    }
}