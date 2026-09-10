# 当前写作工作流 module 重构 Spec

状态：已确认，开始实现

## 目标

深化 `/studio` 的“当前写作工作流”module，让它拥有清晰的领域状态与流程规则，并通过较小的 interface 为工作台和工作区提供 leverage。

本次重构采用一次性替换，不保留旧接口兼容层。

## 术语与职责

### 当前写作工作流

当前写作工作流是领域核心，拥有：

- 六个阶段的阶段状态、阶段产物和阶段推进规则。
- 生成候选阶段产物、阶段内编辑、接受阶段产物、重置阶段、完成工作流等语义命令。
- `pending`、`in-progress`、`accepted` 三种阶段状态及其不变量。
- 阶段完整性、阶段顺序、上游与下游产物清理规则。

它不拥有：

- 工作台 UI 状态，例如折叠、Toast、确认弹窗和临时提示。
- 当前浏览工作区。
- Agent 面板实例、React ref 或 Agent 运行中的界面状态。
- `localStorage`、跨标签页事件、路由和网络请求。

### 可恢复进度

可恢复进度是持久化 module，继续使用一个整体快照，但明确包含三个部分：

```ts
{
  workflow,          // 当前写作工作流：领域状态 + 流程状态
  activeWorkspaceId, // 当前浏览位置
  agentMessages      // 各工作区已提交的 Agent 对话
}
```

快照无法完整读取时整体放弃，不拼接部分状态。可恢复进度负责版本校验、保存、恢复、跨标签页同步和保存失败信号；当前写作工作流不感知这些实现细节。

### 工作台与工作区

- 工作台负责路由、整体布局、跨工作区协调、全局命令和工作台 UI 状态。
- 工作区负责当前阶段的编辑、选区、局部 UI 状态、Agent 协作和阶段领域逻辑。
- 工作区通过 adapter 使用当前阶段的工作流能力。adapter 隐藏固定的 `stageId`，避免阶段 ID 和全局 controller 细节散落在工作区。
- 工作区与工作台的修改通信采用单一路径：读取分组后的状态，调用 adapter 暴露的命令；不直接修改 workflow 对象。

## 状态分层

### 领域状态

由当前写作工作流 module 拥有：

- `WritingWorkflowSnapshot`
- 阶段状态和阶段产物
- 当前推进阶段 `currentStageId`
- 工作流完成状态和文章 ID

### 流程状态

由 React 适配层协调，但不进入领域规则：

- Agent 是否运行中
- Agent 是否有未提交输入
- 进度是否已恢复
- 其他标签页是否有待加载进度
- Agent 消息恢复 key

### UI 状态

由工作台或具体工作区就近拥有：

- 工作台 rail 折叠、Toast、确认弹窗和保存提示
- 工作区选中态、临时输入、卡片闪烁等局部状态

工作台全局状态与工作区局部状态不可因方便读取而互相污染。当前浏览工作区属于可恢复进度，不属于当前写作工作流领域核心。

## 工作流 interface

工作流 module 对外提供一个统一命令入口：

```ts
executeWorkflowCommand(workflow, command)
```

命令至少覆盖：

```ts
{ type: "propose-artifact", stageId, artifact }
{ type: "update-artifact", stageId, patch }
{ type: "accept-stage", stageId }
{ type: "reset-stage", stageId }
{ type: "complete-workflow", articleId }
```

工作区 adapter 可以提供不带 `stageId` 的局部方法，例如 `updateArtifact(patch)`、`proposeArtifact(artifact)`、`accept()`；adapter 内部将其转成统一命令。

命令入口是纯函数，不执行保存、网络请求、Toast、路由切换、Agent reset 或 React state 更新。

### 命令结果

命令返回明确的成功或拒绝结果，不使用只有真假含义的 `boolean`：

```ts
{ ok: true, workflow: nextWorkflow }
{ ok: false, reason: WorkflowCommandRejection }
```

拒绝原因是稳定的领域原因码，不包含 UI 文案。工作台或工作区负责将原因码映射为中文提示。

## 保存时序

### 阶段内编辑

阶段内编辑先更新内存中的 workflow，再由可恢复进度异步保存。保存失败保留内存中的编辑，并设置“当前修改尚未保存”的提示。

### 流程转移

接受阶段、重置阶段、重新开始捕捉想法、完成工作流等会改变可恢复进度结构的动作采用先保存后提交：

```text
执行纯工作流命令
  -> 组装完整可恢复进度快照
  -> 保存成功
  -> 提交 React 状态并更新工作区
```

保存失败时不推进 workflow、不切换工作区，返回保存失败提示。

## React 适配层

保留 `useStudioState` 作为唯一 React 适配层，但一次性替换其对外形状，按用途分组暴露：

- `workflow`：当前写作工作流快照和工作流命令能力。
- `progress`：恢复、保存、跨标签页进度和 Agent 对话恢复协调。
- `ui`：工作台 UI 状态和 UI 命令。
- 工作区 adapter：由 `StepWorkspace` 根据当前阶段生成，工作区只获得自己的阶段能力。

`useStudioState` 负责 React 生命周期与副作用协调，不重新实现阶段推进规则。

## 非目标

- 不改变 FlowDraft 的阶段顺序和领域术语。
- 不改变可恢复进度的业务语义和整体放弃规则。
- 不引入新的状态管理库。
- 不在本次重构中重做各工作区的视觉布局。
- 不为了抽象而为每个字段新增独立命令；阶段内编辑保留受约束的 patch 能力。
- 不保留旧的扁平 `StudioController` 兼容接口。

## 验收标准

1. `studio.workflow.ts` 的命令入口可脱离 React 和浏览器 API 独立测试。
2. 命令拒绝原因可区分阶段未完成、阶段已确认、工作流已完成等业务情况。
3. 阶段内编辑、接受、重置、完成的状态不变量与现有行为一致。
4. 接受、重置、重新开始和完成在保存失败时都不提交新状态。
5. 工作区不再直接构造全局 `stageId + patch` 调用。
6. 工作区不再需要访问与自身无关的全局流程命令。
7. `activeWorkspaceId` 和 Agent 对话仍能随整体快照恢复，但不参与工作流完整性判断。
8. 现有前端 workflow 与 hook 测试迁移后全部通过，并补充统一命令入口和保存时序测试。

## 实现顺序

1. 重写 `studio.workflow.ts` 的命令类型、命令入口和结果类型。
2. 一次性迁移 `useStudioState.ts` 到新的分组 interface 与保存时序。
3. 迁移 `StudioWorkspace`、壳组件和 `StepWorkspace` 的调用方式。
4. 迁移各工作区与 Agent 工具到阶段 adapter。
5. 删除旧接口、更新测试并运行前端 lint、类型检查和 Vitest。