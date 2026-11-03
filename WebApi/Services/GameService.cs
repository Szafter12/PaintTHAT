using Microsoft.EntityFrameworkCore;
using WebApi.Data;
using WebApi.DTOs;
using WebApi.Models;

namespace WebApi.Services;

public class GameService : IGameService
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public GameService(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    public async Task<CreateRoomResponseDto> CreateRoomAsync(string? hostUsername)
    {
        string pin;
        bool pinExists;

        do
        {
            pin = Random.Shared.Next(1000, 10000).ToString();
            pinExists = await _context.Games.AnyAsync(g => g.Pin == pin && g.IsActive);
        } while (pinExists);

        var session = new GameSession
        {
            Pin = pin,
            HostUsername = string.IsNullOrWhiteSpace(hostUsername) ? "Host" : hostUsername,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Games.Add(session);
        await _context.SaveChangesAsync();

        return new CreateRoomResponseDto
        {
            GameId = session.Id,
            Pin = session.Pin
        };
    }

    public async Task<string> SaveRoundDrawingAsync(SaveRoundDto dto)
    {
        var game = await _context.Games
            .OrderByDescending(g => g.CreatedAt)
            .FirstOrDefaultAsync(g => g.Pin == dto.Pin);

        if (game == null)
            throw new KeyNotFoundException($"Nie znaleziono gry o kodzie PIN: {dto.Pin}");

        var base64Data = dto.ImageBase64.Contains(',')
            ? dto.ImageBase64[(dto.ImageBase64.IndexOf(',') + 1)..]
            : dto.ImageBase64;

        byte[] imageBytes = Convert.FromBase64String(base64Data);

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var drawingsFolder = Path.Combine(webRoot, "drawings");
        Directory.CreateDirectory(drawingsFolder);

        var fileName = $"game_{game.Pin}_r{dto.RoundNumber}_{Guid.NewGuid():N}.webp";
        var filePath = Path.Combine(drawingsFolder, fileName);
        await File.WriteAllBytesAsync(filePath, imageBytes);

        var relativeUrl = $"/drawings/{fileName}";

        var roundRecord = new RoundRecord
        {
            GameSessionId = game.Id,
            RoundNumber = dto.RoundNumber,
            Word = dto.Word,
            DrawerNickname = dto.DrawerNickname,
            ImageUrl = relativeUrl
        };

        _context.Rounds.Add(roundRecord);
        await _context.SaveChangesAsync();

        return relativeUrl;
    }

    public async Task<List<GameHistoryDto>> GetGamesHistoryAsync(string? hostUsername)
    {
        var query = _context.Games
            .Include(g => g.Rounds)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(hostUsername))
        {
            query = query.Where(g => g.HostUsername == hostUsername);
        }

        return await query
            .OrderByDescending(g => g.CreatedAt)
            .Select(g => new GameHistoryDto
            {
                GameId = g.Id,
                Pin = g.Pin,
                HostUsername = g.HostUsername,
                CreatedAt = g.CreatedAt,
                Rounds = g.Rounds
                    .OrderBy(r => r.RoundNumber)
                    .Select(r => new RoundHistoryDto
                    {
                        RoundNumber = r.RoundNumber,
                        Word = r.Word,
                        DrawerNickname = r.DrawerNickname,
                        ImageUrl = r.ImageUrl
                    }).ToList()
            })
            .ToListAsync();
    }
}