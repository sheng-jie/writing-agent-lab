# DDD Tactical Patterns

Use this reference when modeling an entity, value object, aggregate, repository, domain event, domain service, factory, or specification in C#.

## Contents

- Building blocks overview
- Entity
- Value object
- Aggregate
- Repository
- Domain event
- Domain service
- Factory
- Specification pattern

## Building Blocks Overview

| Building Block | Use For | .NET Shape |
| --- | --- | --- |
| Entity | Identity and behavior over time | Class with ID and methods |
| Value Object | Immutable value equality | Prefer sealed `record`/class; use `record struct` only when `default` is valid or explicitly handled |
| Aggregate | Transactional consistency boundary | Aggregate root + encapsulated children |
| Repository | Aggregate persistence port | Interface + Infrastructure implementation |
| Domain Event | Something that happened | Immutable past-tense record/class |
| Domain Service | Stateless domain logic | Domain class with no I/O |
| Factory | Complex valid creation | Static factory or dedicated domain factory |
| Specification | Reusable business predicate | Domain predicate, not persistence query leakage |

## Entity

### Characteristics

- Has stable identity.
- Encapsulates behavior and state transitions.
- Protects invariants.
- Uses private setters/backing fields where needed for persistence.

### Pattern

```csharp
public abstract class Entity<TId>
{
    protected Entity(TId id) => Id = id;
    public TId Id { get; }
}
```

## Value Object

### Characteristics

- Equality by value.
- Immutable after creation.
- Validated at creation.
- No identity.

### Common Value Objects

- `Money`
- `EmailAddress`
- `Address`
- `Quantity`
- `DateRange`
- Strongly typed IDs such as `OrderId`

### Pattern

```csharp
public sealed record Quantity
{
    public int Value { get; }

    private Quantity(int value) => Value = value;

    public static Quantity Create(int value)
    {
        if (value <= 0) throw new DomainException("Quantity must be positive.");
        return new Quantity(value);
    }
}
```

Avoid a struct when its implicit `default` value would violate an invariant. If a value object must be a struct, explicitly define and validate its default-state semantics.

## Aggregate

### Rules

- Aggregate root is the only externally referenced object.
- Change one aggregate in one transaction by default.
- Reference other aggregates by ID.
- Raise domain events for cross-aggregate reactions.

### Aggregate Sizing Heuristics

- Keep aggregates small.
- Include child entities only when invariants require same-transaction consistency.
- Split large object graphs that are mostly read together but not changed together.

### Design Guidelines

- Put commands as behavior methods: `Confirm`, `Cancel`, `AddItem`.
- Do not expose mutable collections.
- Do not inject services into aggregate constructors.
- Pass domain services or values into methods only when the operation needs them and they are domain concepts.

### Pattern

```csharp
public abstract class AggregateRoot<TId> : Entity<TId>
{
    private readonly List<IDomainEvent> _domainEvents = [];

    protected AggregateRoot(TId id) : base(id) { }

    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    protected void Raise(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
    public void ClearDomainEvents() => _domainEvents.Clear();
}
```

## Repository

### Rules

- One repository per aggregate root, not per table.
- Place aggregate repository interfaces according to the solution's documented convention; do not mix Domain-owned and Application-owned repository ports between modules.
- Implementation lives in Infrastructure.
- No `IQueryable<T>` leakage.
- Async methods include `CancellationToken`.

### Pattern

```csharp
public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(OrderId id, CancellationToken cancellationToken);
    Task AddAsync(Order order, CancellationToken cancellationToken);
}
```

### Common Mistakes

- Repository per child entity.
- Generic repository hiding aggregate-specific language.
- Returning persistence models instead of aggregates.
- Query methods that encode UI-specific read needs in write repositories.

## Domain Event

### Characteristics

- Immutable fact that already happened.
- Named in past tense.
- Contains identifiers and facts, not service objects or loaded graphs.

### Pattern

```csharp
public interface IDomainEvent
{
    DateTimeOffset OccurredOnUtc { get; }
}

public sealed record OrderConfirmedDomainEvent(
    OrderId OrderId,
    DateTimeOffset OccurredOnUtc) : IDomainEvent;
```

## Domain Service

### When to Use

- The logic is domain behavior.
- It does not naturally belong to one entity or value object.
- It is stateless and has no infrastructure I/O.

### Pattern

```csharp
public sealed class PricingPolicy
{
    public Money CalculateTotal(IEnumerable<OrderItem> items) =>
        items.Aggregate(Money.Zero("USD"), (total, item) => total + item.Subtotal);
}
```

## Factory

### When to Use

- Creation has multiple steps.
- Valid construction depends on several domain concepts.
- Constructor overloads would expose invalid intermediate states.

### Pattern

```csharp
// Application obtains the time through an IClock port, then passes the value into Domain.
var order = Order.Place(customerId, clock.UtcNow);
```

Prefer passing externally obtained values such as time, identity, and generated IDs into domain behavior. A domain factory may depend on a service only when that service is itself a pure domain concept, not an Infrastructure or Application port.

Use a factory only when it adds clarity. Static factories on the aggregate are often enough.

## Specification Pattern

Use specifications for reusable domain predicates. Keep them as domain rules, not as persistence-query plumbing unless the codebase explicitly supports translating specifications to queries.

```csharp
public sealed class CanConfirmOrderSpecification
{
    public bool IsSatisfiedBy(Order order) => order.Items.Count > 0 && order.Status == OrderStatus.Draft;
}
```

