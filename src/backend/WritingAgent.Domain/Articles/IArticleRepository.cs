namespace WritingAgent.Domain.Articles;

public interface IArticleRepository
{
    Task SaveAsync(Article article, CancellationToken cancellationToken);

    Task<Article?> GetByIdAsync(ArticleId id, CancellationToken cancellationToken);

    Task<IReadOnlyList<Article>> ListAsync(CancellationToken cancellationToken);
}
