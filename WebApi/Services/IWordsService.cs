namespace WebApi.Services;

public interface IWordsService
{
    Task<List<string>> GetRandomWordsAsync(int count);
}