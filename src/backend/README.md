# FlowDraft Backend

FlowDraft 后端是一个 .NET 10 / ASP.NET Core 服务，负责承载写作工作流中的 Agent 能力、文章持久化和对前端开放的 HTTP/AG-UI 入口。

当前后端采用 **Clean Architecture + DDD + Hexagonal** 的轻量分层：领域规则保持在内层，Agent SDK、EF Core、OpenAI-compatible client、Tavily 等外部技术通过 Infrastructure 适配。

## 项目结构

```text
src/backend/
├── WritingAgent.Domain/          # 领域模型与核心规则
├── WritingAgent.Application/     # 应用用例与业务 Agent 定义
├── WritingAgent.Infrastructure/  # EF Core、Agent SDK、Tavily、模型客户端等适配器
├── WritingAgent.Api/             # ASP.NET Core 入口、AG-UI、HTTP endpoints、composition root
└── WritingAgent.Console/         # 早期命令行实验入口
```

测试项目位于：

```text
tests/backend/
├── WritingAgent.Domain.Tests/
└── WritingAgent.Architecture.Tests/
```

## 分层职责

### `WritingAgent.Domain`

只包含纯领域概念和不依赖外部技术的业务规则。

当前模块：

- `Articles/`：`Article` 聚合、值对象、`IArticleRepository` 端口。
- `WritingWorkflows/`：`WritingWorkflowInstance`、`WritingWorkflowStage`、阶段产物状态。
- `Shared/`：领域异常等共享领域类型。

规则：

- 不引用 ASP.NET Core、EF Core、Microsoft Agents SDK、OpenAI、Tavily。
- 不使用 DI、日志、HTTP、文件系统或数据库类型。
- 仓储接口按聚合根定义，不暴露 `IQueryable`。

### `WritingAgent.Application`

承载应用用例和业务能力定义。

当前模块：

- `Articles/`：保存、读取、列出文章的用例和 DTO。
- `WritingWorkflows/Clarification/`：写作工作流中澄清 Agent 的业务定义，包括 Agent id、允许工具、skill 名称和业务 instructions。

规则：

- 可依赖 `WritingAgent.Domain`。
- 不依赖 `WritingAgent.Infrastructure` 或 `WritingAgent.Api`。
- 不知道 Microsoft Agents SDK 如何加载和运行 Agent。

### `WritingAgent.Infrastructure`

实现外部技术适配。

当前模块：

- `Persistence/`：EF Core SQLite `WritingAgentDbContext`、Article mapping、repository、migration。
- `Agents/`：Microsoft Agents SDK 装配、tool catalog、file skill 运行。
- `Agents/Skills/`：Agent file skill 资源，运行时按 `Skills/{skillName}` 输出。
- `Search/`：Tavily 搜索工具适配。

规则：

- 可以依赖 Application 和 Domain。
- 不依赖 Api。
- 负责把 Application 中的 Agent 定义转换为可运行的 SDK Agent。

### `WritingAgent.Api`

ASP.NET Core driver adapter 和 composition root。

当前职责：

- 注册 Application 和 Infrastructure 依赖。
- 暴露 AG-UI Agent endpoints。
- 暴露 Article HTTP endpoints。
- 暴露 OpenAPI、Scalar 和 health check。
- 把 Infrastructure 的 `Agents/Skills/` 内容复制到运行输出目录的 `Skills/` 下。

API 项目不应包含业务 instructions、tool 解析、skill 内容、EF mapping 或领域规则。

## 依赖方向

允许的项目依赖：

```text
WritingAgent.Api -> WritingAgent.Application
WritingAgent.Api -> WritingAgent.Infrastructure
WritingAgent.Infrastructure -> WritingAgent.Application
WritingAgent.Infrastructure -> WritingAgent.Domain
WritingAgent.Application -> WritingAgent.Domain
WritingAgent.Domain -> no project dependency
```

禁止的方向：

```text
WritingAgent.Domain -> Application / Infrastructure / Api / EF Core / ASP.NET Core / Microsoft Agents SDK
WritingAgent.Application -> Infrastructure / Api
WritingAgent.Infrastructure -> Api
```

依赖规则由 `WritingAgent.Architecture.Tests` 保护。

## Agent 与 Skills

业务 Agent 定义位于 Application：

```text
WritingAgent.Application/WritingWorkflows/Clarification/
```

Agent 运行时适配位于 Infrastructure：

```text
WritingAgent.Infrastructure/Agents/
```

File skills 源文件位于：

```text
WritingAgent.Infrastructure/Agents/Skills/{skillName}/
```

Skills 文件由 `WritingAgent.Infrastructure` 维护。`WritingAgent.Api` 不直接拥有 skill 内容，只在 `.csproj` 中通过内容链接引用 Infrastructure 下的 `Agents/Skills/**`，并在构建/发布时复制到 API 的输出目录。

构建 API 时，skills 会复制到输出目录：

```text
WritingAgent.Api/bin/Debug/net10.0/Skills/{skillName}/
```

`AgentAssembler` 通过以下约定加载：

```text
AppContext.BaseDirectory/Skills/{skillName}
```

> [!NOTE]
> `SkillNames` 由 Application 的 Agent 定义声明；具体如何加载、执行脚本、注入到 Microsoft Agents SDK，由 Infrastructure 负责。

## HTTP / AG-UI Endpoints

### AG-UI

```text
GET /agui/agents
/agui/agents/{id}
```

当前默认 Agent：

```text
clarification-agent
```

### Article API

```text
POST /api/articles
GET  /api/articles/{id}
GET  /api/articles
```

`/api/writing/chat` 已移除；后端只承诺 AG-UI Agent 协议和 Article API。

## Persistence

文章使用 EF Core + SQLite 持久化。

配置项：

```json
{
  "ConnectionStrings": {
    "WritingAgent": "Data Source=writing-agent.db"
  }
}
```

开发环境默认使用：

```text
Data Source=writing-agent.dev.db
```

迁移文件位于：

```text
WritingAgent.Infrastructure/Persistence/Migrations/
```

## 本地运行

模型与搜索配置通过 `WritingAgent.Api` 的 `appsettings.json` / `appsettings.Development.json` 读取。

基础配置位于：

```json
{
  "AI": {
    "Chat": {
      "BaseUrl": "https://api.openai.com/v1",
      "Model": "gpt-4.1-mini"
    },
    "Tavily": {
      "BaseUrl": "https://api.tavily.com/"
    }
  }
}
```

本地需要补充密钥配置：

```text
AI:Chat:ApiKey
```

可选：

```text
AI:Tavily:ApiKey
```

建议用 user-secrets 保存本地密钥，避免写入仓库文件：

```bash
dotnet user-secrets set "AI:Chat:ApiKey" "<your-api-key>" --project src/backend/WritingAgent.Api/WritingAgent.Api.csproj
dotnet user-secrets set "AI:Tavily:ApiKey" "<your-tavily-key>" --project src/backend/WritingAgent.Api/WritingAgent.Api.csproj
```

运行 API：

```bash
dotnet run --project src/backend/WritingAgent.Api/WritingAgent.Api.csproj
```

## 构建与测试

构建：

```bash
dotnet build WritingAgentLab.slnx
```

运行全部测试：

```bash
dotnet test WritingAgentLab.slnx
```

当前测试覆盖：

- `Article` 领域规则。
- `WritingWorkflowInstance` 阶段推进规则。
- Clean Architecture 项目依赖方向。
- 写作工作流阶段产物不引入独立 repository。
