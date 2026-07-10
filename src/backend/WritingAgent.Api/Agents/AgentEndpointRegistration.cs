using Microsoft.Agents.AI.Hosting.AGUI.AspNetCore;
using WritingAgent.Application.Agents;
using WritingAgent.Infrastructure.Agents;

namespace WritingAgent.Api.Agents;

public static class AgentEndpointRegistration
{
    public static WebApplication MapWritingAgents(this WebApplication app)
    {
        var definitions = app.Services.GetRequiredService<IEnumerable<AgentDefinition>>();
        var assembler = app.Services.GetRequiredService<AgentAssembler>();

        app.MapGet("/agui/agents", () => definitions.Select(definition => new
        {
            id = definition.Id,
            name = definition.Name,
            description = definition.Description
        }));

        foreach (var definition in definitions)
        {
            app.MapAGUI($"/agui/agents/{definition.Id}", assembler.Assemble(definition));
        }

        return app;
    }
}
