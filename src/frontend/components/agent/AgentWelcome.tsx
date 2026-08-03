"use client";

export interface AgentWelcomeExample {
  title: string;
  copy: string;
  value: string;
  /**
   * 点击该示例后的行为：
   * - "fill"（默认）：把 value 填入底部输入框，由用户确认后再手动发送。
   * - "send"：直接以 value 发送消息给 Agent，不需要用户再次确认。
   */
  mode?: "fill" | "send";
}

export interface AgentWelcomeConfig {
  title: string;
  description: string;
  examples: AgentWelcomeExample[];
}

export interface AgentWelcomeProps {
  config: AgentWelcomeConfig;
  disabled: boolean;
  onFillExample: (value: string) => void;
  onSendExample: (value: string) => void;
}

/**
 * 首屏欢迎引导：未产生任何消息前展示，有消息后自动退出。
 * 不是空状态提示，而是主动引导——不感知具体业务，纯展示 + 回调。
 */
export function AgentWelcome({ config, disabled, onFillExample, onSendExample }: AgentWelcomeProps) {
  return (
    <section className="agent-welcome flex h-full flex-col items-center justify-start gap-4 px-2 pt-4 text-center" aria-label="欢迎引导">
      <div className="agent-welcome-card w-full max-w-xl rounded-2xl border border-border bg-card p-5 text-left shadow-xs">
        <h3 className="text-base font-semibold text-card-foreground">{config.title}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{config.description}</p>

        {config.examples.length ? (
          <div className="agent-welcome-examples mt-4 grid gap-2" aria-label="示例想法">
            {config.examples.map((example) => {
              const isSendMode = example.mode === "send";

              return (
                <button
                  key={example.title}
                  type="button"
                  disabled={disabled}
                  onClick={() => (isSendMode ? onSendExample(example.value) : onFillExample(example.value))}
                  className="agent-welcome-example rounded-xl border border-border bg-background p-3 text-left text-sm transition disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="agent-welcome-example-head flex items-start justify-between gap-2">
                    <strong className="block text-foreground">{example.title}</strong>
                    <span className="agent-welcome-example-badge shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium">
                      {isSendMode ? "直接发送" : "点击填入"}
                    </span>
                  </span>
                  <span className="agent-welcome-example-copy mt-1 block text-xs text-muted-foreground">{example.copy}</span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
