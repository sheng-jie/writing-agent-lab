using WritingAgent.Domain.Shared;

namespace WritingAgent.Domain.Articles;

public readonly record struct ArticleContent
{
    public ArticleContent(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new DomainException("Article content cannot be empty.");
        }

        Value = value.Trim();
    }

    public string Value { get; }

    public override string ToString() => Value;
}
