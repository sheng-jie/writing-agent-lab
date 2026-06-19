#pragma warning disable MAAI001

using System.ClientModel;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Hosting;
using Microsoft.Extensions.AI;
using OpenAI;
using Scalar.AspNetCore;
using WritingAgent.Api.Agents;

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

builder.Services.AddWritingAgents();

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

var app = builder.Build();

app.MapWritingAgents();

// 暴露 OpenAPI JSON 和 Scalar 测试界面。
app.MapOpenApi();
app.MapScalarApiReference();

// 健康检查接口，用来确认 API 服务是否启动。
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// 普通 JSON 接口：方便 curl、Scalar 或普通前端 fetch 调用。
app.MapPost("/api/writing/chat", async (
    WritingChatRequest request,
    AgentAssembler assembler,
    IEnumerable<AgentDefinition> definitions,
    ILogger<Program> logger) =>
{
    if (string.IsNullOrWhiteSpace(request.Message))
    {
        return Results.BadRequest(new { error = "message 不能为空" });
    }

    logger.LogInformation("收到澄清请求，长度：{Length}", request.Message.Length);

    var definition = definitions.Single(definition => definition.Id == AgentIds.ClarificationAgent);
    var agent = assembler.Assemble(definition);
    AgentResponse response = await agent.RunAsync(request.Message);

    return Results.Ok(new WritingChatResponse(response.Text));
});

app.Run();

// 最小请求/响应 DTO，后续课程再考虑移动到 Contracts 项目。
public sealed record WritingChatRequest(string Message);
public sealed record WritingChatResponse(string Reply);