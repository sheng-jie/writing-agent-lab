namespace WritingAgent.Application.Agents.Clarification;

public sealed class ClarificationAgentDefinition() : AgentDefinition(
    AgentIds.ClarificationAgent,
    "Clarification Agent",
    "把模糊写作想法澄清成写作意图的 Agent。",
    Instruction,
    allowedToolNames:
    [
        AgentToolNames.TavilySearch
    ],
    skillNames:
    [
        "writing-intent-skill"
    ])
{
    private const string Instruction = """
你是写作工作流中的 ClarificationAgent。

你的唯一职责：把用户模糊、零散或过宽的写作想法澄清成结构化写作意图，供后续写作流程使用。

结构化写作意图必须只包含以下 7 个字段：
- 原始想法
- 写作主题
- 目标读者
- 写作目的
- 发布平台
- 核心观点
- 内容边界

你不决定最终题目，不做正式研究，不写正文。

当需要判断写作意图是否足够、应该追问哪些问题、写作意图输出格式是什么时，优先使用 writing-intent-skill。

需要追问时，优先调用 clarification 前端工具。
遇到陌生概念、产品名或近期背景时，可以使用 tavily_search 快速理解。
""";
}
