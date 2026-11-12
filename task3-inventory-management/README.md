# Task 3: Inventory Management System

A full-stack inventory application to track products, stock levels and stock movements,
built during the Auspify Technologies Software Development Internship.

## Features

- Home page, dashboard, product cards and separate add and edit pages
- Categories, SKU, price and minimum stock alert level per product
- Stock in and stock out with a full movement history
- Negative stock is blocked (SQL transaction with row lock)
- Search by name or SKU, filter by category and stock level
- Reports: total units, stock value, value by category, stock health chart, low and out of stock list
- Responsive layout (top bar on desktop, bottom tab bar on phones)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Front end | React (Vite), React Router, Axios, CSS |
| Back end | Node.js, Express |
| Database | PostgreSQL (pg) |

## Database Design

- categories: id, name
- products: id, name, sku, category_id, price, quantity, min_stock
- stock_movements: id, product_id, type (IN or OUT), quantity, note, created_at

CHECK constraints keep price and quantity from going negative. The schema is in server/schema.sql.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET, POST | /api/categories | List or add categories |
| GET | /api/products | List, search and filter products |
| POST | /api/products | Add a product |
| PUT | /api/products/:id | Update a product |
| DELETE | /api/products/:id | Delete a product |
| POST | /api/stock | Stock in or out |
| GET | /api/movements | Movement history |
| GET | /api/reports/summary | Totals and stock value |
| GET | /api/reports/low-stock | Low and out of stock products |
| GET | /api/reports/by-category | Value by category |

## Data Accuracy Test

Opening stock 10, stock out 3, stock in 5 gives 12 units. At Rs 199.5 each the stock value is Rs 2,394.
Removing more stock than available returns an error and the quantity stays unchanged.

## How to Run

1. Create a database named inventorydb and run the schema:

       psql -U postgres -d inventorydb -f server/schema.sql

2. Server

       cd server
       npm install
       npm run dev

   Create server/.env:

       DB_USER=postgres
       DB_PASSWORD=your_password
       DB_HOST=localhost
       DB_PORT=5432
       DB_NAME=inventorydb
       PORT=5002

3. Client (second terminal)

       cd client
       npm install
       npm run dev

## Screenshots

![Screenshot](screenshots/Screenshot%202026-11-12%20173301.png)

![Screenshot](screenshots/Screenshot%202026-11-12%20173312.png)

![Screenshot](screenshots/Screenshot%202026-11-12%20173327.png)

![Screenshot](screenshots/Screenshot%202026-11-12%20173338.png)

![Screenshot](screenshots/Screenshot%202026-11-12%20173348.png)

![Screenshot](screenshots/Screenshot%202026-11-12%20173400.png)


## Author

Darshan Vasoya, Auspify Software Development Internship

**Hashtags:** #Auspify #AuspifyTechnologies #AuspifyInternship #AuspifyProjects
