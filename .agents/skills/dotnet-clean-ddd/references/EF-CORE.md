# EF Core Persistence Guidance

Use this reference when adding `DbContext`, mappings, repositories, migrations, or persistence integration tests.

## Rules

- Keep Entity Framework Core references in Infrastructure.
- Prefer Fluent API with `IEntityTypeConfiguration<T>` over attributes on domain classes.
- Map value objects with owned types or conversions.
- Use backing fields for child collections to preserve aggregate encapsulation.
- Treat `DbContext` as the Infrastructure unit of work; add an `IUnitOfWork` abstraction only when it makes the Application use-case commit boundary clearer.
- Repository implementations should load and save aggregate roots.
- Do not leak `DbSet<T>`, `IQueryable<T>`, provider exceptions, or transactions into Domain/Application.

## Repository Implementation

```csharp
internal sealed class OrderRepository(AppDbContext dbContext) : IOrderRepository
{
    public Task<Order?> GetByIdAsync(OrderId id, CancellationToken cancellationToken)
    {
        return dbContext.Orders
            .Include(order => order.Items)
            .SingleOrDefaultAsync(order => order.Id == id, cancellationToken);
    }

    public async Task AddAsync(Order order, CancellationToken cancellationToken)
    {
        await dbContext.Orders.AddAsync(order, cancellationToken);
    }
}
```

## Mapping Checklist

- Strongly typed IDs use `HasConversion`.
- Value objects use `OwnsOne`, `OwnsMany`, or conversions.
- Private collections use field access mode.
- Concurrency-sensitive aggregates use row version or provider-specific concurrency tokens.
- Domain events are ignored or extracted before save; they are not normal persisted navigation properties.

## Outbox

When events must be reliably published outside the process, map domain events to stable integration-event contracts, write outbox rows in the same transaction as aggregate changes, and publish them from a background worker. Do not publish to the broker, send email, or call external HTTP services before the database transaction commits.

