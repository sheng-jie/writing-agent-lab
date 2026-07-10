#pragma warning disable MAAI001

using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Tools.Shell;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;
using WritingAgent.Application.WritingWorkflows.Clarification;
using WritingAgent.Infrastructure.Agents.Tools;

namespace WritingAgent.Infrastructure.Agents;

public sealed class AgentAssembler(
    IChatClient chatClient,
    AgentToolCatalog toolCatalog,
    ILoggerFactory loggerFactory,
    IServiceProvider serviceProvider)
{
    public AIAgent Assemble(AgentDefinition definition)
    {
        var tools = toolCatalog.ResolveTools(definition.AllowedToolNames);
        var skillProviders = BuildSkillProviders(definition.SkillNames);

        var agent = new ChatClientAgent(
            chatClient,
            new ChatClientAgentOptions
            {
                Name = definition.Name,
                Description = definition.Description,
                ChatOptions = new ChatOptions
                {
                    Instructions = definition.Instructions,
                    Tools = tools.Cast<AITool>().ToArray()
                },
                EnableNonApprovalRequiredFunctionBypassing = true,
                AIContextProviders = skillProviders,
                ChatHistoryProvider = new InMemoryChatHistoryProvider()
            },
            loggerFactory,
            serviceProvider);

        return agent;
    }

    private IReadOnlyList<AIContextProvider> BuildSkillProviders(IReadOnlyList<string> skillNames)
    {
        if (skillNames.Count == 0)
        {
            return [];
        }

        var providerBuilder = new AgentSkillsProviderBuilder()
            .UseFileScriptRunner(RunFileSkillScriptAsync);

        foreach (var skillName in skillNames)
        {
            var skillPath = Path.Combine(AppContext.BaseDirectory, "Skills", skillName);
            if (!Directory.Exists(skillPath))
            {
                throw new InvalidOperationException($"Unknown skill '{skillName}'.");
            }

            providerBuilder.UseFileSkill(skillPath);
        }

        return [providerBuilder.Build()];
    }

    private static async Task<object?> RunFileSkillScriptAsync(
        AgentFileSkill skill,
        AgentFileSkillScript script,
        JsonElement? arguments,
        IServiceProvider? serviceProvider,
        CancellationToken cancellationToken)
    {
        var command = BuildScriptCommand(script.FullPath, arguments);

        await using var shell = new LocalShellExecutor(new LocalShellExecutorOptions
        {
            Mode = ShellMode.Stateless,
            WorkingDirectory = Path.GetDirectoryName(script.FullPath),
            Timeout = TimeSpan.FromSeconds(5),
            MaxOutputBytes = 8 * 1024
        });

        var result = await shell.RunAsync(command, cancellationToken);
        if (result.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"Skill script '{skill.Frontmatter.Name}/{script.Name}' failed with exit code {result.ExitCode}: {result.Stderr}");
        }

        return result.Stdout.Trim();
    }

    private static string BuildScriptCommand(string scriptPath, JsonElement? arguments)
    {
        return string.Join(' ',
            new[] { QuoteForShell(scriptPath) }
                .Concat(GetScriptArguments(arguments).Select(QuoteForShell)));
    }

    private static string QuoteForShell(string value) =>
        $"'{value.Replace("'", "'\\''", StringComparison.Ordinal)}'";

    private static IEnumerable<string> GetScriptArguments(JsonElement? arguments)
    {
        if (arguments is not { } element)
        {
            return [];
        }

        if (element.ValueKind == JsonValueKind.Object
            && element.TryGetProperty("arguments", out var scriptArguments))
        {
            return GetScriptArguments(scriptArguments);
        }

        if (element.ValueKind == JsonValueKind.Array)
        {
            return element.EnumerateArray().Select(GetArgumentValue).ToArray();
        }

        if (element.ValueKind == JsonValueKind.Object)
        {
            return [element.GetRawText()];
        }

        return [GetArgumentValue(element)];
    }

    private static string GetArgumentValue(JsonElement element) =>
        element.ValueKind == JsonValueKind.String
            ? element.GetString() ?? string.Empty
            : element.ToString();
}
