using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using WebApi.Data;
using WebApi.DTOs;
using WebApi.Models;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;

namespace WebApi.Services;

public interface IAuthService
{
    Task<bool> RegisterAsync(RegisterHostRequestDto dto);
    Task<string> LoginAsync(LoginHostRequestDto dto);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<bool> RegisterAsync(RegisterHostRequestDto dto)
    {
        var emailExists = await _context.HostUsers.AnyAsync(u => u.Email == dto.Email);
        if (emailExists) throw new Exception("Konto z podanym adresem email już istnieje.");

        var newUser = new HostUser
        {
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        _context.HostUsers.Add(newUser);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<string> LoginAsync(LoginHostRequestDto dto)
    {
        // 1. Szukamy gościa w bazie
        var user = await _context.HostUsers.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || !user.IsActive)
        {
            throw new Exception("Nieprawidłowy email lub hasło.");
        }

        // 2. Weryfikujemy hash
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
        {
            throw new Exception("Nieprawidłowy email lub hasło.");
        }

        // 3. Budujemy payload tokena (Claims)
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // 4. Podpisujemy token kluczem z appsettings
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(double.Parse(_configuration["JwtSettings:ExpiryMinutes"]!)),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}