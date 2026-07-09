using Microsoft.EntityFrameworkCore;
using WritingAgent.Domain.Articles;

namespace WritingAgent.Infrastructure.Persistence;

public sealed class EfArticleRepository(WritingAgentDbContext dbContext) : IArticleRepository
{
    public async Task SaveAsync(Article article, CancellationToken cancellationToken)
    {
        dbContext.Articles.Add(ToRecord(article));
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Article?> GetByIdAsync(ArticleId id, CancellationToken cancellationToken)
    {
        var record = await dbContext.Articles
            .AsNoTracking()
            .SingleOrDefaultAsync(article => article.Id == id.Value, cancellationToken);

        return record is null ? null : ToDomain(record);
    }

    public async Task<IReadOnlyList<Article>> ListAsync(CancellationToken cancellationToken)
    {
        var records = await dbContext.Articles
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return records
            .OrderByDescending(article => article.CreatedAt)
            .Select(ToDomain)
            .ToArray();
    }

    private static ArticleRecord ToRecord(Article article) =>
        new()
        {
            Id = article.Id.Value,
            Title = article.Title.Value,
            Content = article.Content.Value,
            Status = article.Status,
            CreatedAt = article.CreatedAt
        };

    private static Article ToDomain(ArticleRecord record) =>
        Article.Rehydrate(
            new ArticleId(record.Id),
            new ArticleTitle(record.Title),
            new ArticleContent(record.Content),
            record.Status,
            record.CreatedAt);
}
