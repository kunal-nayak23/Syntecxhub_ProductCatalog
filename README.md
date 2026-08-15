# Product Catalog Management

## Overview

A production-ready internship project for managing a product catalog. It has a Node.js/Express REST API, MongoDB persistence, JWT authentication, and a responsive React dashboard.

## Features

- User signup and login with bcrypt password hashing and JWT tokens.
- Public product browsing, name search, category filtering, and safe pagination.
- Authenticated product creation, editing, and deletion.
- MongoDB aggregation-powered product and category statistics.
- Mongoose validation, centralized errors, CORS, and environment-based configuration.

## Tech Stack

Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, dotenv, CORS, React, Vite, and Axios.

## Authentication

`POST /api/auth/signup` and `POST /api/auth/login` return a JWT. Send it on protected requests as `Authorization: Bearer <token>`.

## API Endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Public | Create account |
| POST | `/api/auth/login` | Public | Log in |
| GET | `/api/products` | Public | List/search products |
| GET | `/api/products/stats` | Public | Aggregated statistics |
| GET | `/api/products/:id` | Public | Get one product |
| POST | `/api/products` | JWT | Create product |
| PUT | `/api/products/:id` | JWT | Update product |
| DELETE | `/api/products/:id` | JWT | Delete product |

## Search, Pagination, and Aggregation

Use `GET /api/products?search=phone&category=electronics&page=1&limit=10`. Search is case-insensitive; limits are safely constrained to 1–100. `GET /api/products/stats` uses aggregation pipelines with `$match`, `$group`, `$sort`, and `$project` for totals and category insights.

## Validation and Security

Product name, description, category, and brand are required strings. Price and quantity cannot be negative; quantity must be an integer. Email format and a 6-character minimum password are enforced. Passwords never appear in responses.

## Project Structure

```
backend/     Express API, models, controllers, routes, middleware
frontend/    React/Vite client
```

## Installation

1. Create `backend/.env` from `backend/.env.example` and provide a MongoDB connection string and a long JWT secret.
2. Create `frontend/.env` from `frontend/.env.example` if the default API address needs changing.

```powershell
cd backend
npm install
npm run dev
```

In a second terminal:

```powershell
cd frontend
npm install
npm start
```

Open `http://localhost:5173`. The backend runs at `http://localhost:8000` by default.

## Example API Requests

```bash
curl http://localhost:8000/api/products?search=phone\&page=1\&limit=10
curl http://localhost:8000/api/products/stats
curl -X POST http://localhost:8000/api/auth/signup -H "Content-Type: application/json" -d '{"name":"Ava","email":"ava@example.com","password":"secret12"}'
```

## Future Improvements

Role-based authorization, product images, automated integration tests, API rate limiting, and deployment configuration.
