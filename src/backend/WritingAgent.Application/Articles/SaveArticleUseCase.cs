using WritingAgent.Domain.Articles;
using WritingAgent.Domain.Shared;

namespace WritingAgent.Application.Articles;

public sealed class SaveArticleUseCase(
    IArticleRepository articleRepository,
    TimeProvider timeProvider)
{
    public async Task<ArticleDto> ExecuteAsync(
        SaveArticleCommand command,
        CancellationToken cancellationToken)
    {
        Article article;
        try
        {
            article = Article.Create(
                command.Title,
                command.Content,
                timeProvider.GetUtcNow());
        }
        catch (DomainException exception)
        {
            throw new ArticleValidationException(exception.Message);
        }

        await articleRepository.SaveAsync(article, cancellationToken);

        return ArticleDto.FromArticle(article);
    }
}
