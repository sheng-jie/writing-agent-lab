namespace WritingAgent.Domain.Articles;

public sealed class Article
{
    private Article(
        ArticleId id,
        ArticleTitle title,
        ArticleContent content,
        ArticleStatus status,
        DateTimeOffset createdAt)
    {
        Id = id;
        Title = title;
        Content = content;
        Status = status;
        CreatedAt = createdAt;
    }

    public ArticleId Id { get; }

    public ArticleTitle Title { get; }

    public ArticleContent Content { get; }

    public ArticleStatus Status { get; }

    public DateTimeOffset CreatedAt { get; }

    public static Article Create(string title, string content, DateTimeOffset createdAt) =>
        new(
            ArticleId.New(),
            new ArticleTitle(title),
            new ArticleContent(content),
            ArticleStatus.Saved,
            createdAt);

    public static Article Rehydrate(
        ArticleId id,
        ArticleTitle title,
        ArticleContent content,
        ArticleStatus status,
        DateTimeOffset createdAt) =>
        new(id, title, content, status, createdAt);
}
