#pragma warning disable MAAI001

using System.ComponentModel;
using System.Text.Json;
using Microsoft.Agents.AI;

namespace WritingAgent.Shared;

internal static class WritingBriefSkillFactory
{
    public static AgentInlineSkill Create()
    {
        return new AgentInlineSkill(
            name: "writing-brief-skill",
            description: "帮助 Clarification Agent 判断写作意图是否足够清晰，并整理成标准 Writing Brief。",
            instructions: """
                你是 Clarification Agent 的 Writing Brief 专业能力。

                当用户提出写作想法、文章主题、内容方向或模糊创作需求时，使用这个 Skill。

                你的任务不是写正文，也不是生成候选选题，而是帮助主 Agent 做三件事：
                1. 判断当前信息是否足够形成 Writing Brief；
                2. 如果信息不足，决定最少需要追问哪些关键问题；
                3. 如果信息足够，按照标准结构整理 Writing Brief。

                使用原则：
                - 不要为了填满模板而机械追问。
                - 每轮最多追问 3 个真正影响写作方向的问题。
                - 如果用户已经给出足够信息，应直接整理 Brief。
                - 如果需要追问，应优先通过 clarification 前端工具提出结构化问题；如果当前运行环境没有前端工具，则用自然语言提出同样的问题。
                - 如果涉及陌生概念、产品名、缩写或近期趋势，可以建议主 Agent 先使用 TavilySearchAsync 快速理解背景。
                - 需要判断最小合格线时，可使用 assess-brief-readiness 脚本。
                """)
            .AddResource(
                "writing-brief-template",
                """
                # Writing Brief 标准模板

                一个合格的 Writing Brief 应包含以下字段：

                ## 1. 写作主题
                用一句话说明这篇内容要讨论什么。

                ## 2. 目标读者
                明确写给谁看，例如：一线开发者、技术管理者、创业者、产品经理、普通用户。

                ## 3. 核心观点
                明确作者想表达的判断，而不只是一个中性主题。
                例如：
                - 不够好：AI Coding
                - 更好：AI Coding 的重点不是替代程序员，而是改变工程协作方式。

                ## 4. 使用场景
                明确内容将发布或使用在哪里，例如：公众号文章、课程讲稿、产品文档、技术分享、社群长文。

                ## 5. 内容风格
                说明语气和表达方式，例如：经验复盘、方法论拆解、案例分析、轻松科普、犀利观点。

                ## 6. 内容边界
                明确这篇文章不展开什么，避免主题无限扩大。
                """,
                description: "Writing Brief 的标准输出结构。")
            .AddResource(
                "clarification-policy",
                """
                # Clarification 澄清策略

                ## 必须追问的情况

                以下情况不能直接输出 Brief，应该继续澄清：

                1. 只有宽泛主题，没有目标读者。
                   例如：我想写一篇关于 AI Coding 的文章。

                2. 只有主题，没有核心观点。
                   例如：我想写 MCP。

                3. 只有技术名词，没有使用场景。
                   例如：帮我写一篇关于 Agent 的内容。

                4. 用户的目标互相冲突。
                   例如：既要写给小白，又要深入源码实现。

                5. 用户要求过大，无法形成单篇文章边界。
                   例如：帮我全面介绍人工智能。

                ## 不应该机械追问的情况

                以下情况可以直接整理 Brief：

                1. 用户已经说明目标读者、主题和核心判断。
                2. 用户虽然没有说风格，但使用场景已经暗示风格。
                3. 缺失信息不影响下一步选题或提纲。
                4. 用户明确说“先按你的判断来”。

                ## 追问数量限制

                每轮最多追问 3 个问题。
                问题应按影响程度排序：

                1. 目标读者
                2. 核心观点
                3. 使用场景
                4. 内容边界
                5. 风格偏好
                """,
                description: "判断什么时候追问、追问什么，以及什么时候停止追问。")
            .AddResource(
                "clarification-tool-contract",
                """
                # clarification 前端工具调用约定

                需要澄清时，优先调用名为 `clarification` 的前端工具，而不是输出纯文本问题列表。

                工具参数必须使用以下结构：

                ```json
                {
                  "type": "Clarification",
                  "version": "2.0",
                  "title": "我需要再确认几个关键信息",
                  "submitLabel": "提交澄清回答",
                  "questions": [
                    {
                      "id": "audience",
                      "kind": "single_choice",
                      "title": "这篇文章主要写给谁看？",
                      "options": [
                        { "id": "developer", "label": "一线开发者" },
                        { "id": "manager", "label": "技术管理者" },
                        { "id": "creator", "label": "内容创作者" }
                      ]
                    },
                    {
                      "id": "core_argument",
                      "kind": "text",
                      "title": "你最想表达的核心判断是什么？",
                      "placeholder": "例如：AI Coding 的重点不是替代程序员，而是改变工程协作方式。"
                    }
                  ]
                }
                ```

                工具返回 `ClarificationResponse` 后，应读取用户答案并继续生成 Writing Brief。
                """,
                description: "clarification 前端工具的参数结构与使用约定。")
            .AddResource(
                "brief-quality-rubric",
                """
                # Writing Brief 质量判断标准

                ## 高质量 Brief

                - 主题具体，不是一个孤立关键词。
                - 目标读者明确。
                - 核心观点有判断、有立场。
                - 使用场景清楚。
                - 内容边界明确，知道不写什么。
                - 下一步动作明确。

                ## 低质量 Brief

                - 只有主题，没有观点。
                - 目标读者是“所有人”。
                - 内容边界无限扩大。
                - 风格描述空泛，例如“专业一点”。
                - 下一步建议含糊，例如“继续完善”。

                ## 最小合格线

                至少必须明确：

                1. 写给谁；
                2. 写什么；
                3. 想表达什么判断；
                4. 用在哪里。
                """,
                description: "判断 Brief 是否合格的质量标准。")
            .AddResource(
                "few-shot-examples",
                """
                # 好坏示例

                ## 示例一：信息不足

                用户输入：
                我想写一篇关于 AI Coding 的文章。

                不要直接输出：
                这篇文章的主题是 AI Coding，目标读者是开发者……

                应该调用 clarification 工具，优先追问：
                1. 主要写给谁看？
                2. 你想表达 AI Coding 是机会、风险，还是方法论？
                3. 准备用在公众号、课程，还是技术分享？

                ## 示例二：信息足够

                用户输入：
                我想写一篇公众号文章，写给有三年以上经验的 .NET 开发者。主题是 AI Coding 不会自动提升工程质量，真正关键是先建立清晰的项目边界和协作规则。

                可以直接整理 Brief：
                - 目标读者：有三年以上经验的 .NET 开发者
                - 核心观点：AI Coding 的效果取决于项目边界和协作规则，而不是模型本身
                - 使用场景：公众号文章
                - 下一步：进入选题或提纲生成

                ## 示例三：概念可能陌生

                用户输入：
                我想写 MCP 和 A2A 对 Agent 产品架构的影响。

                如果 Agent 不确定 MCP 或 A2A 的背景，可以先调用 TavilySearchAsync 快速理解概念。
                但搜索只用于澄清判断，不展开正式研究。
                """,
                description: "帮助 Agent 区分应该追问和可以输出 Brief 的场景。")
            .AddScript(
                "assess-brief-readiness",
                AssessBriefReadiness,
                description: "根据最小合格线判断当前信息是否足够形成 Writing Brief。输入为空字符串表示缺失。");
    }

    private static string AssessBriefReadiness(
        [Description("目标读者。缺失时传空字符串。")] string audience,
        [Description("写作主题。缺失时传空字符串。")] string topic,
        [Description("核心观点或核心判断。缺失时传空字符串。")] string coreArgument,
        [Description("使用场景。缺失时传空字符串。例：公众号文章、课程讲稿、技术分享。")]
        string usageScenario)
    {
        var missing = new List<string>();

        if (string.IsNullOrWhiteSpace(audience))
        {
            missing.Add("target_audience");
        }

        if (string.IsNullOrWhiteSpace(topic))
        {
            missing.Add("topic");
        }

        if (string.IsNullOrWhiteSpace(coreArgument))
        {
            missing.Add("core_argument");
        }

        if (string.IsNullOrWhiteSpace(usageScenario))
        {
            missing.Add("usage_scenario");
        }

        var ready = missing.Count == 0;

        return JsonSerializer.Serialize(new
        {
            ready,
            missing,
            recommendation = ready
                ? "可以整理 Writing Brief。"
                : "需要先通过 clarification 工具补齐缺失信息。"
        });
    }
}
