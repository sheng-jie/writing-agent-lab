"use client";

import { CopilotChatAssistantMessage, CopilotChatUserMessage } from "@copilotkit/react-core/v2";
import type { ComponentProps } from "react";

import styles from "./ChatMessages.module.css";
import { cn } from "@/lib/utils";

export const flowDraftMessageViewClassName = styles.messageView;

export const FlowDraftUserMessage = Object.assign(function FlowDraftUserMessage(props: ComponentProps<typeof CopilotChatUserMessage>) {
  return (
    <div className={cn(styles.row, styles.userRow)}>
      <CopilotChatUserMessage
        {...props}
        className={cn(styles.userMessage, props.className)}
        messageRenderer={({ content, className }) => (
          <CopilotChatUserMessage.MessageRenderer
            content={content}
            className={cn(styles.bubble, styles.userBubble, className)}
          />
        )}
        toolbar={() => null}
      />
      <div className={cn(styles.avatar, styles.userAvatar)} aria-hidden="true">你</div>
    </div>
  );
}, CopilotChatUserMessage);

export const FlowDraftAssistantMessage = Object.assign(function FlowDraftAssistantMessage(props: ComponentProps<typeof CopilotChatAssistantMessage>) {
  const content = typeof props.message.content === "string" ? props.message.content.trim() : "";
  const hasToolCalls = Boolean(props.message.toolCalls?.length);

  if (!content && !hasToolCalls) {
    return null;
  }

  if (!content && hasToolCalls) {
    return (
      <div className={cn(styles.row, styles.toolRow)}>
        <div className={styles.avatar} aria-hidden="true">AI</div>
        <CopilotChatAssistantMessage
          {...props}
          className={cn(styles.assistantMessage, styles.assistantToolMessage, props.className)}
          markdownRenderer={() => null}
          toolbar={() => null}
        />
      </div>
    );
  }

  return (
    <div className={styles.row}>
      <div className={styles.avatar} aria-hidden="true">AI</div>
      <CopilotChatAssistantMessage
        {...props}
        className={cn(styles.assistantMessage, props.className)}
        markdownRenderer={({ content, className, ...markdownProps }) => (
          <div className={cn(styles.bubble, styles.assistantBubble)}>
            <CopilotChatAssistantMessage.MarkdownRenderer
              {...markdownProps}
              content={content}
              className={className}
            />
          </div>
        )}
        toolbar={() => null}
      />
    </div>
  );
}, CopilotChatAssistantMessage);
