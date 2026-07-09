using FluentAssertions;
using NetArchTest.Rules;
using WritingAgent.Api.Endpoints;
using WritingAgent.Domain.Articles;

namespace WritingAgent.Architecture.Tests;

public sealed class DependencyRuleTests
{
    [Fact]
    public void Domain_ShouldNotDependOnOuterLayersOrFrameworks()
    {
        var result = Types.InAssembly(typeof(Article).Assembly)
            .ShouldNot()
            .HaveDependencyOnAny(
                "WritingAgent.Application",
                "WritingAgent.Infrastructure",
                "WritingAgent.Api",
                "Microsoft.EntityFrameworkCore",
                "Microsoft.AspNetCore",
                "Microsoft.Agents.AI")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(string.Join(", ", result.FailingTypeNames ?? []));
    }

    [Fact]
    public void Application_ShouldNotDependOnInfrastructureOrApi()
    {
        var result = Types.InAssembly(typeof(WritingAgent.Application.DependencyInjection).Assembly)
            .ShouldNot()
            .HaveDependencyOnAny(
                "WritingAgent.Infrastructure",
                "WritingAgent.Api")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(string.Join(", ", result.FailingTypeNames ?? []));
    }

    [Fact]
    public void Infrastructure_ShouldNotDependOnApi()
    {
        var result = Types.InAssembly(typeof(WritingAgent.Infrastructure.DependencyInjection).Assembly)
            .ShouldNot()
            .HaveDependencyOn("WritingAgent.Api")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(string.Join(", ", result.FailingTypeNames ?? []));
    }

    [Fact]
    public void InnerProjects_ShouldNotReferenceApi()
    {
        var innerProjectResults = new[]
        {
            Types.InAssembly(typeof(Article).Assembly)
                .ShouldNot()
                .HaveDependencyOn("WritingAgent.Api")
                .GetResult(),
            Types.InAssembly(typeof(WritingAgent.Application.DependencyInjection).Assembly)
                .ShouldNot()
                .HaveDependencyOn("WritingAgent.Api")
                .GetResult(),
            Types.InAssembly(typeof(WritingAgent.Infrastructure.DependencyInjection).Assembly)
                .ShouldNot()
                .HaveDependencyOn("WritingAgent.Api")
                .GetResult()
        };

        innerProjectResults.Should().OnlyContain(result => result.IsSuccessful);
    }

    [Fact]
    public void WritingWorkflowTypes_ShouldNotIntroduceRepositories()
    {
        var result = Types.InAssembly(typeof(Article).Assembly)
            .That()
            .ResideInNamespace("WritingAgent.Domain.WritingWorkflows")
            .ShouldNot()
            .HaveNameEndingWith("Repository")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(string.Join(", ", result.FailingTypeNames ?? []));
    }

    [Fact]
    public void Api_ShouldNotDependDirectlyOnDomain()
    {
        var result = Types.InAssembly(typeof(ArticleEndpoints).Assembly)
            .ShouldNot()
            .HaveDependencyOn("WritingAgent.Domain")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(string.Join(", ", result.FailingTypeNames ?? []));
    }
}
