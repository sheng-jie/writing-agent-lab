# Testing Patterns

Use this reference before writing unit, integration, API, architecture, or fixture tests for a .NET clean architecture codebase.

## Contents

- Testing pyramid
- Unit tests
- Domain layer tests
- Value object tests
- Application layer tests
- Integration tests
- API integration tests
- Architecture tests
- Test organization
- Test fixtures and builders
- Key testing principles

## Testing Pyramid

| Test Type | Purpose | Tools |
| --- | --- | --- |
| Domain unit | Business rules and invariants | Existing xUnit/NUnit/MSTest |
| Application unit | Use-case orchestration with mocked ports | Existing mock/assertion libraries |
| Infrastructure integration | EF Core mappings, repositories, external adapters | Real provider/Testcontainers/existing setup |
| API integration | Routing, validation, auth, problem details | `WebApplicationFactory` or existing host tests |
| Architecture | Dependency rules | NetArchTest.Rules, ArchUnitNET, or analyzers |

Use the test framework already present. Do not introduce a new framework without a clear reason.

## Unit Tests

### Domain Layer Tests

- No database, web host, DI container, or mocks.
- Test behavior, not private implementation.
- Assert state transitions and domain events.

```csharp
[Fact]
public void Confirm_WhenOrderHasNoItems_ThrowsDomainException()
{
    var order = Order.Place(new CustomerId(Guid.NewGuid()));

    var act = () => order.Confirm();

    act.Should().Throw<DomainException>();
}
```

### Value Object Tests

- Test invalid construction.
- Test normalization.
- Test value equality.

```csharp
[Fact]
public void Create_WithNegativeAmount_Throws()
{
    var act = () => Money.Create(-1, "USD");
    act.Should().Throw<DomainException>();
}
```

### Application Layer Tests

- Mock ports such as repositories, clock, current user, payment gateway, event publisher.
- Verify domain methods are reached through observable outcomes.
- Verify `CancellationToken` is forwarded where practical.
- Avoid real EF Core unless this is an integration test.

## Integration Tests

- Test EF Core configurations, conversions, owned types, concurrency, and repository behavior.
- Prefer the real database provider used in production when feasible.
- Do not use in-memory provider to validate relational behavior.
- Keep integration test setup isolated and repeatable.

## API Integration Tests

- Verify route binding, status codes, validation errors, authentication/authorization, and problem details.
- Do not duplicate all domain invariant tests at API level.
- Use `WebApplicationFactory<TEntryPoint>` when the project uses standard ASP.NET Core testing patterns.

## Architecture Tests

Verify dependency rules automatically:

```csharp
Types.InAssembly(typeof(Order).Assembly)
    .ShouldNot()
    .HaveDependencyOn("Microsoft.EntityFrameworkCore")
    .GetResult()
    .IsSuccessful;

Types.InAssembly(typeof(ConfirmOrderCommandHandler).Assembly)
    .ShouldNot()
    .HaveDependencyOn("Company.Product.Infrastructure")
    .GetResult()
    .IsSuccessful;
```

Also consider tests that:

- Domain does not depend on Application, Infrastructure, API, ASP.NET Core, or EF Core.
- Application does not depend on Infrastructure or API.
- Enforce naming conventions only when the repository has explicitly adopted them.

## Test Organization

```text
tests/
├── Company.Product.Domain.UnitTests/
│   ├── Orders/OrderTests.cs
│   └── Shared/MoneyTests.cs
├── Company.Product.Application.UnitTests/
│   └── Orders/ConfirmOrderCommandHandlerTests.cs
├── Company.Product.Infrastructure.IntegrationTests/
│   └── Persistence/EfCoreOrderRepositoryTests.cs
├── Company.Product.Api.IntegrationTests/
│   └── OrdersEndpointsTests.cs
└── Company.Product.ArchitectureTests/
    └── DependencyRulesTests.cs
```

## Test Fixtures & Builders

Use builders to create valid aggregates with meaningful defaults:

```csharp
public sealed class OrderBuilder
{
    private readonly List<OrderItem> _items = [];

    public OrderBuilder WithItem(ProductId productId, Quantity quantity, Money price)
    {
        _items.Add(OrderItem.Create(productId, quantity, price));
        return this;
    }

    public Order Build()
    {
        var order = Order.Place(new CustomerId(Guid.NewGuid()));
        foreach (var item in _items)
        {
            order.AddItem(item.ProductId, item.Quantity, item.Price);
        }
        order.ClearDomainEvents();
        return order;
    }
}
```

## Key Testing Principles

1. Test behavior, not implementation.
2. Domain tests need no mocks.
3. Mock at port boundaries in Application tests.
4. Use real infrastructure in integration tests when practical.
5. Keep business rule tests in Domain, not controllers or EF Core tests.
6. Add architecture tests when dependency rules matter over time.

