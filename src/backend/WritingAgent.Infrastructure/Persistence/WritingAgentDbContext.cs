using Microsoft.EntityFrameworkCore;

namespace WritingAgent.Infrastructure.Persistence;

public sealed class WritingAgentDbContext(DbContextOptions<WritingAgentDbContext> options) : DbContext(options)
{
    public DbSet<ArticleRecord> Articles => Set<ArticleRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfiguration(new ArticleEntityTypeConfiguration());
    }
}
