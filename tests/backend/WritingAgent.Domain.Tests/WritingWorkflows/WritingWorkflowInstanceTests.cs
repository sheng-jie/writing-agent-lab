using FluentAssertions;
using WritingAgent.Domain.Shared;
using WritingAgent.Domain.WritingWorkflows;

namespace WritingAgent.Domain.Tests.WritingWorkflows;

public sealed class WritingWorkflowInstanceTests
{
    [Fact]
    public void Start_ShouldBeginAtCaptureIdeaStage()
    {
        var workflow = WritingWorkflowInstance.Start();

        workflow.CurrentStage.Should().Be(WritingWorkflowStage.CaptureIdea);
        workflow.Artifacts.Should().BeEmpty();
    }

    [Fact]
    public void CompleteCurrentStage_ShouldStoreStageArtifactAndAdvanceToNextStage()
    {
        var workflow = WritingWorkflowInstance.Start();
        var artifact = new StageArtifact(WritingWorkflowStage.CaptureIdea, "写作意图草稿");

        workflow.CompleteCurrentStage(artifact);

        workflow.CurrentStage.Should().Be(WritingWorkflowStage.TopicGeneration);
        workflow.Artifacts.Should().ContainSingle()
            .Which.Should().Be(artifact);
    }

    [Fact]
    public void CompleteCurrentStage_ShouldRejectArtifactFromAnotherStage()
    {
        var workflow = WritingWorkflowInstance.Start();

        var act = () => workflow.CompleteCurrentStage(
            new StageArtifact(WritingWorkflowStage.TopicGeneration, "选题列表"));

        act.Should().Throw<DomainException>()
            .WithMessage("Stage artifact must describe the completed current stage.");
    }

    [Fact]
    public void CompleteCurrentStage_ShouldRejectCompletionAfterFinalized()
    {
        var workflow = WritingWorkflowInstance.Start();

        foreach (var stage in Enum.GetValues<WritingWorkflowStage>()
                     .Where(stage => stage != WritingWorkflowStage.Finalized))
        {
            workflow.CompleteCurrentStage(new StageArtifact(stage, $"{stage} 产物"));
        }

        var act = () => workflow.CompleteCurrentStage(
            new StageArtifact(WritingWorkflowStage.Finalized, "不应记录"));

        act.Should().Throw<DomainException>()
            .WithMessage("Finalized writing workflow cannot accept more stage artifacts.");
    }
}
