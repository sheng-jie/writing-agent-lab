using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace WritingAgent.Infrastructure.Persistence;

public sealed class ArticleEntityTypeConfiguration : IEntityTypeConfiguration<ArticleRecord>
{
    public void Configure(EntityTypeBuilder<ArticleRecord> builder)
    {
        builder.ToTable("articles");

        builder.HasKey(article => article.Id);

        builder.Property(article => article.Title)
            .IsRequired();

        builder.Property(article => article.Content)
            .IsRequired();

        builder.Property(article => article.Status)
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(article => article.CreatedAt)
            .IsRequired();
    }
}
