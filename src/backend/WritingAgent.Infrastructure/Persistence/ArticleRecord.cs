using WritingAgent.Domain.Articles;

namespace WritingAgent.Infrastructure.Persistence;

public sealed class ArticleRecord
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public ArticleStatus Status { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
