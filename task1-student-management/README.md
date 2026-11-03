# Task 1: Student Management System

A full-stack CRUD application to manage student records, built during the
Auspify Technologies Software Development Internship.

## Features

- Add, update, delete and view students
- Live search by name, email or course
- Form validation (required fields, email format, duplicate email)
- Delete confirmation popup and toast notifications
- Light and dark mode
- Animated background and responsive layout

## Tech Stack

| Layer | Technology |
|-------|------------|
| Front end | React (Vite), Axios, CSS |
| Back end | Node.js, Express |
| Database | MongoDB Atlas (Mongoose) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/students | List all students |
| POST | /api/students | Add a student |
| PUT | /api/students/:id | Update a student |
| DELETE | /api/students/:id | Delete a student |

## How to Run

1. Server

       cd server
       npm install
       npm run dev

   Create `server/.env`:

       MONGO_URI=your_mongodb_connection_string
       PORT=5000

2. Client (in a second terminal)

       cd client
       npm install
       npm run dev

3. Open http://localhost:5173

## Screenshots

![Screenshot 1](screenshots/Screenshot%202026-11-03%20105511.png)

![Screenshot 2](screenshots/Screenshot%202026-11-03%20105526.png)

![Screenshot 3](screenshots/Screenshot%202026-11-03%20105541.png)

## Author

Darshan Vasoya, Auspify Software Development Internship

**Hashtags:** #Auspify #AuspifyTechnologies #AuspifyInternship #AuspifyProjects
