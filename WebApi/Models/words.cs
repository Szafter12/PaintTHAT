using WebApi.Models;

namespace WebApi.Models
{
    public class words
    {
        public int Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public string Difficulty { get; set; } = "Łatwy";

    }
}

