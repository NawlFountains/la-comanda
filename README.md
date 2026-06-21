# La Comanda

Backend API for small food businesses to manage stock, orders, customers and restocking. Built for the typical Argentine take-out workflow where orders come in via WhatsApp and the cook tracks everything manually.

## Stack
FastAPI · SQLAlchemy (async) · PostgreSQL on Supabase · Alembic · Pydantic

## Roadmap
- [x] Business, Product, Item, Customer, Restock, Recipe endpoints
- [x] Stock logic on restock and order creation
- [ ] Order endpoints <- in testing 
- [ ] React + TypeScript frontend
- [ ] Deploy to Railway + Vercel

## Testing
97% code coverage across 8 test files. Each test runs against an in-memory SQLite database with automatic rollback — no real database needed. Auth is mocked via FastAPI dependency overrides. CI runs on every push via GitHub Actions.

Exploratory and manual testing done via Postman.

Run tests:
\```bash
cd backend
pytest tests/ -v --cov
\```
