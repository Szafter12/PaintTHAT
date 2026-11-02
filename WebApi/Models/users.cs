using WebApi.Models;


namespace WebApi.Models
{
    public class users
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Passwd { get; set; } = string.Empty;
        public int Score { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


    }
}
