using System.ClientModel;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Hosting;
using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;
using Microsoft.Extensions.AI;
using OpenAI;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// 启用 OpenAPI 文档生成，供 Scalar 读取。
builder.Services.AddOpenApi();

// 注册 AG-UI 所需服务，后面才能通过 MapAGUI 暴露 Agent。
builder.Services.AddAGUI();

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

builder.Services.AddAIAgent(
    name: "WritingAssistantAgent",
    instructions: """
                你是一个写作助手。

                你的任务不是直接生成完整文章，而是先识别用户的写作意图：
                - 用户想写什么主题
                - 写给谁看
                - 想解决什么问题
                - 是否需要外部资料支撑

                如果只是写作目标、读者、角度不清楚，先提问。
                最终回复要帮助用户明确下一步可写的文章角度。
                """
                );

var app = builder.Build();

// 暴露 OpenAPI JSON 和 Scalar 测试界面。
app.MapOpenApi();
app.MapScalarApiReference();

// 健康检查接口，用来确认 API 服务是否启动。
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// 普通 JSON 接口：方便 curl、Scalar 或普通前端 fetch 调用。
app.MapPost("/api/writing/chat", async (
    WritingChatRequest request,
    [FromKeyedServices("WritingAssistantAgent")] AIAgent agent, // 从 DI 解析指定名称的 Agent。
    ILogger<Program> logger) =>
{
    if (string.IsNullOrWhiteSpace(request.Message))
    {
        return Results.BadRequest(new { error = "message 不能为空" });
    }

    logger.LogInformation("收到写作请求，长度：{Length}", request.Message.Length);

    AgentResponse response = await agent.RunAsync(request.Message);

    return Results.Ok(new WritingChatResponse(response.Text));
});

// AG-UI 接口：方便 CopilotKit 通过 HttpAgent 连接后端 Agent。

app.MapAGUI(agentName: "WritingAssistantAgent", pattern: "/agui/agents/writing-assistant");

app.Run();

// 最小请求/响应 DTO，后续课程再考虑移动到 Contracts 项目。
public sealed record WritingChatRequest(string Message);
public sealed record WritingChatResponse(string Reply);