using Microsoft.Extensions.DependencyInjection;
using WritingAgent.Application.Agents;
using WritingAgent.Application.Agents.Clarification;
using WritingAgent.Application.Articles;

namespace WritingAgent.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddWritingAgentApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton<AgentDefinition, ClarificationAgentDefinition>();
        services.AddScoped<SaveArticleUseCase>();
        services.AddScoped<GetArticleUseCase>();
        services.AddScoped<ListArticlesUseCase>();

        return services;
    }
}
