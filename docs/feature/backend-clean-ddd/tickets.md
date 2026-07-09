# Backend Clean DDD Refactor Tickets

These tickets implement `docs/feature/backend-clean-ddd/spec.md` as tracer bullets. Work in order unless a ticket explicitly says it can run in parallel.

## Ticket 1: Create backend layer projects

### Goal

Create the Clean DDD project skeleton without moving behavior yet.

### Scope

Add:

```text
src/backend/WritingAgent.Domain/WritingAgent.Domain.csproj
src/backend/WritingAgent.Application/WritingAgent.Application.csproj
src/backend/WritingAgent.Infrastructure/WritingAgent.Infrastructure.csproj
```

Add project references:

```text
Application -> Domain
Infrastructure -> Application
Infrastructure -> Domain
Api -> Application
Api -> Infrastructure
```

Add each project to `WritingAgentLab.slnx`.

### Blocking edges

None.

### Acceptance criteria

- `dotnet build WritingAgentLab.slnx` succeeds.
- No behavior changes.

---

## Ticket 2: Move business Agent definitions to Application

### Goal

Move business Agent profile definitions out of Api.

### Scope

Move or recreate in `WritingAgent.Application`:

```text
WritingWorkflows/Clarification/AgentDefinition.cs
WritingWorkflows/Clarification/ClarificationAgentDefinition.cs
WritingWorkflows/Clarification/AgentIds.cs
WritingWorkflows/Clarification/AgentToolNames.cs
```

Keep:

- current agent id;
- current instructions;
- current `allowedToolNames`;
- current `skillNames`.

### Blocking edges

Blocked by Ticket 1.

### Acceptance criteria

- Api references Application definitions.
- Agent business instructions no longer live in Api.
- `dotnet build WritingAgentLab.slnx` succeeds.

---

## Ticket 3: Move Agent runtime assembly to Infrastructure

### Goal

Move Microsoft Agents SDK runtime details out of Api.

### Scope

Move or recreate in `WritingAgent.Infrastructure`:

```text
Agents/AgentAssembler.cs
Agents/Tools/IAgentTool.cs
Agents/Tools/AgentToolBase.cs
Agents/Tools/AgentToolCatalog.cs
Search/TavilySearchAgentTool.cs
```

Keep `.skills/{skillName}` loading semantics unchanged.

Add Infrastructure DI registration for:

- tool catalog;
- Tavily tool;
- agent assembler/runtime factory;
- named Tavily `HttpClient` if appropriate.

### Blocking edges

Blocked by Ticket 2.

### Acceptance criteria

- Microsoft Agents SDK references are in Infrastructure or Api adapter code only.
- Application contains no Microsoft Agents SDK dependency.
- Existing AG-UI agent can still be assembled.
- `dotnet build WritingAgentLab.slnx` succeeds.

---

## Ticket 4: Keep Api as AG-UI driver adapter

### Goal

Make Api only expose protocols and compose dependencies.

### Scope

Keep in `WritingAgent.Api`:

```text
Agents/AgentEndpointRegistration.cs
Program.cs
```

Update `Program.cs` to use Application and Infrastructure DI extension methods.

Keep AG-UI endpoints:

```text
GET /agui/agents
/agui/agents/{id}
```

### Blocking edges

Blocked by Ticket 3.

### Acceptance criteria

- AG-UI route registration behavior is unchanged.
- Api contains no agent instructions, skill loading, tool catalog, or Tavily implementation.
- `dotnet build WritingAgentLab.slnx` succeeds.

---

## Ticket 5: Remove plain HTTP writing chat endpoint

### Goal

Remove the temporary non-AG-UI chat protocol.

### Scope

Delete from `Program.cs`:

```text
POST /api/writing/chat
WritingChatRequest
WritingChatResponse
```

### Blocking edges

Blocked by Ticket 4.

### Acceptance criteria

- `/api/writing/chat` is no longer mapped.
- AG-UI endpoints remain mapped.
- `dotnet build WritingAgentLab.slnx` succeeds.

---

## Ticket 6: Add Article domain model

### Goal

Introduce `Article` as the saved output of a completed writing workflow.

### Scope

Add in `WritingAgent.Domain`:

```text
Articles/Article.cs
Articles/ArticleId.cs
Articles/ArticleTitle.cs
Articles/ArticleContent.cs
Articles/ArticleStatus.cs
Articles/IArticleRepository.cs
Shared/DomainException.cs
```

Rules:

- title cannot be empty;
- content cannot be empty;
- Article represents saved completed content, not intermediate workflow drafts;
- repository is per aggregate root and does not expose `IQueryable`.

### Blocking edges

Blocked by Ticket 1.

### Acceptance criteria

- Domain project has no framework dependencies.
- `dotnet build WritingAgentLab.slnx` succeeds.

---

## Ticket 7: Add minimal writing workflow domain state

### Goal

Represent writing workflow progress without persisting intermediate artifacts.

### Scope

Add in `WritingAgent.Domain`:

```text
WritingWorkflows/WritingWorkflowInstance.cs
WritingWorkflows/WritingWorkflowStage.cs
WritingWorkflows/StageArtifact.cs
```

Rules:

- stage artifacts are internal state;
- no repositories for stage artifacts;
- no persistence concern in workflow domain types.

### Blocking edges

Blocked by Ticket 1.

### Acceptance criteria

- No `WritingWorkflowInstanceRepository` is introduced.
- No `Draft`, `PolishedDraft`, `IllustrationDraft`, or `WritingIntent` aggregate/repository is introduced.
- `dotnet build WritingAgentLab.slnx` succeeds.

---

## Ticket 8: Add Article application use cases

### Goal

Add application boundary for saving and reading articles.

### Scope

Add in `WritingAgent.Application`:

```text
Articles/SaveArticleUseCase.cs
Articles/GetArticleUseCase.cs
Articles/ListArticlesUseCase.cs
Articles/SaveArticleCommand.cs
Articles/ArticleDto.cs
```

Use `IArticleRepository` from Domain.

### Blocking edges

Blocked by Ticket 6.

### Acceptance criteria

- Application depends on Domain only.
- Use cases accept `CancellationToken` where I/O is involved.
- `dotnet build WritingAgentLab.slnx` succeeds.

---

## Ticket 9: Add EF Core SQLite Article persistence

### Goal

Persist `Article` through an Infrastructure adapter.

### Scope

Add in `WritingAgent.Infrastructure`:

```text
Persistence/WritingAgentDbContext.cs
Persistence/ArticleEntityTypeConfiguration.cs
Persistence/EfArticleRepository.cs
```

Add EF Core SQLite packages centrally if needed.

Guidelines:

- use `IEntityTypeConfiguration`;
- use `AsNoTracking()` for reads;
- do not leak EF types through `IArticleRepository`;
- keep migrations small and focused.

### Blocking edges

Blocked by Tickets 6 and 8.

### Acceptance criteria

- Repository implements `IArticleRepository`.
- SQLite provider is configured via Infrastructure DI.
- `dotnet build WritingAgentLab.slnx` succeeds.

---

## Ticket 10: Add minimal Article endpoints

### Goal

Expose Article persistence through Api.

### Scope

Add in `WritingAgent.Api`:

```text
Contracts/Articles/SaveArticleRequest.cs
Contracts/Articles/ArticleResponse.cs
Endpoints/ArticleEndpoints.cs
```

Expose:

```text
POST /api/articles
GET  /api/articles/{id}
GET  /api/articles
```

Do not expose update, delete, publish, or version history.

### Blocking edges

Blocked by Tickets 8 and 9.

### Acceptance criteria

- Endpoints call Application use cases.
- Request/response contracts do not expose draft/polished/illustration stage artifact concepts.
- `dotnet build WritingAgentLab.slnx` succeeds.

---

## Ticket 11: Add Domain tests

### Goal

Lock down core domain rules.

### Scope

Add:

```text
tests/backend/WritingAgent.Domain.Tests/WritingAgent.Domain.Tests.csproj
```

Use:

- xUnit;
- FluentAssertions.

Cover:

- `Article` rejects empty title;
- `Article` rejects empty content;
- `Article` models saved completed content;
- `WritingWorkflowInstance` valid stage transitions;
- stage artifacts are not independent repository-backed objects.

### Blocking edges

Blocked by Tickets 6 and 7.

### Acceptance criteria

- Domain tests pass.
- `dotnet test WritingAgentLab.slnx` succeeds for this test project.

---

## Ticket 12: Add Architecture tests

### Goal

Enforce dependency direction.

### Scope

Add:

```text
tests/backend/WritingAgent.Architecture.Tests/WritingAgent.Architecture.Tests.csproj
```

Use:

- xUnit;
- FluentAssertions;
- NetArchTest.Rules.

Cover:

- Domain does not depend on Application, Infrastructure, Api, EF Core, ASP.NET Core, or Microsoft Agents SDK;
- Application does not depend on Infrastructure or Api;
- Infrastructure does not depend on Api;
- Api is not referenced by inner projects.

### Blocking edges

Blocked by Tickets 1-4.

### Acceptance criteria

- Architecture tests pass.
- `dotnet test WritingAgentLab.slnx` succeeds for this test project.

---

## Ticket 13: Final build and verification

### Goal

Verify the phase-one refactor end to end.

### Scope

Run:

```text
dotnet build WritingAgentLab.slnx
dotnet test WritingAgentLab.slnx
```

Manually verify:

- `GET /agui/agents` returns the Clarification Agent;
- `/agui/agents/{id}` is mapped;
- `/api/writing/chat` is gone;
- Article endpoints work against SQLite.

### Blocking edges

Blocked by Tickets 1-12.

### Acceptance criteria

- Build succeeds.
- Tests pass.
- Acceptance checks from `spec.md` are satisfied.
