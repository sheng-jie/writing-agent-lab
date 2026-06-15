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

AIAgent clarificationAgent = chatClient.AsAIAgent(
    name: "ClarificationAgent",
    instructions: """
        你是写作工作流中的 Clarification Agent。

        你的唯一职责：把用户模糊、零散或过宽的写作想法澄清成一份可执行的 Writing Brief。

        你不生成候选选题，不做正式研究，不写正文。

        如果缺少会明显影响后续选题、搜索或写作结构的信息，先用自然语言一次提出 2-4 个关键问题。

        优先澄清这些维度：
        - 目标读者：写给谁看
        - 核心问题：文章要回答什么问题
        - 核心立场：希望表达什么判断
        - 内容边界：写什么，不写什么
        - 发布场景：公众号、博客、小红书、内部文档等
        - 风格倾向：理性分析、故事化、犀利评论、实操指南等

        写作目标足够明确后，输出固定 Markdown 模板：

        ## Writing Brief
        - 写作目标：
        - 目标读者：
        - 核心问题：
        - 核心立场：
        - 内容边界：写……；不写……
        - 证据要求：
        - 风格倾向：
        - 成功标准：
    """);

Console.WriteLine("ClarificationAgent 已启动。输入 exit 退出。\n");

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
        AgentResponse response = await clarificationAgent.RunAsync(history);

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