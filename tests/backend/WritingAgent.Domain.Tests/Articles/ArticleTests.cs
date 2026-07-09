using FluentAssertions;
using WritingAgent.Domain.Articles;
using WritingAgent.Domain.Shared;

namespace WritingAgent.Domain.Tests.Articles;

public sealed class ArticleTests
{
    [Fact]
    public void Create_ShouldRejectEmptyTitle()
    {
        var act = () => Article.Create(" ", "可发布的正文内容", DateTimeOffset.UtcNow);

        act.Should().Throw<DomainException>()
            .WithMessage("Article title cannot be empty.");
    }

    [Fact]
    public void Create_ShouldRejectEmptyContent()
    {
        var act = () => Article.Create("标题", " ", DateTimeOffset.UtcNow);

        act.Should().Throw<DomainException>()
            .WithMessage("Article content cannot be empty.");
    }

    [Fact]
    public void Create_ShouldRepresentSavedCompletedContent()
    {
        var createdAt = new DateTimeOffset(2026, 7, 9, 10, 0, 0, TimeSpan.Zero);

        var article = Article.Create("标题", "可发布的正文内容", createdAt);

        article.Id.Should().NotBe(ArticleId.Empty);
        article.Title.Value.Should().Be("标题");
        article.Content.Value.Should().Be("可发布的正文内容");
        article.Status.Should().Be(ArticleStatus.Saved);
        article.CreatedAt.Should().Be(createdAt);
    }
}
