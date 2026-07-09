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
    public void AdvanceTo_ShouldStoreStageArtifactInsideWorkflowInstance()
    {
        var workflow = WritingWorkflowInstance.Start();
        var artifact = new StageArtifact(WritingWorkflowStage.CaptureIdea, "写作意图草稿");

        workflow.AdvanceTo(WritingWorkflowStage.TopicGeneration, artifact);

        workflow.CurrentStage.Should().Be(WritingWorkflowStage.TopicGeneration);
        workflow.Artifacts.Should().ContainSingle()
            .Which.Should().Be(artifact);
    }

    [Fact]
    public void AdvanceTo_ShouldRejectSkippedStages()
    {
        var workflow = WritingWorkflowInstance.Start();

        var act = () => workflow.AdvanceTo(
            WritingWorkflowStage.DraftWriting,
            new StageArtifact(WritingWorkflowStage.CaptureIdea, "写作意图草稿"));

        act.Should().Throw<DomainException>()
            .WithMessage("Writing workflow can only advance to the next stage.");
    }
}
