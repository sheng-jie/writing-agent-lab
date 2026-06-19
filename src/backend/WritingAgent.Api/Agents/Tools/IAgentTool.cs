using Microsoft.Extensions.AI;

namespace WritingAgent.Api.Agents.Tools;

public interface IAgentTool
{
    AIFunction AsAIFunction();
}
