using Microsoft.AspNetCore.Mvc;
using WebApi.DTOs;
using WebApi.Services;

namespace WebApi.Controllers;

[ApiController]
[Route("api/rooms")]
public class RoomsController : ControllerBase
{
    private readonly IGameService _gameService;

    public RoomsController(IGameService gameService)
    {
        _gameService = gameService;
    }

    [HttpPost("create")]
    public async Task<ActionResult<CreateRoomResponseDto>> CreateRoom([FromBody] CreateRoomRequestDto? request = null)
    {
        var result = await _gameService.CreateRoomAsync(request?.HostUsername);
        return Ok(result);
    }
}