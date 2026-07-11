# 建立 Clean DDD 骨架并保留 AG-UI Agent

Status: ready-for-agent

## Parent

[后端 Clean DDD 架构改造 PRD](../PRD.md)

## What to build

作为 FlowDraft 作者，我仍能通过 AG-UI 使用写作意图识别能力；同时后端在四层 Clean DDD 结构中清晰表达业务 Agent profile、运行时 Agent adapter 与 HTTP driver adapter 的职责。

## Acceptance criteria

- [ ] 建立 Domain、Application、Infrastructure 与 API 的内向项目依赖，并使现有解决方案保持可构建。
- [ ] 将业务 Agent profile 迁移到 Application，将 Microsoft Agents、模型、Tavily 和 file skill 运行时迁移为 Infrastructure adapter。
- [ ] 保留现有 AG-UI agent listing 和 clarification-agent 路由的可发现与可调用行为。
- [ ] 删除临时普通聊天接口及其契约，使 AG-UI 成为唯一支持的交互式 Agent 协议。
- [ ] 添加架构测试，阻止 Domain 依赖外层项目、Application 依赖 Infrastructure/API，以及 Infrastructure 依赖 API。
- [ ] 添加 AG-UI API 边界验证，确认迁移后 Agent listing 和 clarification-agent 路由仍被注册。

## Blocked by

None - can start immediately.

## Comments

- 本 ticket 是后续文章能力的 prefactor：先将既有 Agent 能力移动到正确 seam，再增加新的领域与持久化能力。