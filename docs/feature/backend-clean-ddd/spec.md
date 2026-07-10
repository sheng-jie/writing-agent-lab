# Backend Clean DDD Refactor Spec

## Status

Drafted on 2026-07-09.

## Goal

Refactor the backend into a small, evolvable Clean Architecture + DDD + Hexagonal structure without changing the existing AG-UI agent behavior.

The first phase is intentionally narrow:

- preserve the current Clarification Agent behavior through AG-UI;
- remove the temporary plain HTTP chat endpoint;
- introduce the `Article` aggregate and minimal persistence;
- keep writing workflow intermediate state out of persistence;
- add architecture tests so dependency direction does not regress.

## Non-goals

This phase must not implement the full writing product workflow.

Do not add:

- persistence for writing intent, draft, polished draft, illustration draft, or other stage artifacts;
- `WritingWorkflowInstanceRepository`;
- article editing, deletion, version history, publishing, or platform adaptation;
- CQRS, event sourcing, outbox, sagas, or messaging;
- a second ordinary chat protocol beside AG-UI;
- large-scale frontend changes.

## Domain decisions

### Writing workflow instance

A **写作工作流实例** is the domain center for one user journey from idea to article.

It records:

- the current writing workflow stage;
- the stage artifact state for that workflow instance;
- which transition can happen next.

It is not persisted in phase one.

### Stage artifacts

The following are not independent domain models, aggregates, entities, or repositories:

- 写作意图;
- 选题列表;
- 确定选题;
- 写作大纲;
- 初稿;
- 润色稿;
- 配图稿;
- 定稿.

They are state inside a writing workflow instance.

### Article

An **Article** is created only after 定稿保存.

It is an independent aggregate root because it has a lifecycle after the workflow completes:

- save;
- list;
- view;
- later: publish, archive, edit metadata, adapt formatting.

Only `Article` gets persistence in phase one.

## Target solution structure

```text
src/backend/
  WritingAgent.Domain/
    Articles/
    WritingWorkflows/
    Shared/

  WritingAgent.Application/
    Articles/
    WritingWorkflows/Clarification/
    DependencyInjection.cs

  WritingAgent.Infrastructure/
    Persistence/
    Agents/
    Search/
    DependencyInjection.cs

  WritingAgent.Api/
    Agents/
    Contracts/
    Endpoints/
    Program.cs
```

## Dependency rule

Allowed project dependencies:

```text
WritingAgent.Api -> WritingAgent.Application
WritingAgent.Api -> WritingAgent.Infrastructure
WritingAgent.Infrastructure -> WritingAgent.Application
WritingAgent.Infrastructure -> WritingAgent.Domain
WritingAgent.Application -> WritingAgent.Domain
WritingAgent.Domain -> no project dependency
```

Forbidden dependencies:

```text
WritingAgent.Domain -> Microsoft.Agents.AI
WritingAgent.Domain -> EF Core
WritingAgent.Domain -> ASP.NET Core
WritingAgent.Application -> WritingAgent.Infrastructure
WritingAgent.Application -> WritingAgent.Api
WritingAgent.Infrastructure -> WritingAgent.Api
```

## Layer responsibilities

### Domain

Contains pure business concepts and invariants.

Proposed modules:

```text
Articles/
  Article.cs
  ArticleId.cs
  ArticleTitle.cs
  ArticleContent.cs
  ArticleStatus.cs
  IArticleRepository.cs

WritingWorkflows/
  WritingWorkflowInstance.cs
  WritingWorkflowStage.cs
  StageArtifact.cs

Shared/
  DomainException.cs
```

Rules:

- no ASP.NET Core;
- no EF Core;
- no Microsoft Agents SDK;
- no OpenAI/Tavily concepts;
- no logging, DI, HTTP, or filesystem concerns.

### Application

Contains business capability definitions and use cases.

Proposed modules:

```text
Articles/
  SaveArticleUseCase.cs
  GetArticleUseCase.cs
  ListArticlesUseCase.cs
  SaveArticleCommand.cs
  ArticleDto.cs

WritingWorkflows/Clarification/
  AgentDefinition.cs
  ClarificationAgentDefinition.cs
  AgentIds.cs
  AgentToolNames.cs
```

Agent definitions belong here because they describe product behavior:

- what business capability the agent represents;
- which tools are allowed;
- which skills are needed;
- the business instructions for the agent.

Application does not know how Microsoft Agents SDK loads or executes those definitions.

### Infrastructure

Contains driven adapters and runtime integrations.

Proposed modules:

```text
Persistence/
  WritingAgentDbContext.cs
  ArticleEntityTypeConfiguration.cs
  EfArticleRepository.cs

Agents/
  AgentAssembler.cs
  AgentToolCatalog.cs
  AgentRuntimeFactory.cs
  Tools/
  Skills/

Search/
  TavilySearchAgentTool.cs
```

Responsibilities:

- assemble `ChatClientAgent` from Application agent definitions;
- load `Skills/{skillName}` declared by Application definitions;
- construct `IChatClient` through OpenAI-compatible configuration;
- call Tavily through `IHttpClientFactory`;
- implement EF Core SQLite persistence for `Article`.

### Api

Contains driver adapters and composition root.

Proposed modules:

```text
Agents/
  AgentEndpointRegistration.cs

Contracts/Articles/
  SaveArticleRequest.cs
  ArticleResponse.cs

Endpoints/
  ArticleEndpoints.cs

Program.cs
```

Responsibilities:

- expose AG-UI endpoints;
- expose minimal Article HTTP endpoints;
- wire OpenAPI/Scalar/health;
- compose Application and Infrastructure dependencies.

The API must not contain business instructions, tool resolution, skill loading, or persistence mapping.

## Agent behavior

Phase one preserves the current AG-UI behavior:

```text
GET /agui/agents
/agui/agents/{id}
```

The current plain HTTP chat endpoint is removed:

```text
DELETE POST /api/writing/chat
DELETE WritingChatRequest
DELETE WritingChatResponse
```

Agent skill declaration remains:

```text
Application AgentDefinition.SkillNames
  -> Infrastructure AgentAssembler
  -> Skills/{skillName}
```

## Article API

Phase one exposes only minimal Article endpoints:

```text
POST /api/articles
GET  /api/articles/{id}
GET  /api/articles
```

Out of scope:

```text
PUT    /api/articles/{id}
DELETE /api/articles/{id}
POST   /api/articles/{id}/publish
```

The request model should describe the completed saved article, not workflow intermediate artifacts.

## Persistence

Use EF Core + SQLite.

Guidelines:

- keep `WritingAgentDbContext` focused;
- configure `Article` through `IEntityTypeConfiguration`;
- use `AsNoTracking()` for read-only list/detail queries;
- use a scoped DbContext lifetime through ASP.NET Core DI;
- create small focused migrations;
- do not expose `IQueryable` from repositories.

## Testing

Add:

```text
tests/backend/
  WritingAgent.Domain.Tests/
  WritingAgent.Architecture.Tests/
```

Use:

- xUnit;
- FluentAssertions;
- NetArchTest.Rules.

### Domain tests

Cover:

- `Article` cannot be created with empty title/content;
- `Article` represents a saved completed work, not an intermediate draft;
- `WritingWorkflowInstance` can advance through valid stages;
- stage artifacts remain internal state, not separately repository-backed objects.

### Architecture tests

Cover:

- Domain does not depend on Application, Infrastructure, Api, EF Core, ASP.NET Core, or Microsoft Agents SDK;
- Application does not depend on Infrastructure or Api;
- Infrastructure does not depend on Api;
- Api is not referenced by inner projects.

## Migration strategy

1. Create new projects and references.
2. Move business agent definitions from Api to Application.
3. Move Microsoft Agents SDK assembly/runtime code from Api to Infrastructure.
4. Keep Api as AG-UI driver adapter and composition root.
5. Delete `/api/writing/chat`.
6. Add `Article` domain model and repository port.
7. Add EF Core SQLite adapter.
8. Add Article endpoints.
9. Add Domain tests.
10. Add Architecture tests.
11. Run build and tests.

## Success criteria

- `dotnet build` succeeds.
- `dotnet test` succeeds.
- Existing AG-UI Clarification Agent remains available.
- `/api/writing/chat` no longer exists.
- `POST /api/articles`, `GET /api/articles/{id}`, and `GET /api/articles` work against SQLite.
- Architecture tests enforce the dependency rule.
