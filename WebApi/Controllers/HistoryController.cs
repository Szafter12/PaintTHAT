using Microsoft.AspNetCore.Mvc;
using WebApi.DTOs;
using WebApi.Services;

namespace WebApi.Controllers;

[ApiController]
[Route("api/history")]
public class HistoryController : ControllerBase
{
    private readonly IGameService _gameService;

    public HistoryController(IGameService gameService)
    {
        _gameService = gameService;
    }

    [HttpPost("save-round")]
    public async Task<IActionResult> SaveRound([FromBody] SaveRoundDto dto)
    {
        try
        {
            var imageUrl = await _gameService.SaveRoundDrawingAsync(dto);
            return Ok(new { imageUrl });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<GameHistoryDto>>> GetHistory([FromQuery] string? hostUsername = null)
    {
        var history = await _gameService.GetGamesHistoryAsync(hostUsername);
        return Ok(history);
    }
}