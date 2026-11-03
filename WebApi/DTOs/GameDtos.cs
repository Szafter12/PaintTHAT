namespace WebApi.DTOs;

public class CreateRoomRequestDto
{
    public string? HostUsername { get; set; }
}

public class CreateRoomResponseDto
{
    public Guid GameId { get; set; }
    public string Pin { get; set; } = string.Empty;
}

public class SaveRoundDto
{
    public string Pin { get; set; } = string.Empty;
    public int RoundNumber { get; set; }
    public string Word { get; set; } = string.Empty;
    public string DrawerNickname { get; set; } = string.Empty;
    public string ImageBase64 { get; set; } = string.Empty;
}

public class RoundHistoryDto
{
    public int RoundNumber { get; set; }
    public string Word { get; set; } = string.Empty;
    public string DrawerNickname { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
}

public class GameHistoryDto
{
    public Guid GameId { get; set; }
    public string Pin { get; set; } = string.Empty;
    public string HostUsername { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<RoundHistoryDto> Rounds { get; set; } = new();
}