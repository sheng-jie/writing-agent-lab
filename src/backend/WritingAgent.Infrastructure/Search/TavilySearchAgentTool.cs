using System.ComponentModel;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;
using WritingAgent.Application.WritingWorkflows.Clarification;
using WritingAgent.Infrastructure.Agents.Tools;
using WritingAgent.Infrastructure.Configuration;

namespace WritingAgent.Infrastructure.Search;

public sealed class TavilySearchAgentTool(
    IHttpClientFactory httpClientFactory,
    IOptions<AIOptions> options) : AgentToolBase
{
    private const string DescriptionText = "快速搜索写作请求中的陌生概念、产品名、缩写或近期背景。";

    protected override string ToolName => AgentToolNames.TavilySearch;

    protected override string ToolDescription => DescriptionText;

    protected override Delegate ToolMethod => SearchAsync;

    [Description(DescriptionText)]
    public async Task<string> SearchAsync(
        [Description("搜索关键词，应该简洁具体。")]
        string query,
        CancellationToken cancellationToken = default)
    {
        var apiKey = options.Value.Tavily.ApiKey;

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return "未配置 AI:Tavily:ApiKey，无法执行真实搜索。";
        }

        var httpClient = httpClientFactory.CreateClient("tavily");
        var response = await httpClient.PostAsJsonAsync("search", new
        {
            api_key = apiKey,
            query,
            search_depth = "basic",
            include_answer = true,
            max_results = 3
        }, cancellationToken);

        var json = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return $"Tavily 搜索失败：{json}";
        }

        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;

        if (root.TryGetProperty("answer", out var answer))
        {
            return answer.GetString() ?? "Tavily 没有返回摘要。";
        }

        return "Tavily 没有返回摘要。";
    }
}
