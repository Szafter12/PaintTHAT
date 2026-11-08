using Microsoft.AspNetCore.Mvc;
using WebApi.DTOs;
using WebApi.Services;

namespace WebApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterHostRequestDto request)
    {
        try
        {
            await _authService.RegisterAsync(request);
            return Ok(new { message = "Rejestracja przebiegła pomyślnie." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}