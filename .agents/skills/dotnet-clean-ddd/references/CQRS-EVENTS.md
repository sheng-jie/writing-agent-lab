# CQRS & Domain Events

Use this reference when adding commands/queries, domain events, integration events, outbox, sagas, idempotent consumers, or evaluating CQRS/Event Sourcing in a .NET system.

## Contents

- CQRS overview
- Commands vs queries
- Read models and projections
- Domain events
- Event handlers
- Domain events vs integration events
- Event dispatcher pattern
- Outbox pattern
- When to use CQRS
- Event sourcing considerations
- Saga pattern
- Idempotent consumer pattern

## CQRS Overview

CQRS separates write models from read models when they have different needs. It does **not** require separate databases, event sourcing, or message brokers.

In .NET, the simplest form is:

```text
PlaceOrderCommand -> PlaceOrderCommandHandler -> Aggregate -> Repository
GetOrderQuery ----> GetOrderQueryHandler ----> Read DTO
```

Use MediatR if the solution already uses it. Otherwise explicit handler/use-case classes are equivalent.

## Commands vs Queries

### Commands (Write Side)

- State intent: `ConfirmOrderCommand`, not `UpdateOrderStatusCommand` when business language says confirm.
- Validate input with FluentValidation or existing validators.
- Load aggregate roots.
- Call domain behavior methods.
- Persist through repositories/unit of work.
- Forward `CancellationToken` to async I/O.

```csharp
public sealed record ConfirmOrderCommand(Guid OrderId);

public sealed class ConfirmOrderCommandHandler(IOrderRepository orders, IUnitOfWork unitOfWork)
{
    public async Task Handle(ConfirmOrderCommand command, CancellationToken cancellationToken)
    {
        var order = await orders.GetByIdAsync(new OrderId(command.OrderId), cancellationToken)
            ?? throw new NotFoundException("Order", command.OrderId);

        order.Confirm();
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
```

### Queries (Read Side)

- Do not mutate state.
- Return read DTOs shaped for use-case needs.
- Can bypass aggregates when reading, as long as write invariants still live in Domain.
- Keep query data access in Application ports or Infrastructure query services according to the solution convention.

```csharp
public sealed record GetOrderQuery(Guid OrderId);
public sealed record OrderSummaryResponse(Guid Id, string Status, decimal Total);
```

## Read Model (Projection)

Add projections/read models when:

- Reads need denormalized data.
- Query performance conflicts with aggregate persistence shape.
- UI/API response shape diverges significantly from write model.
- Cross-aggregate read views are needed.

Do not add projections for ordinary CRUD screens if simple queries are sufficient.

## Domain Events

### Event Structure

```csharp
public interface IDomainEvent
{
    DateTimeOffset OccurredOnUtc { get; }
}

public sealed record OrderPlacedDomainEvent(
    OrderId OrderId,
    CustomerId CustomerId,
    DateTimeOffset OccurredOnUtc) : IDomainEvent;
```

- Name in past tense.
- Keep immutable.
- Include IDs and facts, not aggregate graphs.
- Raise from aggregate behavior methods.

### Event Handlers

Domain event handlers inside the same process can trigger follow-up application work. Keep handlers idempotent when retries are possible.

When handlers run before the database transaction commits, they may only make local, transactional state changes. They must not send email, call HTTP services, or publish to a broker: a later rollback cannot undo those effects.

```csharp
public sealed class OrderPlacedDomainEventHandler(IIntegrationEventOutbox outbox)
{
    public Task Handle(OrderPlacedDomainEvent domainEvent, CancellationToken cancellationToken)
    {
        var integrationEvent = new OrderPlacedIntegrationEvent(
            domainEvent.OrderId.Value,
            domainEvent.CustomerId.Value,
            domainEvent.OccurredOnUtc);

        return outbox.EnqueueAsync(integrationEvent, cancellationToken);
    }
}
```

`IIntegrationEventOutbox` persists the stable integration-event contract in the same local transaction. A background worker publishes it after commit.

## Domain Events vs Integration Events

### Domain Events

- Internal to bounded context.
- Can use domain types.
- May change with the domain model.

### Integration Events

- Public contract for other processes/contexts.
- Use stable primitive contract fields.
- Version deliberately.
- Do not expose internal aggregate structure.

```csharp
public sealed record OrderPlacedIntegrationEvent(
    Guid OrderId,
    Guid CustomerId,
    DateTimeOffset OccurredOnUtc,
    int SchemaVersion = 1);
```

### Publishing Integration Events

Publish through an Application port implemented by Infrastructure. For reliable delivery, use outbox.

Do not serialize or publish a domain event as an integration event. Map it to an independently versioned integration contract at the bounded-context boundary.

## Event Dispatcher Pattern

Typical .NET options:

- Dispatch domain events in `DbContext.SaveChangesAsync` before commit only when handlers make local transactional changes, such as adding outbox rows.
- Dispatch after commit when handlers should observe committed state; treat failures as retryable work and do not assume rollback is possible.
- Collect events from tracked aggregates and clear them after dispatch/persisting outbox messages.

Do not let Domain depend on MediatR or a dispatcher.

## Outbox Pattern

Use outbox when database changes and external event publishing must be reliable.

Flow:

1. Aggregate raises domain events.
2. Application handler saves aggregate.
3. Save pipeline maps required domain events to integration events and creates outbox rows in the same transaction.
4. Background worker reads unpublished rows.
5. Publisher sends messages and marks rows as published.

Store event type, payload, occurred time, processed time, retry count, and error information.

## When to Use CQRS

### Use CQRS When:

- Read and write models have different shapes or performance needs.
- Read workloads are much heavier than writes.
- Projections simplify cross-aggregate reads.
- Different authorization or consistency needs exist for reads and writes.

### Skip CQRS When:

- A simple application service and repository are enough.
- The team does not need separate read/write models.
- It would duplicate models without solving a real problem.

### Simplified CQRS (Start Here)

Use commands and queries as separate handler classes while sharing the same database and transaction model.

## Event Sourcing: Critical Considerations

### When Event Sourcing Makes Sense

- Event history is the source of truth.
- Temporal queries or audit/replay are core requirements.
- The team can manage event versioning, snapshots, projections, and replay.

### When to Avoid Event Sourcing

- Standard relational persistence is enough.
- Audit logs are sufficient.
- The team is not prepared for operational complexity.

### Event Sourcing Requirements

- Versioned events.
- Idempotent projectors.
- Snapshot strategy for large streams.
- Rebuildable projections.
- Strong operational monitoring.

## Saga Pattern (Cross-Aggregate Workflows)

Use sagas/process managers for long-running workflows across aggregates or services. Keep each local transaction small and communicate through events/commands.

## Idempotent Consumer Pattern

Message consumers should tolerate duplicate delivery. Store processed message IDs or make handlers naturally idempotent.
