using Microsoft.Extensions.DependencyInjection;
using WritingAgent.Application.Agents;
using WritingAgent.Application.Agents.IdeaCapture;
using WritingAgent.Application.Articles;

namespace WritingAgent.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddWritingAgentApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<AgentDefinition, IdeaCaptureAgentDefinition>();
        services.AddScoped<SaveArticleUseCase>();
        services.AddScoped<GetArticleUseCase>();
        services.AddScoped<ListArticlesUseCase>();

        return services;
    }
}
