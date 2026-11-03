using WebApi.DTOs;

namespace WebApi.Services;

public interface IGameService
{
    Task<CreateRoomResponseDto> CreateRoomAsync(string? hostUsername);
    Task<string> SaveRoundDrawingAsync(SaveRoundDto dto);
    Task<List<GameHistoryDto>> GetGamesHistoryAsync(string? hostUsername);
}