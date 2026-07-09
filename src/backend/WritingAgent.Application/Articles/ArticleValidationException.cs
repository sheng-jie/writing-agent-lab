namespace WritingAgent.Application.Articles;

public sealed class ArticleValidationException(string message) : Exception(message);
