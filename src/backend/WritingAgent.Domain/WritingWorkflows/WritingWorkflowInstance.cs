using WritingAgent.Domain.Shared;

namespace WritingAgent.Domain.WritingWorkflows;

public sealed class WritingWorkflowInstance
{
    private readonly List<StageArtifact> artifacts = [];

    private WritingWorkflowInstance(WritingWorkflowStage currentStage)
    {
        CurrentStage = currentStage;
    }

    public WritingWorkflowStage CurrentStage { get; private set; }

    public IReadOnlyList<StageArtifact> Artifacts => artifacts;

    public static WritingWorkflowInstance Start() => new(WritingWorkflowStage.CaptureIdea);

    public void AdvanceTo(WritingWorkflowStage nextStage, StageArtifact artifact)
    {
        if ((int)nextStage != (int)CurrentStage + 1)
        {
            throw new DomainException("Writing workflow can only advance to the next stage.");
        }

        if (artifact.Stage != CurrentStage)
        {
            throw new DomainException("Stage artifact must describe the completed current stage.");
        }

        artifacts.Add(artifact);
        CurrentStage = nextStage;
    }
}
