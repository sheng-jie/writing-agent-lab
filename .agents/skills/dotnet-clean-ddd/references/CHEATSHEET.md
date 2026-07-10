# Quick Reference Cheatsheet

Use this reference for quick layer, pattern, and naming decisions without loading the deeper references.

## Layer Summary

| Layer | Owns | Does Not Own |
| --- | --- | --- |
| Domain | Entities, value objects, aggregates, domain events, invariants | EF Core, ASP.NET Core, DI, logging |
| Application | Use cases, handlers, ports, validation, transaction boundary | Persistence implementation, controllers |
| Infrastructure | EF Core, repositories, external clients, messaging, outbox | Business rules |
| API | Controllers/endpoints, contracts, middleware, problem details | Aggregate mutation logic |

## Pattern Boundaries

- DDD models the business.
- Clean Architecture controls dependency direction.
- Hexagonal Architecture defines ports and adapters.
- Onion Architecture keeps domain central.
- CQRS separates read/write models only when useful.
- Event Sourcing stores state as events only when event history is the source of truth.

## Quick Decision Trees

### "Where does this code go?"

```text
Business invariant?      → Domain
Use-case orchestration?  → Application
External technology?     → Infrastructure
HTTP/gRPC/CLI protocol?  → API
Interface needed inward? → Domain/Application port
Concrete implementation? → Infrastructure/API adapter
```

### "Entity or Value Object?"

```text
Stable identity?       → Entity
Equality by attributes → Value Object
```

### "Aggregate boundary?"

```text
Needs same transaction? → Same aggregate
Can be eventual?        → Separate aggregate
Referenced by ID?       → Separate aggregate
```

### "Domain Service or Entity Method?"

```text
Mutates one aggregate and protects invariant? → Entity/aggregate method
Stateless logic spanning domain concepts?     → Domain service
Coordinates I/O or transaction?               → Application service/handler
```

## Common Patterns Quick Reference

### Value Object Template

```csharp
public sealed record EmailAddress
{
    public string Value { get; }

    private EmailAddress(string value) => Value = value;

    public static EmailAddress Create(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new DomainException("Email is required.");
        return new EmailAddress(value.Trim().ToLowerInvariant());
    }

    public override string ToString() => Value;
}
```

Use a sealed `record`/class when `default` would violate an invariant. Use a `record struct` only when its default state is valid or explicitly handled.

### Aggregate Repository Template

```csharp
public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(OrderId id, CancellationToken cancellationToken);
    Task AddAsync(Order order, CancellationToken cancellationToken);
}
```

### Use Case Handler Template

```csharp
public sealed class PlaceOrderCommandHandler(
    IOrderRepository orders,
    IUnitOfWork unitOfWork,
    ILogger<PlaceOrderCommandHandler> logger)
{
    public async Task<Guid> Handle(PlaceOrderCommand command, CancellationToken cancellationToken)
    {
        var order = Order.Place(new CustomerId(command.CustomerId));
        await orders.AddAsync(order, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Placed order {OrderId}", order.Id);
        return order.Id.Value;
    }
}
```

## Port Naming Conventions

| Need | Name |
| --- | --- |
| Aggregate persistence | `I{Aggregate}Repository` |
| Transaction abstraction | `IUnitOfWork` |
| Time | `IClock` |
| Current user | `ICurrentUser` |
| External payment system | `IPaymentGateway` |
| Integration event publishing | `IIntegrationEventPublisher` |

## Common Anti-Patterns

- Public setters on aggregates.
- `DbContext` or Infrastructure adapters injected into controllers/endpoints for writes.
- `IQueryable<T>` returned from repositories to Application.
- Domain referencing EF Core or ASP.NET Core.
- Application referencing Infrastructure.
- Business rules in validators or EF Core mappings.
- Service Locator via `IServiceProvider`.
- Repository per table instead of per aggregate.
- Domain event handlers performing email, HTTP calls, or broker publishing before transaction commit.
- Publishing a domain event directly as an integration event.

## Dependency Rules Matrix

| From | Can Depend On |
| --- | --- |
| Domain | Nothing app/framework-specific |
| Application | Domain |
| Infrastructure | Application, Domain |
| API | Application, Infrastructure for composition |

## File Naming Conventions

- Aggregates: `Order.cs`, `Customer.cs`.
- Value objects: `Money.cs`, `EmailAddress.cs`.
- Domain events: `OrderConfirmedDomainEvent.cs`.
- Commands: `ConfirmOrderCommand.cs`.
- Handlers: `ConfirmOrderCommandHandler.cs`.
- Validators: `ConfirmOrderCommandValidator.cs`.
- EF Core configurations: `OrderConfiguration.cs`.
- Repositories: `EfCoreOrderRepository.cs` or `OrderRepository.cs` by convention.

## Complexity Ladder (Start Simple)

1. Rich domain + application handlers + EF Core repository.
2. Add domain events for internal decoupling.
3. Add outbox for reliable integration events.
4. Add CQRS read models when reads diverge.
5. Consider event sourcing only when event history must be source of truth.

