# DDD Strategic Patterns

Use this reference before splitting a .NET system into modules, services, bounded contexts, or anti-corruption layers.

## Contents

- Domain discovery techniques
- Ubiquitous language
- Bounded contexts
- Subdomains
- Context mapping
- Integration patterns
- Strategic design checklist

## Overview

Strategic DDD decides **where boundaries belong** before tactical DDD decides which classes to write. In .NET, a bounded context may become a module in a modular monolith, a set of projects in one solution, or a separately deployed service. Do not start with projects or microservices; start with language, ownership, and consistency boundaries.

## Domain Discovery Techniques

### EventStorming

Use EventStorming to discover commands, events, policies, actors, aggregates, external systems, and pain points.

| Sticky Note | .NET Artifact It May Become |
| --- | --- |
| Command | Application command record and handler |
| Domain event | Domain event record/class |
| Policy | Domain service or application policy |
| Aggregate | Aggregate root class |
| External system | Application port + Infrastructure adapter |
| Read model | Query DTO/projection |

Do not turn every sticky note into a class. Use it to clarify language and boundaries first.

### Context Mapping Workshop

Map teams, systems, data ownership, upstream/downstream dependencies, and integration contracts. Decide where anti-corruption layers are needed before writing adapters.

## Ubiquitous Language

- Use business terms in namespaces, class names, method names, commands, and events.
- Prefer `ConfirmOrder`, `OrderConfirmedDomainEvent`, and `CreditLimitExceeded` over technical names like `UpdateStatus`.
- Keep the same word from meaning different things inside one bounded context.
- Let different bounded contexts use different models when the business language differs.

## Bounded Contexts

A bounded context owns a model and its language. In .NET, common implementations are:

```text
src/
├── Sales.Domain/
├── Sales.Application/
├── Sales.Infrastructure/
├── Fulfillment.Domain/
├── Fulfillment.Application/
└── Fulfillment.Infrastructure/
```

or a module-oriented layout:

```text
src/Company.Product.Modules/
├── Sales/
│   ├── Domain/
│   ├── Application/
│   └── Infrastructure/
└── Fulfillment/
    ├── Domain/
    ├── Application/
    └── Infrastructure/
```

Choose based on deployment, team ownership, and coupling. Do not split into microservices only because DDD is mentioned.

## Subdomains

| Type | Treatment |
| --- | --- |
| Core domain | Invest in rich domain model and tests |
| Supporting subdomain | Keep clean boundaries but avoid over-engineering |
| Generic subdomain | Prefer existing product/library/provider |

Ask: Where is the business advantage? Where do rules change most often? Which model needs the strongest tests?

## Context Mapping

| Relationship | .NET Implementation Guidance |
| --- | --- |
| Partnership | Shared integration tests and explicit contracts |
| Customer/Supplier | Downstream adapts to upstream published contract |
| Conformist | Downstream uses upstream model directly when acceptable |
| Anti-Corruption Layer | Application port + Infrastructure adapter translating external model |
| Open Host Service | Stable API or message contract exposed to other contexts |
| Published Language | Shared integration event contracts/versioning |

## Integration Patterns

### Domain Events for Internal Integration

Use domain events inside a bounded context to decouple handlers. They are internal and can reference domain language.

### Integration Events for Context Integration

Use integration events across contexts/services. They should be versioned, stable, and not expose internal aggregate structure.

### Anti-Corruption Layer

Use an ACL when an external model would pollute your domain language:

```text
Application port: ICreditCheckGateway
Infrastructure adapter: LegacyCreditCheckGateway
Translator: LegacyCreditRatingMapper
```

## Strategic Design Checklist

- Identify core, supporting, and generic subdomains.
- Name bounded contexts using business language.
- Decide module/service boundaries before project boundaries.
- Define integration contracts and ownership.
- Add anti-corruption layers where external language leaks inward.
- Keep shared kernels small and stable.
- Prefer modular monolith boundaries before distributed boundaries unless deployment independence is required.

