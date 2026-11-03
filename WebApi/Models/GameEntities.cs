using System.ComponentModel.DataAnnotations;

namespace WebApi.Models;

public class GameSession
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [MaxLength(6)]
    public string Pin { get; set; } = string.Empty;
    
    public string HostUsername { get; set; } = "Host";
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public bool IsActive { get; set; } = true;

    // One to many relationship with RoundRecord
    public List<RoundRecord> Rounds { get; set; } = new();
}

public class RoundRecord
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public int RoundNumber { get; set; }
    
    [Required]
    public string Word { get; set; } = string.Empty;
    
    [Required]
    public string DrawerNickname { get; set; } = string.Empty;
    
    // Path to the image file in the server
    [Required]
    public string ImageUrl { get; set; } = string.Empty;

    // Foregain key to GameSession
    public Guid GameSessionId { get; set; }
    public GameSession? GameSession { get; set; }
}