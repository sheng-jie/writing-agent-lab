# 后端 Clean DDD 架构改造

Status: ready-for-agent

## Problem Statement

FlowDraft 后端目前以单个 ASP.NET Core API 项目承载业务 Agent 定义、Microsoft Agents SDK 装配、外部搜索工具、AG-UI 路由和启动配置。随着写作工作流从写作意图识别扩展到文章保存和后续排版发布，这种按技术文件聚合的结构会让业务规则、运行时细节和 HTTP 协议相互耦合，难以验证依赖方向，也难以独立演进。

用户需要一个能够承接完整写作工作流的后端结构：写作工作流实例负责推进一次创作过程，阶段产物保留为该过程中的状态；定稿保存后形成独立、可持久化的文章。现有的 AG-UI 写作意图识别能力必须继续工作，同时不应让模型 SDK、EF Core 或 HTTP 框架污染领域核心。

## Solution

将后端改造为四层 Clean DDD 架构：领域层表达写作工作流实例和文章；应用层表达业务 Agent 能力与文章用例；基础设施层实现 Agent SDK、模型、搜索和 SQLite 持久化适配；API 层提供 AG-UI 和文章 HTTP 入口并作为组合根。

第一阶段仅建立最小可验证闭环：保留现有 AG-UI Agent 行为，删除临时普通聊天接口，新增文章的 SQLite 持久化与最小读取/保存接口，并加入领域测试和架构测试。写作工作流中间状态不在本阶段持久化。

## User Stories

1. As a FlowDraft 作者, I want to continue using the existing AG-UI 写作意图识别能力, so that the architecture migration does not interrupt my current writing workflow.
2. As a FlowDraft 作者, I want the system to treat a single writing effort as one 写作工作流实例, so that the product can track progression from an idea to an article without mistaking every stage artifact for a separate business object.
3. As a FlowDraft 作者, I want my completed 定稿保存为文章, so that I can retrieve a durable, publishable work after the writing workflow ends.
4. As a FlowDraft 作者, I want to retrieve a saved article by its identifier, so that I can return to a specific completed work.
5. As a FlowDraft 作者, I want to list saved articles, so that I can find previously completed work.
6. As a product developer, I want 写作意图、初稿、润色稿、配图稿和定稿 to remain stages or stage artifacts of a 写作工作流实例, so that the domain does not create unnecessary repositories and aggregate roots.
7. As a product developer, I want 文章 to be an independent aggregate root created only by 定稿保存, so that article management and future 排版发布 can evolve independently from the workflow process.
8. As a product developer, I want business Agent definitions to live in the application layer, so that the product's writing-workflow capabilities are explicit and do not depend on a specific Agent runtime.
9. As a product developer, I want Microsoft Agents SDK assembly, model configuration, file-skill loading and Tavily access to be infrastructure adapters, so that they can change without changing domain rules.
10. As a frontend developer, I want the existing AG-UI agent listing and agent routes to remain available, so that current CopilotKit integration remains compatible during the migration.
11. As an API consumer, I want minimal article save, get and list endpoints, so that persisted articles can be used end to end without exposing workflow internals.
12. As a maintainer, I want the temporary ordinary chat endpoint removed, so that the backend has one supported interactive Agent protocol rather than parallel, diverging paths.
13. As a maintainer, I want the allowed tools and required skills for a business Agent declared with its application-level definition, so that the capability contract is readable without inspecting the SDK adapter.
14. As a maintainer, I want infrastructure to resolve declared skill names into runtime file skills, so that existing skills continue to load without moving their runtime mechanics into the application layer.
15. As a maintainer, I want the domain layer to have no dependency on ASP.NET Core, EF Core, Microsoft Agents AI, OpenAI, Tavily or dependency-injection containers, so that core writing-workflow behavior is portable and unit-testable.
16. As a maintainer, I want architecture tests to reject invalid project dependencies, so that the Clean DDD layering cannot silently erode.
17. As a maintainer, I want article persistence backed by SQLite in the first phase, so that the article repository boundary is verified by a real adapter rather than only an unimplemented interface.
18. As a maintainer, I want application use cases to depend on an article repository interface rather than EF Core, so that persistence remains replaceable at the application seam.
19. As a maintainer, I want read operations to return article-focused data rather than internal database entities, so that persistence implementation details do not escape the application boundary.
20. As a maintainer, I want the composition root to be the only place that wires concrete adapters to application interfaces, so that dependencies remain explicit and local.

## Implementation Decisions

- Create four backend projects: Domain, Application, Infrastructure and API. Dependencies point inward: API may depend on Application and Infrastructure; Infrastructure may depend on Application and Domain; Application may depend on Domain; Domain has no project dependency.
- Model a 写作工作流实例 as the center of one writing process. Its current stage and stage artifacts are internal workflow state, not independent aggregate roots, entities or repositories.
- Treat 写作意图、选题列表、确定选题、写作大纲、初稿、润色稿、配图稿和定稿 as stage artifacts within a 写作工作流实例. Do not introduce repositories, tables or independent persistence models for them in this phase.
- Model 文章 as an independent aggregate root. It is created only by 定稿保存 and represents the durable, publishable work that follows a completed writing workflow.
- Add an article repository port and application use cases for saving an article, retrieving an article by identifier and listing articles. Application-facing results must not expose EF Core entities.
- Implement the article repository with EF Core and SQLite. Keep the persistence model focused on articles; do not add workflow-state tables, stage-artifact tables, version history or publishing-platform tables.
- Expose the minimal article HTTP contract: create an article, retrieve an article by identifier and list articles. Requests represent a completed article, not intermediate writing-workflow artifacts.
- Preserve the existing AG-UI agent listing and per-agent endpoints as the supported interactive Agent protocol. The API layer owns route exposure and does not contain agent instructions, skill resolution or tool construction.
- Remove the temporary ordinary chat endpoint and its request/response contracts. Do not retain a second interactive Agent protocol for Scalar or curl convenience.
- Keep business Agent profiles in Application. A profile defines its identifier, name, description, instructions, allowed tool names and required skill names as the business capability contract for a writing-workflow stage.
- Keep runtime Agent assembly in Infrastructure. Infrastructure translates Application Agent profiles into Microsoft Agents runtime instances and owns ChatClientAgent configuration, OpenAI-compatible chat-client setup, tool catalog construction, file-skill loading, shell execution and Tavily HTTP access.
- Retain the existing declaration flow in which an Agent profile names its skills and Infrastructure resolves those names to file skills. The skill name and its required business meaning are part of the Application profile; runtime discovery and provider construction are Infrastructure details.
- Treat the existing inline Writing Brief skill factory as non-authoritative for this migration unless a live runtime reference requires it. Confirm usage before moving or deleting it; it must not become the source of domain terminology or domain rules.
- Keep API startup as the composition root. It registers application services, infrastructure adapters, AG-UI hosting, OpenAPI/Scalar and health checks without embedding business behavior.
- Use the glossary terminology consistently. In particular, use 写作工作流实例 for a concrete writing process; do not label stage artifacts as aggregates or standalone entities. Use 文章 for the persisted final work.

## Testing Decisions

- The highest behavior seam is the public runtime boundary: AG-UI routes for Agent availability and article HTTP routes for persistence. Tests at this seam should verify observable contracts, not which SDK classes, EF Core calls or internal helper methods implement them.
- Add domain unit tests for Article creation invariants and writing-workflow stage progression. A good domain test constructs domain values, invokes behavior, and asserts the observable rule without a host, database, network or dependency-injection container.
- Add application tests for article save, get and list behavior through the article repository port. These tests should use a focused adapter/fake and verify use-case outcomes, not interaction counts unless an externally observable outcome requires them.
- Add infrastructure integration tests using isolated SQLite storage for the EF Core article repository. Verify that an article saved through the adapter can be retrieved with its required fields intact.
- Add API integration tests for article creation, retrieval and listing. Verify HTTP status codes and response contracts; do not assert database table layout or implementation type names.
- Add AG-UI compatibility tests at the API boundary to verify that the agent listing and the clarification-agent route remain registered after migration. Do not test prompt internals or runtime assembly implementation details.
- Add architecture tests using NetArchTest.Rules to enforce that Domain does not depend on Application, Infrastructure or API; Application does not depend on Infrastructure or API; and Infrastructure does not depend on API.
- Use xUnit and FluentAssertions for unit, application and integration assertions; use NetArchTest.Rules for dependency constraints. There are no existing backend tests to preserve as prior art, so these suites establish the initial conventions.

## Out of Scope

- Persisting a 写作工作流实例 or allowing users to resume an interrupted workflow.
- Separate persistence, repositories or tables for 写作意图、初稿、润色稿、配图稿、定稿 or other stage artifacts.
- Article update, deletion, publication, platform-specific formatting, scheduling, archival workflow or version history.
- CQRS projections, event sourcing, domain-event delivery, outbox processing, message brokers, sagas and cross-aggregate orchestration.
- Replacing AG-UI/CopilotKit, changing the frontend protocol, changing the Agent's functional prompt behavior, or adding a new ordinary chat endpoint.
- Migrating the console demonstration project except where project references must remain buildable.
- A broad redesign of product terminology outside the decisions already recorded in the domain glossary.

## Further Notes

- This is a structural migration, not a reason to add abstractions with no demonstrated variation. New seams are limited to the Article repository and the application-level business Agent profile/runtime adapter relationship.
- The public AG-UI route and the Article HTTP API are the preferred high-level test seams. The architecture-test suite is a structural guardrail rather than a substitute for behavior tests.
- SQLite is deliberately the first persistence adapter because it validates the article persistence boundary at low operational cost. A different database can later replace the adapter without changing the Domain or Application contract.
- The resulting architecture leaves room for a later decision to persist workflow progress through a separate workflow-state port, but that port is intentionally not introduced now.