namespace WritingAgent.Domain.Articles;

public readonly record struct ArticleId(Guid Value)
{
    public static ArticleId Empty => new(Guid.Empty);

    public static ArticleId New() => new(Guid.NewGuid());

    public override string ToString() => Value.ToString();
}
