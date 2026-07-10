using System.ComponentModel.DataAnnotations;

namespace WritingAgent.Infrastructure.Configuration;

public sealed class AIOptions
{
    public const string SectionName = "AI";

    [Required]
    public ChatOptions Chat { get; set; } = new();

    [Required]
    public TavilyOptions Tavily { get; set; } = new();

    public sealed class ChatOptions
    {
        [Required]
        public string ApiKey { get; set; } = string.Empty;

        [Required]
        public string BaseUrl { get; set; } = string.Empty;

        [Required]
        public string Model { get; set; } = string.Empty;
    }

    public sealed class TavilyOptions
    {
        public string? ApiKey { get; set; }

        public string BaseUrl { get; set; } = "https://api.tavily.com/";
    }
}