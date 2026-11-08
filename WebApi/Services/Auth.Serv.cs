using Microsoft.EntityFrameworkCore;
using WebApi.Data;
using WebApi.DTOs;
using WebApi.Models;

namespace WebApi.Services;

public interface IAuthService
{
    Task<bool> RegisterAsync(RegisterHostRequestDto dto);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;

    public AuthService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> RegisterAsync(RegisterHostRequestDto dto)
    {
        var emailExists = await _context.HostUsers.AnyAsync(u => u.Email == dto.Email);
        if (emailExists)
        {
            throw new Exception("Konto z podanym adresem email już istnieje.");
        }

        var newUser = new HostUser
        {
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.HostUsers.Add(newUser);
        await _context.SaveChangesAsync();

        return true;
    }
}