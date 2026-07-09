using WritingAgent.Domain.Articles;

namespace WritingAgent.Application.Articles;

public sealed record ArticleDto(
    Guid Id,
    string Title,
    string Content,
    string Status,
    DateTimeOffset CreatedAt)
{
    public static ArticleDto FromArticle(Article article) =>
        new(
            article.Id.Value,
            article.Title.Value,
            article.Content.Value,
            article.Status.ToString(),
            article.CreatedAt);
}
