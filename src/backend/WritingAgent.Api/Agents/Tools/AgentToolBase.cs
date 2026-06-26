using Microsoft.Extensions.AI;

namespace WritingAgent.Api.Agents.Tools;

public abstract class AgentToolBase : IAgentTool
{
    public AIFunction AsAIFunction()
    {
        var function = AIFunctionFactory.Create(ToolMethod, ToolName, ToolDescription);

        return RequiresApproval
            ? new ApprovalRequiredAIFunction(function)
            : function;
    }

    protected abstract string ToolName { get; }

    protected abstract string ToolDescription { get; }

    protected abstract Delegate ToolMethod { get; }

    protected virtual bool RequiresApproval => false;
}
