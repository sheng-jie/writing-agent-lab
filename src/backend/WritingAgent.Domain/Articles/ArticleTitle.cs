using WritingAgent.Domain.Shared;

namespace WritingAgent.Domain.Articles;

public readonly record struct ArticleTitle
{
    public ArticleTitle(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new DomainException("Article title cannot be empty.");
        }

        Value = value.Trim();
    }

    public string Value { get; }

    public override string ToString() => Value;
}
