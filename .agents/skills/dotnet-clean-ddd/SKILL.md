---
name: dotnet-clean-ddd
description: Guide agents to design and implement .NET systems using Clean Architecture, Domain-Driven Design, and Hexagonal Architecture. Use when working with .NET 8+, C# 12+, ASP.NET Core APIs, bounded contexts, aggregates, value objects, domain events, repository pattern, use cases, CQRS, outbox, EF Core persistence, ports and adapters, onion architecture, or scalable backend structure.
---

# .NET Clean Architecture + DDD + Hexagonal

Backend architecture for .NET systems combining DDD tactical patterns, Clean Architecture dependency rules, and Hexagonal ports/adapters for maintainable, testable services.

This skill is an **opinionated .NET adaptation** of several related architecture traditions. It is not a single canonical architecture model. Use DDD for domain modeling, Hexagonal Architecture for ports/adapters, Clean Architecture for dependency direction, Onion Architecture for domain-centered layering, and CQRS/Event Sourcing only for specific read/write or temporal requirements.

Default technical context: .NET 8+ / C# 12+, ASP.NET Core, Microsoft.Extensions.DependencyInjection, EF Core, nullable reference types, structured logging with `ILogger<T>`, `CancellationToken` for async I/O, and either MediatR or explicit application service/use-case classes. Always follow the target repository's `TargetFramework`, SDK, package versions, analyzers, and existing conventions over this baseline.

## When to Use (and When NOT to)

| Use When | Skip When |
| --- | --- |
| Complex business domain with many rules | Simple CRUD, few business rules |
| Long-lived .NET service or modular monolith | Prototype, MVP, throwaway code |
| Team of 5+ developers | Solo developer or small team (1-2) |
| Multiple entry points: HTTP, workers, messages, CLI | Single entry point, simple API |
| Need to swap persistence, broker, identity, or external APIs | Fixed infrastructure, unlikely to change |
| High test coverage and architectural boundaries required | Quick scripts, internal tools |

**Start simple. Evolve complexity only when needed.** Most .NET systems do not need full CQRS or Event Sourcing.

## Pattern Boundaries

| Pattern | Primary Question | Use It For | Do Not Treat As |
| --- | --- | --- | --- |
| **DDD** | How do we model a complex business domain? | Ubiquitous language, bounded contexts, aggregates, value objects | A project structure by itself |
| **Hexagonal Architecture** | How does the application interact with the outside world? | Ports, driver adapters, driven adapters, testable core | A mandate for one exact folder layout |
| **Clean Architecture** | Which direction should dependencies point? | Inward dependency rule, use-case boundaries, framework independence | A universal four-project template |
| **Onion Architecture** | How do we keep the domain model central? | Domain-centered layers and dependency inversion | A separate requirement when Clean/Hexagonal already solve the local problem |
| **CQRS** | Do reads and writes need different models? | Divergent read/write workloads, projections, specialized queries | A default application architecture |
| **Event Sourcing** | Do we need state from a complete event history? | Audit, temporal queries, replayable workflows | A persistence default for CRUD systems |

## CRITICAL: The Dependency Rule

Dependencies point **inward only**. Outer layers depend on inner layers, never the reverse.

```text
API/Presentation -> Application -> Domain
Infrastructure   -> Application -> Domain

API/Presentation -> Infrastructure  (composition root only)
```

`Infrastructure` is not an HTTP request-processing layer. API endpoints call application use cases; the host references Infrastructure only to register concrete adapters in the composition root.

**Violations to catch:**
- Domain referencing ASP.NET Core, EF Core, MediatR, logging, database clients, HTTP clients, message brokers, or DI containers.
- Controllers/endpoints calling repositories directly instead of application use cases in this architecture style.
- EF Core configurations, repositories, or controllers enforcing core business invariants.
- Entities depending on application services, `IServiceProvider`, `ILogger<T>`, or current-user abstractions.

**Design validation:** If domain behavior can run from unit tests with no web host, no database, no DI container, and no network, boundaries are probably correct.

## Quick Decision Trees

### "Where does this code go?"

```text
Where does it go?
├─ Pure business logic, no I/O                 → Domain project
├─ Orchestrates domain + side effects          → Application project
├─ Talks to database, broker, file, HTTP API   → Infrastructure project
├─ Handles HTTP/gRPC/CLI protocol              → Api/Presentation project
├─ Defines how to interact with outside world  → Port interface in Domain/Application
└─ Implements a port                           → Adapter in Infrastructure/Api
```

**Sharp edges** — placements agents often get wrong:

| Code | Layer | Why |
| --- | --- | --- |
| Business invariant: order needs items to confirm | Domain aggregate method | It is a rule, not orchestration |
| Input shape validation: required JSON field | API contract/validator | Protocol concern, not business rule |
| Command validation: date range, syntactic checks | Application validator | Use-case input concern |
| Use-case commit boundary | Application use case | Application decides when the use case commits |
| `DbContext.SaveChangesAsync` / database transaction | Infrastructure | EF Core and transaction mechanics remain infrastructure details |
| EF Core mapping / table names | Infrastructure | Persistence detail |
| Domain ↔ persistence mapping | Infrastructure | Storage concern |
| Authorization policy | API middleware or Application policy | Domain stays auth-agnostic unless rule is business language |
| Clock, current user, ID generation | Application port; adapter in Infrastructure/API | External information source; pass resulting values into Domain behavior |
| Structured logs | Application/API/Infrastructure | Pure domain objects should not log |

### "Is this an Entity or Value Object?"

```text
Entity or Value Object?
├─ Has unique identity that persists → Entity
├─ Defined only by its attributes    → Value Object
├─ "Is this THE same thing?"         → Entity (identity comparison)
└─ "Does this have the same value?"  → Value Object (structural equality)
```

### "Should this be its own Aggregate?"

```text
Aggregate boundaries?
├─ Must be consistent together in one transaction → Same aggregate
├─ Can be eventually consistent                   → Separate aggregates
├─ Referenced by ID only                          → Separate aggregates
└─ Large object graph or many child entities       → Split it
```

**Rule:** One aggregate per transaction by default. Cross-aggregate consistency uses domain events, integration events, process managers, or sagas when eventual consistency is acceptable.

## Directory / Solution Structure

```text
src/
├── Company.Product.Domain/                 # Core business logic, no external dependencies
│   ├── Abstractions/                       # Entity, AggregateRoot, ValueObject, IDomainEvent
│   ├── {Aggregate}/
│   │   ├── {Aggregate}.cs                  # Aggregate root + behavior
│   │   ├── {ChildEntity}.cs                # Child entities scoped to aggregate
│   │   ├── {ValueObject}.cs                # Immutable values
│   │   ├── {PastTense}DomainEvent.cs       # Domain events
│   │   ├── I{Aggregate}Repository.cs       # Repository port when domain-owned
│   │   └── {DomainService}.cs              # Stateless domain logic
│   └── Shared/                             # DomainException, strongly typed IDs, shared kernel
├── Company.Product.Application/            # Use cases / application services
│   ├── Abstractions/                       # IUnitOfWork, IClock, ICurrentUser, external ports
│   ├── {Feature}/
│   │   ├── {Command}.cs                    # Command/query DTOs or records
│   │   ├── {Command}Handler.cs             # Use case implementation
│   │   └── {Command}Validator.cs           # FluentValidation or existing validator style
│   └── DependencyInjection.cs
├── Company.Product.Infrastructure/         # Driven adapters
│   ├── Persistence/                        # DbContext, EF Core configurations, repositories
│   ├── Messaging/                          # Message broker / outbox adapters
│   ├── Identity/                           # Current user / auth provider adapters
│   ├── Time/                               # SystemClock and other external time sources
│   └── DependencyInjection.cs
├── Company.Product.Api/                    # Driver adapter / composition root
│   ├── Controllers/ or Endpoints/
│   ├── Contracts/                          # HTTP request/response contracts
│   ├── Middleware/                         # Exception handling, auth, problem details
│   └── Program.cs
└── tests/
    ├── Company.Product.Domain.UnitTests/
    ├── Company.Product.Application.UnitTests/
    ├── Company.Product.Infrastructure.IntegrationTests/
    ├── Company.Product.Api.IntegrationTests/
    └── Company.Product.ArchitectureTests/
```

**Port placement:** This skill defaults to a DDD-centered layout where aggregate repository interfaces live beside the aggregate in Domain; external-service ports live in Application. A stricter Hexagonal layout may instead put all driven ports under Application. Choose one repository-port convention per solution, document it, and apply it consistently to every module.

**Presentation layer:** ASP.NET Core controllers/endpoints usually live in `Api`. Some solutions separate `Presentation` from the hosting project. Use one home for HTTP adapters, not both.

**Event publishing:** Saving an aggregate and publishing to a broker are two writes. When events must reach other processes reliably, write outbox messages in the same transaction as aggregate changes.

## DDD Building Blocks

| Pattern | Purpose | Layer | Key .NET Rule |
| --- | --- | --- | --- |
| **Entity** | Identity + behavior | Domain | Equality by ID; avoid public setters |
| **Value Object** | Immutable data | Domain | Prefer a sealed `record`/class when `default` would be invalid; use `record struct` only when its default state is valid or explicitly handled |
| **Aggregate** | Consistency boundary | Domain | Only root is referenced externally |
| **Domain Event** | Record of change | Domain | Past tense name, immutable, IDs over object graphs |
| **Repository** | Persistence abstraction | Domain/Application port | Per aggregate, not per table; no `IQueryable` leakage |
| **Domain Service** | Stateless domain logic | Domain | Use only when logic does not fit an entity/value object |
| **Application Service / Handler** | Use-case orchestration | Application | Coordinates domain + ports + transaction |

## .NET-Specific Rules

- Use dependency injection through constructors or primary constructors; do not use Service Locator.
- Use `CancellationToken` across async I/O: handlers, repositories, EF Core calls, HTTP clients, message processors.
- Use `ILogger<T>` for structured logs outside Domain.
- Use FluentValidation or the existing validation mechanism for input/use-case validation.
- Use EF Core Fluent API (`IEntityTypeConfiguration<T>`) in Infrastructure for persistence mapping.
- Keep domain rules out of controllers, EF Core entity configurations, migrations, and repository implementations.
- Application defines a use case's commit boundary; Infrastructure implements `DbContext`, transactions, and persistence mechanics. Add `IUnitOfWork` only when it improves clarity.
- Queries may bypass aggregates for read performance, but must not expose `IQueryable`, EF entities, or persistence abstractions outside Infrastructure.
- Do not perform external side effects (email, HTTP calls, broker publishing) from transaction-participating domain-event handlers. Convert to a stable integration event and persist it through an outbox.
- Domain events and integration events are distinct types; never publish domain-event objects across bounded-context or process boundaries.
- Follow existing `.editorconfig`, namespace style, nullable settings, analyzers, and test framework.
- Do not force MediatR. If it is absent, use explicit use-case interfaces/classes with the same dependency boundaries.

## Anti-Patterns (CRITICAL)

| Anti-Pattern | Problem | Fix |
| --- | --- | --- |
| **Anemic Domain Model** | Entities are data bags, logic in handlers/controllers | Move behavior into entities/value objects/aggregates |
| **Repository per Entity** | Breaks aggregate boundaries | One repository per aggregate root |
| **Leaking Infrastructure** | Domain references EF Core, ASP.NET Core, logging, HTTP, database libs | Domain has zero framework dependencies |
| **Business Rules in Controllers** | Protocol layer becomes transaction script | Route through application use cases and domain methods |
| **Business Rules in EF Configurations** | Persistence mapping decides behavior | Keep mappings in Infrastructure; invariants in Domain |
| **God Aggregate** | Too many entities, slow transactions | Split into smaller aggregates and use events |
| **Skipping Use Cases** | API calls repositories directly | Add application handlers/services |
| **CRUD Thinking** | Modeling tables, not behavior | Model business operations and state transitions |
| **Premature CQRS** | Complexity before divergent read/write needs | Start with simple handlers and read DTOs |
| **Cross-Aggregate TX** | Coupled consistency and large locks | Prefer domain events/eventual consistency |
| **Transaction-Internal I/O** | Database rollback cannot undo an email, HTTP call, or broker publish | Persist an integration event in an outbox and publish after commit |
| **Service Locator** | Hidden dependencies, poor testability | Use constructor injection |

## Implementation Order

1. **Discover the Domain** — EventStorming, examples, conversations with domain experts.
2. **Model the Domain** — Entities, value objects, aggregates, domain events, domain exceptions; no infrastructure.
3. **Define Ports** — Repository interfaces, external service ports, clock/current-user abstractions.
4. **Implement Use Cases** — Application handlers/services coordinating domain, transactions, validation, authorization, logging.
5. **Add Adapters Last** — ASP.NET Core endpoints, EF Core repositories, message publishers, external clients.
6. **Verify Boundaries** — Domain unit tests, application tests with mocked ports, integration tests for adapters, architecture tests for dependencies.

**DDD is collaborative.** Modeling sessions and examples are as important as code patterns.

## Reference Documentation

For a quick task, read [references/CHEATSHEET.md](references/CHEATSHEET.md) first. For design decisions, cross-layer changes, or unfamiliar areas, then read the matching focused reference below. Do not load every reference by default.

| Before you... | Read |
| --- | --- |
| Make a cross-layer change, wire dependency injection, or decide 3-layer vs 4-layer | [references/LAYERS.md](references/LAYERS.md) |
| Split a system into services/contexts, integrate with a legacy or third-party system, or run EventStorming | [references/DDD-STRATEGIC.md](references/DDD-STRATEGIC.md) |
| Model an entity, value object, aggregate, repository, domain service, or factory | [references/DDD-TACTICAL.md](references/DDD-TACTICAL.md) |
| Define ports/adapters, name interfaces, or lay out a ports-first structure | [references/HEXAGONAL.md](references/HEXAGONAL.md) |
| Add commands/queries, domain vs integration events, outbox, sagas, or evaluate CQRS/Event Sourcing | [references/CQRS-EVENTS.md](references/CQRS-EVENTS.md) |
| Write unit/integration/architecture tests for any layer | [references/TESTING.md](references/TESTING.md) |
| Answer a quick “which pattern/which layer” question without deep-diving | [references/CHEATSHEET.md](references/CHEATSHEET.md) |
| Configure EF Core persistence, repositories, mappings, migrations, or outbox storage | [references/EF-CORE.md](references/EF-CORE.md) |

## Sources

### Primary Sources
- [Hexagonal Architecture — Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- Domain-Driven Design — Eric Evans
- [The Clean Architecture — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Onion Architecture — Jeffrey Palermo](https://jeffreypalermo.com/2008/07/the-onion-architecture-part-1/)
- Implementing Domain-Driven Design — Vaughn Vernon

### Primary Pattern References
- [CQRS — Martin Fowler](https://martinfowler.com/bliki/CQRS.html)
- [Event Sourcing — Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Repository — Martin Fowler](https://martinfowler.com/eaaCatalog/repository.html)
- [Unit of Work — Martin Fowler](https://martinfowler.com/eaaCatalog/unitOfWork.html)
- [Bounded Context — Martin Fowler](https://martinfowler.com/bliki/BoundedContext.html)
- [Transactional Outbox — microservices.io](https://microservices.io/patterns/data/transactional-outbox.html)
- Effective Aggregate Design — Vaughn Vernon

### .NET Implementation Guides
- [Microsoft Learn: .NET microservices architecture](https://learn.microsoft.com/dotnet/architecture/microservices/)
- [Microsoft Learn: EF Core](https://learn.microsoft.com/ef/core/)
- NetArchTest.Rules or ArchUnitNET for architecture tests
