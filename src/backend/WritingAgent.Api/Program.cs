#pragma warning disable MAAI001

using System.ComponentModel;
using System.ClientModel;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Hosting;
using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;
using Microsoft.Extensions.AI;
using OpenAI;
using Scalar.AspNetCore;
using WritingAgent.Shared;

var builder = WebApplication.CreateBuilder(args);

// 启用 OpenAPI 文档生成，供 Scalar 读取。
builder.Services.AddOpenApi();

// 注册 AG-UI 所需服务，后面才能通过 MapAGUI 暴露 Agent。
builder.Services.AddAGUI();

// Tavily Search 工具使用命名 HttpClient，API Key 仍从后端环境变量读取。
builder.Services.AddHttpClient("tavily", client =>
{
    client.BaseAddress = new Uri("https://api.tavily.com/");
});

// 使用 MEAI 的 AddChatClient 注册 IChatClient，而不是手动注册单例。
builder.Services.AddChatClient(_ =>
{
    // DeepSeek API Key 只放在后端环境变量里，不进入前端。
    var apiKey = Environment.GetEnvironmentVariable("DEEPSEEK_API_KEY")
        ?? throw new InvalidOperationException("请先设置 DEEPSEEK_API_KEY 环境变量。");

    // DeepSeek 使用 OpenAI 兼容接口，因此仍然通过 OpenAIClient 创建客户端。
    var openAIClient = new OpenAIClient(
        new ApiKeyCredential(apiKey),
        new OpenAIClientOptions
        {
            // 指向 DeepSeek 的 OpenAI-compatible endpoint。
            Endpoint = new Uri("https://api.deepseek.com")
        });

    return openAIClient
        .GetChatClient("deepseek-chat")
        .AsIChatClient();
});

// 先注册 IChatClient，再注册 AIAgent。
// 这样 Agent 可以从 DI 中解析模型客户端，而不是我们手动 new 或直接注册单例实例。

// 使用 MAF Hosting 的 AddAIAgent 注册 Agent，其会自动从 DI 解析默认的 IChatClient 并注入到 Agent 中。
const string ClarificationInstruction = """
    你是写作工作流中的 ClarificationAgent。

    你的唯一职责：把用户模糊、零散或过宽的写作想法澄清成一份可执行的 Writing Brief。
    你不生成搜索指引，不做正式研究，不写正文。

    当需要判断写作意图是否足够、应该追问哪些问题、Brief 输出格式是什么时，
    优先使用 writing-brief-skill。

    如果判断信息已经足够，直接输出 Writing Brief，不要为了补全细节而继续调用工具追问。

    需要追问时，优先调用名为 clarification 的前端工具。
    遇到陌生概念时，可以调用 TavilySearchAsync 快速理解背景。
    """;


builder.Services.AddAIAgent(
    "ClarificationAgent",
    (sp, name) =>
    {
        var chatClient = sp.GetRequiredService<IChatClient>();
        var httpClientFactory = sp.GetRequiredService<IHttpClientFactory>();
        var tavilyApiKey = Environment.GetEnvironmentVariable("TAVILY_API_KEY");

        [Description("快速搜索写作请求中的陌生概念、产品名、缩写或近期背景")]
        Task<string> TavilySearchAsync(
            [Description("搜索关键词，应该简洁具体")] string query)
        {
            var httpClient = httpClientFactory.CreateClient("tavily");
            return SearchTavilyAsync(httpClient, tavilyApiKey, query);
        }

        var writingBriefSkill = WritingBriefSkillFactory.Create();
        var skillsProvider = new AgentSkillsProvider(writingBriefSkill);

        var agentOptions = new ChatClientAgentOptions
        {
            Name = name,
            Description = "把模糊写作想法澄清成 Writing Brief 的 Agent",
            ChatOptions = new ChatOptions
            {
                Instructions = ClarificationInstruction,
                Tools =
                [
                    AIFunctionFactory.Create(TavilySearchAsync)
                ]
            },
            AIContextProviders =
            [
                skillsProvider
            ]
        };

        return chatClient.AsAIAgent(agentOptions);
    });

var app = builder.Build();

// 暴露 OpenAPI JSON 和 Scalar 测试界面。
app.MapOpenApi();
app.MapScalarApiReference();

// 健康检查接口，用来确认 API 服务是否启动。
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// 普通 JSON 接口：方便 curl、Scalar 或普通前端 fetch 调用。
app.MapPost("/api/writing/chat", async (
    WritingChatRequest request,
    [FromKeyedServices("ClarificationAgent")] AIAgent agent, // 从 DI 解析指定名称的 Agent。
    ILogger<Program> logger) =>
{
    if (string.IsNullOrWhiteSpace(request.Message))
    {
        return Results.BadRequest(new { error = "message 不能为空" });
    }

    logger.LogInformation("收到澄清请求，长度：{Length}", request.Message.Length);

    AgentResponse response = await agent.RunAsync(request.Message);

    return Results.Ok(new WritingChatResponse(response.Text));
});

// AG-UI 接口：方便 CopilotKit 通过 HttpAgent 连接后端 Agent。

app.MapAGUI(agentName: "ClarificationAgent", pattern: "/agui/agents/clarification-agent");

app.Run();

static async Task<string> SearchTavilyAsync(HttpClient httpClient, string? apiKey, string query)
{
    if (string.IsNullOrWhiteSpace(apiKey))
    {
        return "未配置 TAVILY_API_KEY，无法执行真实搜索。";
    }

    var response = await httpClient.PostAsJsonAsync("search", new
    {
        api_key = apiKey,
        query,
        search_depth = "basic",
        include_answer = true,
        max_results = 3
    });

    var json = await response.Content.ReadAsStringAsync();

    if (!response.IsSuccessStatusCode)
    {
        return $"Tavily 搜索失败：{json}";
    }

    using var document = JsonDocument.Parse(json);
    var root = document.RootElement;

    if (root.TryGetProperty("answer", out var answer))
    {
        Console.WriteLine($"========={answer.GetString()}==========");
        return answer.GetString() ?? "Tavily 没有返回摘要。";
    }

    return "Tavily 没有返回摘要。";
}

// 最小请求/响应 DTO，后续课程再考虑移动到 Contracts 项目。
public sealed record WritingChatRequest(string Message);
public sealed record WritingChatResponse(string Reply);