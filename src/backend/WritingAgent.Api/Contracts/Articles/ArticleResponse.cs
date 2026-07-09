using WritingAgent.Application.Articles;

namespace WritingAgent.Api.Contracts.Articles;

public sealed record ArticleResponse(
    Guid Id,
    string Title,
    string Content,
    string Status,
    DateTimeOffset CreatedAt)
{
    public static ArticleResponse FromDto(ArticleDto article) =>
        new(article.Id, article.Title, article.Content, article.Status, article.CreatedAt);
}
