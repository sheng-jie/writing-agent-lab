"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { ClarificationToolRegistration } from "./ClarificationTool";

export default function WritingPage() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="clarificationAgent">
      <ClarificationToolRegistration />

      <main className="mx-auto flex min-h-screen max-w-3xl flex-col p-6">
        <h1 className="mb-4 text-2xl font-semibold">Clarification Agent</h1>
        <CopilotChat
          labels={{
            title: "WritingFlow AI",
            initial: "告诉我你想写什么，我会先帮你澄清成写作意图。",
          }}
        />
      </main>
    </CopilotKit>
  );
}
