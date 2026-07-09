using Microsoft.Extensions.AI;

namespace WritingAgent.Infrastructure.Agents.Tools;

public interface IAgentTool
{
    AIFunction AsAIFunction();
}
