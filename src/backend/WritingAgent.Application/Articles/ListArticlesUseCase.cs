using WritingAgent.Domain.Articles;

namespace WritingAgent.Application.Articles;

public sealed class ListArticlesUseCase(IArticleRepository articleRepository)
{
    public async Task<IReadOnlyList<ArticleDto>> ExecuteAsync(CancellationToken cancellationToken)
    {
        var articles = await articleRepository.ListAsync(cancellationToken);

        return articles.Select(ArticleDto.FromArticle).ToArray();
    }
}
