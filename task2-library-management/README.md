# Task 2: Library Management System

A full-stack library application to manage books, members and book transactions,
built during the Auspify Technologies Software Development Internship.

## Features

- Cover page, dashboard and separate record and add pages
- Add, edit, delete and search books (card view)
- Register and list members
- Issue and return books, with automatic copy count updates
- Due dates, overdue detection and status filters (All, Issued, Overdue, Returned)
- Reports: summary stats, utilisation bar, copies by category, overdue list
- Light and dark mode, animated background, responsive layout (sidebar on desktop, tab bar on phones)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Front end | React (Vite), React Router, Axios, CSS |
| Back end | Node.js, Express |
| Database | PostgreSQL (pg) |

## Database Design

- books: id, title, author, isbn, category, total_copies, available_copies
- members: id, name, email, phone
- transactions: id, book_id, member_id, issue_date, due_date, return_date

Issue and return use SQL transactions (BEGIN / COMMIT / ROLLBACK) so copy counts stay correct.
The schema is in server/schema.sql.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/books | List or search books |
| POST | /api/books | Add a book |
| PUT | /api/books/:id | Update a book |
| DELETE | /api/books/:id | Delete a book |
| GET | /api/members | List members |
| POST | /api/members | Add a member |
| POST | /api/issue | Issue a book |
| POST | /api/return/:id | Return a book |
| GET | /api/transactions | All transactions |
| GET | /api/reports/summary | Summary counts |
| GET | /api/reports/issued | Currently issued |
| GET | /api/reports/overdue | Overdue books |

## How to Run

1. Create a database named librarydb in PostgreSQL and run the schema:

       psql -U postgres -d librarydb -f server/schema.sql

2. Server

       cd server
       npm install
       npm run dev

   Create server/.env:

       DB_USER=postgres
       DB_PASSWORD=your_password
       DB_HOST=localhost
       DB_PORT=5432
       DB_NAME=librarydb
       PORT=5001

3. Client (second terminal)

       cd client
       npm install
       npm run dev

4. Open http://localhost:5173

## Screenshots

![Cover](screenshots/Screenshot%202026-11-12%20102337.png)

![Dashboard](screenshots/Screenshot%202026-11-12%20102352.png)

![Add book](screenshots/Screenshot%202026-11-12%20102408.png)

![Add member](screenshots/Screenshot%202026-11-12%20102421.png)

![Transactions](screenshots/Screenshot%202026-11-12%20102430.png)

![Reports](screenshots/Screenshot%202026-11-12%20102439.png)

## Author

Darshan Vasoya, Auspify Software Development Internship

**Hashtags:** #Auspify #AuspifyTechnologies #AuspifyInternship #AuspifyProjects
