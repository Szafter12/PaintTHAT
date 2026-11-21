namespace WebApi.Models;

public class Room
{
    public int Id { get; set; }
    public string Pin { get; set; } = string.Empty;
    public string HostUsername { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }

    public int? HostUserId { get; set; }
    public HostUser? HostUser { get; set; }
}