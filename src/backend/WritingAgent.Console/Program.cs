using System.ClientModel;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using OpenAI;

var apiKey = Environment.GetEnvironmentVariable("DEEPSEEK_API_KEY")
    ?? throw new InvalidOperationException("请先设置 DEEPSEEK_API_KEY 环境变量。");

var openAIClient = new OpenAIClient(
    new ApiKeyCredential(apiKey),
    new OpenAIClientOptions
    {
    // 把默认 OpenAI endpoint 换成 DeepSeek endpoint。
        Endpoint = new Uri("https://api.deepseek.com")
    });

IChatClient chatClient = openAIClient
    .GetChatClient("deepseek-chat")
    .AsIChatClient();

AIAgent writingAgent = chatClient.AsAIAgent(
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
    """);

Console.WriteLine("WritingAssistantAgent 已启动。输入 exit 退出。\n");

// 在循环外维护历史消息，每一轮都把用户输入和 Agent 回复追加进去。
var history = new List<ChatMessage>();

while (true)
{
    Console.Write("你：");
    var input = Console.ReadLine();

    if (string.IsNullOrWhiteSpace(input))
    {
        continue;
    }

    if (input.Equals("exit", StringComparison.OrdinalIgnoreCase))
    {
        break;
    }

    try
    {
        // 把用户输入追加进历史消息。
        history.Add(new ChatMessage(ChatRole.User, input));

        // 把完整历史交给 Agent，Agent 就能基于前文继续回答。
        AgentResponse response = await writingAgent.RunAsync(history);

        // 不只保存 response.Text，而是保存完整消息。
        // 后续如果出现工具调用、工具结果，也能保留在历史里。
        history.AddRange(response.Messages);

        Console.WriteLine($"\nAgent：{response.Text}\n");
    }
    catch (Exception ex)
    {
        // 教学示例中直接打印异常；真实项目里应该接入结构化日志。
        Console.WriteLine($"\n调用失败：{ex.Message}\n");
    }
}