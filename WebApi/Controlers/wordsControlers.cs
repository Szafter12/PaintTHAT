using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApi.Data;
using WebApi.Models;

namespace WebApi.Controllers;

    [ApiController]
    [Route("api/[controller]")]
    public class WordsController : ControllerBase
    {
        private readonly app_db _db;

        public WordsController(app_db db)
        {
            _db = db;
        }

        // pobieranie listy haseł do gry
        [HttpGet]
        public async Task<IActionResult> GetWords()
        {
            var words = await _db.Words.ToListAsync();
            return Ok(words);
        }

        // dodawanie nowego hasła do bazy
        [HttpPost]
        public async Task<IActionResult> AddWord([FromBody] words newWord)
        {
            _db.Words.Add(newWord);
            await _db.SaveChangesAsync();
            return Ok(newWord);
        }
    }
