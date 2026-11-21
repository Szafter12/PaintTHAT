using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApi.Data;
using WebApi.Models;

namespace WebApi.Controllers;

[ApiController]
[Route("api/rooms")]
public class RoomsController : ControllerBase
{
    private readonly AppDbContext _context;

    public RoomsController(AppDbContext context)
    {
        _context = context;
    }

    private int? GetCurrentUserId()
    {
        var subClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                       ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return int.TryParse(subClaim, out var userId) ? userId : null;
    }

    [Authorize]
    [HttpPost("create")]
    public async Task<IActionResult> CreateRoom([FromBody] CreateRoomRequest request)
    {
        var hostId = GetCurrentUserId();

        string pin;
        do
        {
            pin = Random.Shared.Next(1000, 10000).ToString();
        } while (await _context.Rooms.AnyAsync(r => r.Pin == pin && r.IsActive));

        var room = new Room
        {
            Pin = pin,
            HostUsername = request.HostUsername,
            IsActive = true,
            HostUserId = hostId
        };

        _context.Rooms.Add(room);
        await _context.SaveChangesAsync();

        return Ok(new { gameId = room.Id, pin = room.Pin });
    }

    [HttpGet("{pin}")]
    public async Task<IActionResult> GetActiveRoom(string pin)
    {
        var room = await _context.Rooms
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Pin == pin && r.IsActive);

        if (room == null)
            return NotFound(new { message = "Pokój nie istnieje lub gra została już zakończona." });

        return Ok(new
        {
            gameId = room.Id,
            pin = room.Pin,
            hostUsername = room.HostUsername,
            isActive = room.IsActive
        });
    }

    [Authorize]
    [HttpPatch("{pin}/close")]
    public async Task<IActionResult> CloseRoom(string pin)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
            return Unauthorized(new { message = "Nieprawidłowy token użytkownika." });

        var room = await _context.Rooms
            .FirstOrDefaultAsync(r => r.Pin == pin && r.IsActive);

        if (room == null)
            return NotFound(new { message = "Aktywny pokój o podanym PIN-ie nie istnieje." });

        if (room.HostUserId != null && room.HostUserId != currentUserId)
            return Forbid();

        room.IsActive = false;
        room.ClosedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Pokój {pin} został zamknięty.", closedAt = room.ClosedAt });
    }
}

public record CreateRoomRequest(string HostUsername);