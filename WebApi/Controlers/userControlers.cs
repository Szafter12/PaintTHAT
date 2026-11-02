using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApi.Data;
using WebApi.Models;

namespace WebApi.Controllers;

    [ApiController]
    [Route("api/[controller]")]
    public class userController : ControllerBase
    {
        private readonly app_db _db;

        public userController(app_db db)
        {
            _db = db;
        }

        // pobieranie wszystkich graczy
        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var user = await _db.Users.ToListAsync();
            return Ok(user);
        }

        // pobieranie gracza po ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound("gracz nie istnieje.");
            return Ok(user);
        }

        // rejestracja nowego gracza z aplikacji mobilnej
        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] users newUser)
        {
            _db.Users.Add(newUser);
            await _db.SaveChangesAsync();
            return CreatedAtAction(nameof(GetUser), new { id = newUser.Id }, newUser);
        }

    }

