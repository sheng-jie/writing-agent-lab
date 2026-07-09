using System.ClientModel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OpenAI;
using WritingAgent.Domain.Articles;
using WritingAgent.Infrastructure.Agents;
using WritingAgent.Infrastructure.Agents.Tools;
using WritingAgent.Infrastructure.Persistence;
using WritingAgent.Infrastructure.Search;

namespace WritingAgent.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddWritingAgentInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("WritingAgent")
            ?? "Data Source=writing-agent.db";

        services.AddDbContext<WritingAgentDbContext>(options =>
            options.UseSqlite(connectionString));

        services.AddScoped<IArticleRepository, EfArticleRepository>();

        services.AddHttpClient("tavily", client =>
        {
            client.BaseAddress = new Uri("https://api.tavily.com/");
        });

        services.AddSingleton<IAgentTool, TavilySearchAgentTool>();
        services.AddSingleton<AgentToolCatalog>();
        services.AddSingleton<AgentAssembler>();

        services.AddChatClient(_ =>
        {
            var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")
                ?? throw new InvalidOperationException("请先设置 OPENAI_API_KEY 环境变量。");

            var openAIBaseUrl = Environment.GetEnvironmentVariable("OPENAI_BASE_URL")
                ?? throw new InvalidOperationException("请先设置 OPENAI_BASE_URL 环境变量。");

            var model = Environment.GetEnvironmentVariable("OPENAI_MODEL")
                ?? throw new InvalidOperationException("请先设置 OPENAI_MODEL 环境变量。");

            var openAIClient = new OpenAIClient(
                new ApiKeyCredential(apiKey),
                new OpenAIClientOptions
                {
                    Endpoint = new Uri(openAIBaseUrl)
                });

            return openAIClient
                .GetChatClient(model)
                .AsIChatClient();
        });

        return services;
    }
}
