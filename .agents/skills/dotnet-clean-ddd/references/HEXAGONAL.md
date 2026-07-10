# Hexagonal Architecture (Ports & Adapters)

Use this reference before defining ports/adapters, naming interfaces, or deciding whether an adapter belongs in API or Infrastructure.

## Contents

- Core concept
- Ports
- Adapters
- Naming conventions
- Project structure
- Key asymmetry
- Strong vs weak hexagonal implementation

## Core Concept

The application core should not know whether it is driven by HTTP, messages, tests, CLI, or a scheduler. It also should not know whether persistence is SQL, document storage, a file, or an external API.

In .NET terms:

```text
Driver adapter       Driver port / use case        Domain
ASP.NET endpoint --> PlaceOrderCommandHandler --> Order aggregate

Application port     Driven adapter
IOrderRepository --> EfCoreOrderRepository
IClock -----------> SystemClock
```

## Ports

### Driver Ports (Primary / Inbound)

Driver ports are how outside actors ask the application to do work. In .NET they are often:

- MediatR `IRequest<TResponse>` handlers.
- Explicit use-case interfaces such as `IPlaceOrderUseCase`.
- Application service methods.

Keep driver ports/use cases in Application. Do not let ASP.NET Core controllers become the use case.

### Driven Ports (Secondary / Outbound)

Driven ports describe what the application core needs from the outside world:

- `IOrderRepository`
- `IUnitOfWork`
- `IClock`
- `ICurrentUser`
- `IEmailSender`
- `IPaymentGateway`
- `IIntegrationEventPublisher`

Place aggregate repositories according to the solution's documented port convention; do not mix conventions between modules. Place external service ports in Application unless they are true domain concepts. Obtain external values such as time or current user in Application and pass values into Domain behavior where possible.

## Adapters

### Driver Adapters (Primary / Inbound)

Examples:

- ASP.NET Core controllers.
- Minimal API endpoint groups.
- gRPC services.
- Background workers consuming messages.
- CLI commands.

Driver adapters translate protocol concerns into application requests. They handle model binding, authentication middleware integration, response codes, and problem details. They do not enforce domain invariants.

### Driven Adapters (Secondary / Outbound)

Examples:

- EF Core repository implementations.
- HTTP clients for external systems.
- Message broker publishers.
- File/blob storage clients.
- System clock and current-user adapters.

Driven adapters implement ports and live in Infrastructure unless the adapter is purely presentation/driver infrastructure.

## Naming Conventions

| Concept | Recommended .NET Naming |
| --- | --- |
| Use case command | `PlaceOrderCommand` |
| Use case handler | `PlaceOrderCommandHandler` |
| Query | `GetOrderQuery` |
| Query handler | `GetOrderQueryHandler` |
| Driven port | `IOrderRepository`, `IPaymentGateway` |
| Adapter | `EfCoreOrderRepository`, `StripePaymentGateway` |
| Domain event | `OrderPlacedDomainEvent` |
| Integration event | `OrderPlacedIntegrationEvent` |

Avoid suffixes like `Manager` or `Processor` when a precise domain/use-case name exists.

## Project Structure

```text
Application/
├── Orders/PlaceOrder/PlaceOrderCommandHandler.cs
└── Abstractions/IPaymentGateway.cs

Infrastructure/
├── Persistence/Repositories/EfCoreOrderRepository.cs
└── Payments/StripePaymentGateway.cs

Api/
└── Endpoints/OrdersEndpoints.cs
```

## Key Asymmetry

Driver adapters call inward. Driven adapters are called by inward code through interfaces. This means API depends on Application, while Infrastructure implements Application/Domain ports.

## Configurability via Adapters

Use DI to select adapters at composition root:

```csharp
services.AddScoped<IOrderRepository, EfCoreOrderRepository>();
services.AddScoped<IPaymentGateway, StripePaymentGateway>();
services.AddSingleton<IClock, SystemClock>();
```

Do not inject `IServiceProvider` into domain/application objects to choose adapters dynamically.

In an ASP.NET Core host, register these adapters from the composition root. Endpoints call Application driver ports/use cases; they must not call Infrastructure adapters directly.

## Strong vs Weak Hexagonal

### Weak Implementation

- Controllers call repositories directly.
- Application handlers expose persistence queries.
- Domain objects include persistence attributes.

### Strong Implementation

- Controllers call use cases.
- Use cases depend on ports.
- Infrastructure implements ports.
- Domain is testable without external systems.

## Benefits

- Framework-independent domain behavior.
- Faster domain tests.
- Replaceable persistence and external systems.
- Clear seams for integration testing.
- Reduced accidental coupling between ASP.NET Core, EF Core, and business rules.

