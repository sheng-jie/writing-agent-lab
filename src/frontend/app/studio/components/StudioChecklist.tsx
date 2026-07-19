import { StudioPanel } from "./StudioPanel";

const readabilityChecks = [
  ["开头 3 秒内出现痛点", true],
  ["连续抽象词过多", false],
  ["段落长度适中", true],
  ["小标题还可更结果导向", false],
] as const;

const publishChecks = [
  ["标题结果明确", true],
  ["封面图已生成", true],
  ["摘要不够具体", false],
  ["小标题层级清晰", true],
  ["文末行动号召需更轻", false],
  ["移动端预览无长段落", true],
] as const;

export function StudioChecklist({ publish = false }: { publish?: boolean }) {
  const rows = publish ? publishChecks : readabilityChecks;

  return (
    <StudioPanel
      title={publish ? "发布检查" : "可读性检查"}
      caption={publish ? "确认标题、摘要、封面、格式与 CTA。" : "优先处理影响阅读节奏的问题。"}
    >
      <div className="studio-checks">
        {rows.map(([label, done]) => (
          <p key={label} className={done ? "done" : ""}>
            <i>{done ? "✓" : ""}</i>
            <span>{label}</span>
            <small>{done ? "通过" : "待处理"}</small>
          </p>
        ))}
      </div>
    </StudioPanel>
  );
}
