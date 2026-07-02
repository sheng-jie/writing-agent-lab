"use client";

import { useAgentContext, useDefaultRenderTool, useFrontendTool } from "@copilotkit/react-core/v2";
import { useMemo } from "react";
import { z } from "zod";

type Material = {
  title: string;
  url: string;
  type: "对话素材" | "联网资料" | "用户链接";
};

type Brief = {
  rawNeed: string;
  topic: string;
  audience: string;
  thesis: string;
  materials: Material[];
  selectedDirection: "method" | "product" | "opinion" | "";
};

const materialSchema = z.object({
  title: z.string().min(1),
  url: z.string().min(1),
  type: z.enum(["对话素材", "联网资料", "用户链接"]),
});

const briefPatchSchema = z.object({
  rawNeed: z.string().optional(),
  topic: z.string().optional(),
  audience: z.string().optional(),
  thesis: z.string().optional(),
  materials: z.array(materialSchema).optional(),
  selectedDirection: z.enum(["method", "product", "opinion"]).optional(),
});

const intentCardNameSchema = z.enum(["raw", "topic", "audience", "thesis", "materials"]);

function mergeMaterials(primary: Material[], secondary: Material[]) {
  const seen = new Set<string>();
  return primary.concat(secondary).filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

export function ClarifyCopilotTools({ brief, phase, setBrief, setPhase, showToast, flashCard, flashCards }: {
  brief: Brief;
  phase: "initial" | "clarifying" | "card";
  setBrief: React.Dispatch<React.SetStateAction<Brief>>;
  setPhase: React.Dispatch<React.SetStateAction<"initial" | "clarifying" | "card">>;
  showToast: (text: string) => void;
  flashCard: (name: string) => void;
  flashCards: (names: string[]) => void;
}) {
  const contextValue = useMemo(
    () => ({
      page: "clarify-writing-intent",
      phase,
      brief,
      constraints: {
        maxClarifyingQuestions: 3,
        requiredFields: ["rawNeed", "topic", "audience", "thesis", "materials"],
        toolPolicy: "Use frontend tools to update the left writing intent card after identifying or changing fields.",
      },
    }),
    [brief, phase],
  );

  useAgentContext({
    description: "Current writing intent recognition page state. Use this to understand the left-side card and current phase before asking follow-up questions or updating fields.",
    value: contextValue,
  });

  useDefaultRenderTool();

  useFrontendTool(
    {
      name: "updateWritingBrief",
      description: "Patch one or more fields of the left-side writing intent brief. Use this when the conversation identifies raw need, topic, audience, thesis, selected direction, or materials.",
      parameters: briefPatchSchema,
      handler: async (patch) => {
        const changedCards: string[] = [];

        setBrief((current) => {
          const next: Brief = { ...current };

          if (typeof patch.rawNeed === "string") {
            next.rawNeed = patch.rawNeed;
            changedCards.push("raw");
          }

          if (typeof patch.topic === "string") {
            next.topic = patch.topic;
            changedCards.push("topic");
          }

          if (typeof patch.audience === "string") {
            next.audience = patch.audience;
            changedCards.push("audience");
          }

          if (typeof patch.thesis === "string") {
            next.thesis = patch.thesis;
            changedCards.push("thesis");
          }

          if (patch.selectedDirection) next.selectedDirection = patch.selectedDirection;

          if (patch.materials?.length) {
            next.materials = mergeMaterials(patch.materials, next.materials);
            changedCards.push("materials");
          }

          return next;
        });

        if (phase === "initial") setPhase("clarifying");
        Array.from(new Set(changedCards)).forEach(flashCard);
        showToast(changedCards.length ? "已同步更新写作意图" : "写作意图已检查");

        return { ok: true, changedCards };
      },
    },
    [phase, setBrief, setPhase, flashCard, showToast],
  );

  useFrontendTool(
    {
      name: "addMaterials",
      description: "Add material links or conversation references to the left-side material list without replacing existing materials.",
      parameters: z.object({ materials: z.array(materialSchema).min(1) }),
      handler: async ({ materials }) => {
        setBrief((current) => ({
          ...current,
          materials: mergeMaterials(materials, current.materials),
        }));
        flashCard("materials");
        showToast("已补充素材清单");

        return { ok: true, added: materials.length };
      },
    },
    [setBrief, flashCard, showToast],
  );

  useFrontendTool(
    {
      name: "highlightIntentCard",
      description: "Highlight one left-side writing intent card after it has been updated or should draw user attention.",
      parameters: z.object({ cardName: intentCardNameSchema }),
      handler: async ({ cardName }) => {
        flashCard(cardName);
        return { ok: true, highlighted: cardName };
      },
    },
    [flashCard],
  );

  useFrontendTool(
    {
      name: "saveWritingIntentCard",
      description: "Save a complete writing intent brief and switch the left panel from guide state to the structured writing intent card.",
      parameters: briefPatchSchema,
      handler: async (nextBrief) => {
        setBrief((current) => ({
          rawNeed: nextBrief.rawNeed ?? current.rawNeed,
          topic: nextBrief.topic ?? current.topic,
          audience: nextBrief.audience ?? current.audience,
          thesis: nextBrief.thesis ?? current.thesis,
          materials: nextBrief.materials?.length ? mergeMaterials(nextBrief.materials, current.materials) : current.materials,
          selectedDirection: nextBrief.selectedDirection ?? current.selectedDirection,
        }));
        setPhase("card");
        flashCards(["raw", "topic", "audience", "thesis", "materials"]);
        showToast("写作意图卡片已生成");

        return { ok: true, phase: "card" };
      },
    },
    [setBrief, setPhase, flashCards, showToast],
  );

  return null;
}
