# Layer Structure - Complete Reference

Use this reference when writing code in any layer, wiring dependency injection, or deciding between three-layer, four-layer, or module-oriented .NET layouts.

## Contents

- The four layers
- Domain layer
- Application layer
- Infrastructure layer
- Presentation/API layer
- Dependency flow
- Composition root
- .NET solution structure variants

## The Four Layers

```text
Presentation/API  -> Application -> Domain
Infrastructure --> Application -> Domain
```

| Layer | Responsibility | .NET Project |
| --- | --- | --- |
| Domain | Business model and invariants | `Company.Product.Domain` |
| Application | Use cases and ports | `Company.Product.Application` |
| Infrastructure | Driven adapters and external technology | `Company.Product.Infrastructure` |
| Presentation/API | Driver adapters and composition | `Company.Product.Api` |

## Domain Layer (Innermost)

### Contents

- Entities and aggregate roots.
- Value objects and strongly typed IDs.
- Domain events.
- Domain exceptions.
- Domain services and policies.
- Repository interfaces when they represent aggregate persistence.

### Rules

- Do not reference ASP.NET Core, EF Core, MediatR, logging, configuration, or DI.
- Do not perform async I/O.
- Protect invariants in constructors, factories, and behavior methods.
- Expose read-only collections and behavior methods instead of public setters.

### Example: Domain Entity

```csharp
public sealed class Order : AggregateRoot<OrderId>
{
    private readonly List<OrderItem> _items = [];

    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();
    public OrderStatus Status { get; private set; } = OrderStatus.Draft;

    public void Confirm()
    {
        if (_items.Count == 0) throw new DomainException("Cannot confirm an empty order.");
        Status = OrderStatus.Confirmed;
        Raise(new OrderConfirmedDomainEvent(Id));
    }
}
```

## Application Layer

### Contents

- Commands, queries, handlers, and explicit use-case services.
- Validators such as FluentValidation validators.
- Ports for external services: clock, current user, email, payment, event publishing.
- Use-case commit-boundary abstractions such as `IUnitOfWork` when useful.
- DTOs that represent use-case input/output, not wire contracts.

### Rules

- Depend on Domain, not Infrastructure.
- Coordinate work; do not own business invariants.
- Accept `CancellationToken` and forward it to all async I/O.
- Use `ILogger<T>` for use-case-level structured logs.
- Keep authorization policy checks here when they are use-case concerns.
- Decide when a use case commits; do not contain EF Core transaction mechanics here.

### Example: Use Case Handler

```csharp
public sealed class ConfirmOrderCommandHandler(
    IOrderRepository orders,
    IUnitOfWork unitOfWork,
    ILogger<ConfirmOrderCommandHandler> logger)
{
    public async Task Handle(ConfirmOrderCommand command, CancellationToken cancellationToken)
    {
        var order = await orders.GetByIdAsync(new OrderId(command.OrderId), cancellationToken)
            ?? throw new NotFoundException("Order", command.OrderId);

        order.Confirm();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Confirmed order {OrderId}", command.OrderId);
    }
}
```

### Command/Query DTOs

- Commands state intent and may mutate state.
- Queries retrieve data and should not mutate state.
- Keep API request contracts separate when external wire contracts need versioning or compatibility.

## Infrastructure Layer

### Contents

- EF Core `DbContext`, configurations, migrations, and repositories.
- Message broker publishers/consumers and outbox implementation.
- HTTP clients for external APIs.
- File/blob/email/payment adapters.
- System clock and identity/current-user adapters.

### Rules

- Implement ports from Domain/Application.
- Map between persistence/external contracts and domain/application models.
- Do not enforce business invariants here.
- Hide provider exceptions behind application/domain-friendly errors where appropriate.

### Example: Repository Implementation

```csharp
internal sealed class EfCoreOrderRepository(AppDbContext dbContext) : IOrderRepository
{
    public Task<Order?> GetByIdAsync(OrderId id, CancellationToken cancellationToken) =>
        dbContext.Orders
            .Include(order => order.Items)
            .SingleOrDefaultAsync(order => order.Id == id, cancellationToken);

    public async Task AddAsync(Order order, CancellationToken cancellationToken) =>
        await dbContext.Orders.AddAsync(order, cancellationToken);
}
```

## Presentation Layer

### Contents

- ASP.NET Core controllers or Minimal API endpoint groups.
- Request/response contracts.
- Middleware, filters, authentication integration, exception/problem-details mapping.
- Health checks and OpenAPI configuration.

### Rules

- Translate protocol input into application commands/queries.
- Do not inject repositories or Infrastructure services for write use cases.
- Do not enforce domain invariants.
- Keep HTTP status-code decisions and response shape here.

### Example: HTTP Endpoint

```csharp
group.MapPost("/orders/{id:guid}/confirm", async (
    Guid id,
    ISender sender,
    CancellationToken cancellationToken) =>
{
    await sender.Send(new ConfirmOrderCommand(id), cancellationToken);
    return Results.NoContent();
});
```

If MediatR is not used, inject the explicit use case instead.

## Dependency Flow

- Domain knows only domain concepts.
- Application knows Domain and abstract ports.
- Infrastructure knows Application/Domain and provider SDKs.
- API knows Application and may reference Infrastructure only for composition and service registration; endpoint code must not call Infrastructure adapters directly.

## Composition Root

`Program.cs` should call registration extensions and remain thin:

```csharp
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
```

Avoid resolving services manually from `IServiceProvider` except at framework integration boundaries.

## .NET Solution Structure Variants

### Service-oriented

Use separate projects: `Domain`, `Application`, `Infrastructure`, `Api`.

### Modular monolith

Repeat the same layers per bounded context/module.

### Three-layer compromise

For smaller systems, combine API and Infrastructure only if dependency rules remain testable. Do not collapse Domain into persistence models when business rules matter.
