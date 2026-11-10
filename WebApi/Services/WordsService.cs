using Microsoft.EntityFrameworkCore;
using WebApi.Data;

namespace WebApi.Services;

public class WordsService : IWordsService
{
    private readonly AppDbContext _context;

    public WordsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<string>> GetRandomWordsAsync(int count)
    {
        var words = await _context.Words
            .OrderBy(w => EF.Functions.Random())
            .Take(count)
            .Select(w => w.Text)
            .ToListAsync();

        if (!words.Any())
        {
            return new List<string> { "Jabłko", "Programista", "Klawiatura", "Pies", "Banan" };
        }

        return words;
    }
}