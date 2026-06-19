using Microsoft.Extensions.AI;

namespace WritingAgent.Api.Agents.Tools;

public sealed class AgentToolCatalog(IEnumerable<IAgentTool> tools)
{
    private readonly Lazy<IReadOnlyDictionary<string, AIFunction>> toolMap =
        new(() => BuildToolMap(tools));

    public IReadOnlyList<AIFunction> ResolveTools(IEnumerable<string> toolNames)
    {
        var resolved = new List<AIFunction>();

        foreach (var toolName in toolNames)
        {
            if (!toolMap.Value.TryGetValue(toolName, out var tool))
            {
                throw new InvalidOperationException($"Unknown agent tool '{toolName}'.");
            }

            resolved.Add(tool);
        }

        return resolved;
    }

    private static IReadOnlyDictionary<string, AIFunction> BuildToolMap(IEnumerable<IAgentTool> tools)
    {
        var mapped = new Dictionary<string, AIFunction>(StringComparer.OrdinalIgnoreCase);

        foreach (var tool in tools.Select(tool => tool.AsAIFunction()))
        {
            if (string.IsNullOrWhiteSpace(tool.Name))
            {
                throw new InvalidOperationException("Agent tool name cannot be empty.");
            }

            if (!mapped.TryAdd(tool.Name, tool))
            {
                throw new InvalidOperationException($"Duplicate agent tool '{tool.Name}'.");
            }
        }

        return mapped;
    }
}
