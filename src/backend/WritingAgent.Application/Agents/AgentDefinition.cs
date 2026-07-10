namespace WritingAgent.Application.Agents;

public class AgentDefinition
{
    public AgentDefinition(
        string id,
        string name,
        string description,
        string instructions,
        IEnumerable<string>? allowedToolNames = null,
        IEnumerable<string>? skillNames = null)
    {
        Id = RequireText(id, nameof(id));
        Name = RequireText(name, nameof(name));
        Description = RequireText(description, nameof(description));
        Instructions = RequireText(instructions, nameof(instructions));
        AllowedToolNames = NormalizeNames(allowedToolNames);
        SkillNames = NormalizeNames(skillNames);
    }

    public string Id { get; }

    public string Name { get; }

    public string Description { get; }

    public string Instructions { get; }

    public IReadOnlyList<string> AllowedToolNames { get; }

    public IReadOnlyList<string> SkillNames { get; }

    private static string RequireText(string value, string parameterName) =>
        string.IsNullOrWhiteSpace(value)
            ? throw new ArgumentException("Value cannot be empty.", parameterName)
            : value.Trim();

    private static IReadOnlyList<string> NormalizeNames(IEnumerable<string>? names) =>
        (names ?? [])
            .Select(name => string.IsNullOrWhiteSpace(name)
                ? throw new ArgumentException("Name cannot be empty.", nameof(names))
                : name.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
}
