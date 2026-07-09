using Microsoft.Extensions.DependencyInjection;
using WritingAgent.Application.Articles;
using WritingAgent.Application.WritingWorkflows.Clarification;

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
