# Clean Architecture Overview

## Core Principle
Separate concerns into layers with dependencies pointing inward.

## Layers (from inner to outer)
1. **Entities** - Enterprise-wide business rules
2. **Use Cases** - Application-specific business rules
3. **Interface Adapters** - Controllers, presenters, gateways
4. **Frameworks & Drivers** - Tools like DB, web frameworks, external APIs

## Dependency Rule
Source code dependencies must point only inward, toward higher-level policies.

## Benefits
- Independence of frameworks
- Testability (business rules can be tested without UI, DB, etc.)
- Independence of UI (can change web->console without changing business rules)
- Independence of databases