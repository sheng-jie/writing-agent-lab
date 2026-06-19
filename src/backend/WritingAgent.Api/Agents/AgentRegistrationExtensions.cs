using WritingAgent.Api.Agents.Tools;

namespace WritingAgent.Api.Agents;

public static class AgentRegistrationExtensions
{
    public static IServiceCollection AddWritingAgents(this IServiceCollection services)
    {
        services.AddSingleton<IAgentTool, TavilySearchAgentTool>();
        services.AddSingleton<AgentToolCatalog>();

        services.AddSingleton<AgentDefinition, ClarificationAgentDefinition>();

        services.AddSingleton<AgentAssembler>();

        return services;
    }
}
