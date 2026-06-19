using Microsoft.Extensions.AI;

namespace WritingAgent.Api.Agents.Tools;

public abstract class AgentToolBase : IAgentTool
{
    public AIFunction AsAIFunction() =>
        AIFunctionFactory.Create(ToolMethod, ToolName, ToolDescription);

    protected abstract string ToolName { get; }

    protected abstract string ToolDescription { get; }

    protected abstract Delegate ToolMethod { get; }
}
