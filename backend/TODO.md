## Future endpoints

- `GET /restocks?from_date=&to_date=` — filter restocks by date range
- `GET /orders?from_date=&to_date=` — filter orders by date range  
- `GET /items/low-stock/summary` — count of low stock items for dashboard
- `GET /reports/daily` — daily sales summary (orders, revenue, top products)
- `PATCH /products/{id}/prices/bulk` — update multiple prices at once
