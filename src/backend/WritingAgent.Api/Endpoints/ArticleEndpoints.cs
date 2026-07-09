using WritingAgent.Api.Contracts.Articles;
using WritingAgent.Application.Articles;

namespace WritingAgent.Api.Endpoints;

public static class ArticleEndpoints
{
    public static IEndpointRouteBuilder MapArticleEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/articles")
            .WithTags("Articles");

        group.MapPost("", async (
            SaveArticleRequest request,
            SaveArticleUseCase useCase,
            CancellationToken cancellationToken) =>
        {
            ArticleDto article;
            try
            {
                article = await useCase.ExecuteAsync(
                    new SaveArticleCommand(request.Title, request.Content),
                    cancellationToken);
            }
            catch (ArticleValidationException exception)
            {
                return Results.BadRequest(new { error = exception.Message });
            }

            return Results.Created($"/api/articles/{article.Id}", ArticleResponse.FromDto(article));
        });

        group.MapGet("/{id:guid}", async (
            Guid id,
            GetArticleUseCase useCase,
            CancellationToken cancellationToken) =>
        {
            var article = await useCase.ExecuteAsync(id, cancellationToken);

            return article is null
                ? Results.NotFound()
                : Results.Ok(ArticleResponse.FromDto(article));
        });

        group.MapGet("", async (
            ListArticlesUseCase useCase,
            CancellationToken cancellationToken) =>
        {
            var articles = await useCase.ExecuteAsync(cancellationToken);

            return Results.Ok(articles.Select(ArticleResponse.FromDto));
        });

        return endpoints;
    }
}
