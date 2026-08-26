using Microsoft.Agents.AI.Hosting;
using Microsoft.AspNetCore.HttpLogging;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using WritingAgent.Api.Agents;
using WritingAgent.Api.Endpoints;
using WritingAgent.Application;
using WritingAgent.Application.Agents;
using WritingAgent.Infrastructure;
using WritingAgent.Infrastructure.Agents;
using WritingAgent.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// builder.Services.AddHttpLogging(logging =>
// {
//     logging.LoggingFields = HttpLoggingFields.RequestPropertiesAndHeaders | HttpLoggingFields.RequestBody
//         | HttpLoggingFields.ResponsePropertiesAndHeaders | HttpLoggingFields.ResponseBody;
//     logging.RequestBodyLogLimit = int.MaxValue;
//     logging.ResponseBodyLogLimit = int.MaxValue;
// });

// 启用 OpenAPI 文档生成，供 Scalar 读取。
builder.Services.AddOpenApi();

// 注册 AG-UI 所需服务，后面才能通过 MapAGUI 暴露 Agent。
builder.Services.AddAGUI();

builder.Services.AddWritingAgentApplication();
builder.Services.AddWritingAgentInfrastructure(builder.Configuration);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
	var definitions = scope.ServiceProvider.GetRequiredService<IEnumerable<AgentDefinition>>();
	var agentAssembler = scope.ServiceProvider.GetRequiredService<AgentAssembler>();
	agentAssembler.ValidateDefinitions(definitions);

	var dbContext = scope.ServiceProvider.GetRequiredService<WritingAgentDbContext>();
	await dbContext.Database.MigrateAsync();
}

app.MapWritingAgents();
app.MapArticleEndpoints();

// 暴露 OpenAPI JSON 和 Scalar 测试界面。
app.MapOpenApi();
app.MapScalarApiReference();

// 健康检查接口，用来确认 API 服务是否启动。
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();
