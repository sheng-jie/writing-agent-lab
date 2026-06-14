import { HttpAgent } from "@ag-ui/client";
import { CopilotRuntime, ExperimentalEmptyAdapter } from "@copilotkit/runtime";
import { createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";

// 从环境变量读取 .NET 后端地址；默认指向本地 Minimal API。
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5678";

// 注册一个 CopilotKit Agent，内部通过 AG-UI HttpAgent 连接 .NET 后端。
const runtime = new CopilotRuntime({
  agents: {
    writingAssistant: new HttpAgent({
      // 这个地址对应后端 app.MapAGUI 暴露的 Agent endpoint。
      url: `${backendUrl}/agui/agents/writing-assistant`,
    }),
  },
});

// 这里不让前端直接调用模型，因此使用空 Adapter。
const serviceAdapter = new ExperimentalEmptyAdapter();
runtime.handleServiceAdapter(serviceAdapter);

// 创建 CopilotKit 单路由处理器，对应前端 runtimeUrl="/api/copilotkit"。
const handler = createCopilotRuntimeHandler({
  runtime: runtime.instance,
  basePath: "/api/copilotkit",
  mode: "single-route",
  cors: true,
});

// App Router 中同时导出 GET/POST，便于 CopilotKit 查询 runtime 信息和发送消息。
export const GET = handler;
export const POST = handler;