using System.ClientModel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using OpenAI;
using WritingAgent.Domain.Articles;
using WritingAgent.Infrastructure.Agents;
using WritingAgent.Infrastructure.Agents.Tools;
using WritingAgent.Infrastructure.Configuration;
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

        services
            .AddOptions<AIOptions>()
            .Bind(configuration.GetSection(AIOptions.SectionName))
            .PostConfigure(options =>
            {
                options.Tavily.BaseUrl = string.IsNullOrWhiteSpace(options.Tavily.BaseUrl)
                    ? "https://api.tavily.com/"
                    : options.Tavily.BaseUrl;
            })
            .Validate(options => !string.IsNullOrWhiteSpace(options.Chat.ApiKey), "请设置 AI:Chat:ApiKey。")
            .Validate(options => !string.IsNullOrWhiteSpace(options.Chat.BaseUrl), "请设置 AI:Chat:BaseUrl。")
            .Validate(options => !string.IsNullOrWhiteSpace(options.Chat.Model), "请设置 AI:Chat:Model。")
            .ValidateOnStart();

        services.AddScoped<IArticleRepository, EfArticleRepository>();

        services.AddHttpClient("tavily")
            .ConfigureHttpClient((sp, client) =>
            {
                var aiOptions = sp.GetRequiredService<IOptions<AIOptions>>().Value;
                client.BaseAddress = new Uri(aiOptions.Tavily.BaseUrl);
            });

        services.AddSingleton<IAgentTool, TavilySearchAgentTool>();
        services.AddSingleton<AgentToolCatalog>();
        services.AddSingleton<AgentAssembler>();

        services.AddChatClient(sp =>
        {
            var options = sp.GetRequiredService<IOptions<AIOptions>>().Value;

            var openAIClient = new OpenAIClient(
                new ApiKeyCredential(options.Chat.ApiKey),
                new OpenAIClientOptions
                {
                    Endpoint = new Uri(options.Chat.BaseUrl)
                });

            return openAIClient
                .GetChatClient(options.Chat.Model)
                .AsIChatClient();
        }).UseLogging();;

        return services;
    }
}
