using Microsoft.AspNetCore.Mvc;
using WebApi.Services;

namespace WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WordsController : ControllerBase
{
    private readonly IWordsService _wordsService;

    public WordsController(IWordsService wordsService)
    {
        _wordsService = wordsService;
    }

    [HttpGet("random")]
    public async Task<IActionResult> GetRandomWords([FromQuery] int count = 15)
    {
        var words = await _wordsService.GetRandomWordsAsync(count);
        return Ok(words);
    }
}