using WritingAgent.Domain.Articles;

namespace WritingAgent.Application.Articles;

public sealed class GetArticleUseCase(IArticleRepository articleRepository)
{
    public async Task<ArticleDto?> ExecuteAsync(Guid id, CancellationToken cancellationToken)
    {
        var article = await articleRepository.GetByIdAsync(new ArticleId(id), cancellationToken);

        return article is null ? null : ArticleDto.FromArticle(article);
    }
}
