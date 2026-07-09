using WritingAgent.Domain.Shared;

namespace WritingAgent.Domain.WritingWorkflows;

public readonly record struct StageArtifact
{
    public StageArtifact(WritingWorkflowStage stage, string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new DomainException("Stage artifact content cannot be empty.");
        }

        Stage = stage;
        Content = content.Trim();
    }

    public WritingWorkflowStage Stage { get; }

    public string Content { get; }
}
