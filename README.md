# La Comanda

Full-Stack application designed to manage restaurant (or take-out only) stock, orders, clients, and operational workflows.

## Current development Roadmap
- [x] Add customer endpoint
- [ ] Add order endpoint
- [ ] Add recipe endpoint
- [ ] Add stock logic on restocking and ordering
- [ ] Create a front web application using React and Typescript
- [ ] Deploy both backend and front end

## Automated Quality Assurance & Testing Architecture

Following testing practices, enforcing strict validation across the entire application.

### Test Coverage Metrics
* **Total Backend Code Coverage:** 89% verified via `pytest-cov`
* **Core API Routers Coverage:** 100% on `Product` and `Restock` business logic.

### Testing Strategy & Isolation
* **API & Integration Layer:** Asynchronous endpoint validation implemented using `pytest` and `httpx.AsyncClient`.
* **State & Environment Isolation:** Automated database session tracking utilizing an in-memory SQLite provider (`sqlite+aiosqlite:///:memory:`). Every test executes in complete isolation with automatic transaction rollbacks via `pytest` database fixtures.
* **Authentication Mocking:** Validated authenticated user cleanly by utilizing FastAPI's `dependency_overrides`.

### CI/CD Pipeline Infrastructure
Relying on **GitHub Actions** to automate quality control gates on every `push` and `pull_request` targeting production branches:
* **Dependency Caching:** Leverages native pipeline caching strategies to minimize test setup latency.
* **Regression Protection:** Automatically runs the comprehensive regression suite, failing builds and blocking unverified code integration.
