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

    public void CompleteCurrentStage(StageArtifact artifact)
    {
        if (CurrentStage == WritingWorkflowStage.Finalized)
        {
            throw new DomainException("Finalized writing workflow cannot accept more stage artifacts.");
        }

        if (artifact.Stage != CurrentStage)
        {
            throw new DomainException("Stage artifact must describe the completed current stage.");
        }

        artifacts.Add(artifact);
        CurrentStage = (WritingWorkflowStage)((int)CurrentStage + 1);
    }
}
