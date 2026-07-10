<p align="center">
  <img src="frontend/public/favicon.ico" width="20" alt="App icon" />
  <br/>
  <strong>La comanda</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</p>Backend API for small food businesses to manage stock, orders, customers and restocking. Built for the typical Argentine take-out workflow where orders come in via WhatsApp and the cook tracks everything manually.

## Demo

[**Live demo**](https://la-comanda-manager.vercel.app/)

![demo_ui](frontend/src/assets/demo_ui.png)

## Stack
FastAPI · SQLAlchemy (async) · PostgreSQL on Supabase · Alembic · Pydantic · React · Tailwind CSS · Typescript

## Roadmap
- [x] Business, Product, Item, Customer, Restock, Recipe endpoints
- [x] Stock logic on restock and order creation
- [x] Order endpoints 
- [ ] React + TypeScript frontend
  + [x] Login Screen
  + [x] Orders Screen
  + [x] Stock Screen
  + [x] Dashboard Screen
  + [ ] Home Screen
  + [x] Products Screen
  + [ ] Dark theme
  + [x] Error handling
+ [ ] Modify endpoint:
  + [x] Allow pagination and more queries on each orders and restock endpoints
  + [x] Add product endpoint with full details using join (PriceHistory and RecipeItems)
+ [ ] Playwright testing E2E each page
- [x] Deploy to Railway + Vercel

## Testing
96% code coverage across 8 test files. Each test runs against an in-memory SQLite database with automatic rollback — no real database needed. Auth is mocked via FastAPI dependency overrides. CI runs on every push via GitHub Actions.

Exploratory and manual testing done via Postman.

Run tests:
\```bash
cd backend
pytest tests/ -v --cov
\```
