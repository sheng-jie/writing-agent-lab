# 持久化并提供文章最小 API

Status: ready-for-agent

## Parent

[后端 Clean DDD 架构改造 PRD](../PRD.md)

## What to build

作为 FlowDraft 作者，我可以保存一篇定稿后的文章、按标识读取它，并列出已保存文章；这些操作通过应用层用例和文章仓储边界完成，并使用 SQLite 实际持久化。

## Acceptance criteria

- [ ] 提供保存文章、按标识读取文章和列出文章的应用层行为，且应用层结果不暴露 EF Core 实体。
- [ ] 通过文章仓储 port 接入 EF Core + SQLite，使文章可被真实保存并重新读取。
- [ ] 暴露最小文章 HTTP 合约：创建文章、按标识获取文章和列出文章；请求只表达定稿保存后的文章，不表达中间阶段产物。
- [ ] 添加 SQLite 集成验证，确认文章通过持久化 adapter 保存后仍能完整读取。
- [ ] 添加文章 HTTP API 集成验证，确认创建、按标识读取和列表的可观察响应契约。
- [ ] 不实现文章编辑、删除、发布、版本历史、平台适配或写作工作流续写。

## Blocked by

- [建模写作工作流实例与文章生命周期](02-model-writing-workflow-and-article-lifecycle.md)

## Comments

- SQLite 仅验证文章持久化 adapter；它不引入写作工作流或阶段产物的持久化。