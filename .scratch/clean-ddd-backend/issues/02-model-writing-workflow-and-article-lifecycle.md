# 建模写作工作流实例与文章生命周期

Status: ready-for-agent

## Parent

[后端 Clean DDD 架构改造 PRD](../PRD.md)

## What to build

作为 FlowDraft 作者，系统能以写作工作流实例表达一次创作推进，并且只会在定稿保存时形成独立的文章；写作意图、初稿、润色稿和配图稿仍是流程中的阶段产物，而不是各自独立的业务对象。

## Acceptance criteria

- [ ] 建立写作工作流实例及其阶段推进规则，使用已定义的领域术语表达阶段与阶段产物。
- [ ] 不为写作意图、初稿、润色稿、配图稿、定稿或其他阶段产物创建独立仓储、持久化表或聚合根。
- [ ] 建立作为独立聚合根的文章，并限制其只能由定稿保存产生。
- [ ] 添加纯领域单元测试，验证工作流阶段推进、文章创建规则和必要的不变量，无需 Web host、数据库或模型运行时。
- [ ] 保持现有 Agent 交互行为可用，且不引入写作工作流中间状态持久化。

## Blocked by

- [建立 Clean DDD 骨架并保留 AG-UI Agent](01-clean-ddd-skeleton-and-agui-agent.md)

## Comments

- 写作工作流中间状态持久化不在本 ticket 范围内。