# YELO — What's Around You

A hyper-local social marketplace and community platform for **Dehradun, Uttarakhand, India**.

> Find things nearby. Find people nearby. See what's happening.

## Features

- **🏠 Home Feed** — Social media-style feed with community posts
- **📦 Rent** — Peer-to-peer rental marketplace for physical items
- **👥 Buddy** — Social companionship marketplace
- **🎓 Forums** — College and community discussion boards
- **💬 Messages** — Real-time messaging via WebSocket
- **⭐ Reviews** — Trust & reputation system
- **🛡️ Admin** — Full admin dashboard for moderation
- **🔒 Privacy** — Location privacy, anonymous posting, safety features

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Tailwind CSS, Leaflet |
| Backend | Node.js, Express, TypeScript, Socket.IO |
| Database | PostgreSQL with PostGIS |
| Auth | JWT (access + refresh tokens) |
| Real-time | Socket.IO |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ with PostGIS extension

### 1. Setup Database

```bash
# Create the database
createdb yelo

# Enable PostGIS
psql yelo -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### 2. Setup Backend

```bash
cd backend
cp .env.example .env  # Edit with your DB credentials
npm install
npm run migrate
npm run seed
npm run dev
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Access the App

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@freebuff.com | Admin@123 |
| User | rahul@demo.com | Demo@1234 |
| User | priya@demo.com | Demo@1234 |
| User | amit@demo.com | Demo@1234 |

## API Documentation

### Authentication
- `POST /api/auth/register` — Register new account
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Refresh tokens
- `GET /api/auth/me` — Get current user

### Feed
- `GET /api/feed` — Get feed posts (with pagination, filtering)
- `POST /api/feed` — Create post
- `POST /api/feed/:id/like` — Toggle like
- `POST /api/feed/:id/save` — Toggle save
- `POST /api/feed/:id/comments` — Add comment

### Rentals
- `GET /api/rentals/categories` — Get categories
- `POST /api/rentals` — Create listing
- `GET /api/rentals/search` — Search listings (radius, price, category)
- `POST /api/rentals/:id/requests` — Request to rent
- `PUT /api/rentals/requests/:id/respond` — Accept/reject request

### Buddy
- `POST /api/buddy/profile` — Create/update buddy profile
- `GET /api/buddy/search` — Search buddies
- `POST /api/buddy/:id/requests` — Send buddy request
- `PUT /api/buddy/requests/:id/respond` — Accept/reject

### Forums
- `GET /api/forums/colleges` — List colleges
- `GET /api/forums/colleges/:slug` — Get college with categories
- `GET /api/forums/categories/:id/posts` — Get posts
- `POST /api/forums/categories/:id/posts` — Create post (supports anonymous)

### Messages
- `GET /api/messages` — Get conversations
- `POST /api/messages` — Create conversation
- `GET /api/messages/:id/messages` — Get messages
- `POST /api/messages/:id/messages` — Send message

### Admin
- `GET /api/admin/stats` — Dashboard stats
- `GET /api/admin/users` — List users
- `PUT /api/admin/users/:id/status` — Suspend/ban/restore
- `GET /api/admin/listings` — List all listings
- `GET /reports` — View reports

## Architecture

```
yelo/
├── backend/                 # Express API server
│   └── src/
│       ├── lib/             # Config, DB, utilities
│       ├── middleware/       # Auth, error handling
│       ├── modules/         # Feature modules (auth, feed, rentals, buddy, forums, messaging, etc.)
│       ├── migrations/      # Database migrations
│       └── seeds/           # Seed data
├── frontend/                # React SPA
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Page components
│       ├── context/         # React context (auth)
│       ├── lib/             # API client
│       └── types/           # TypeScript types
└── planning/                # Architecture documentation
```

## Key Design Decisions

1. **Modular Monolith** — Clean module boundaries without microservice overhead
2. **Location Privacy** — GPS coordinates stored but only approximate location shown publicly
3. **Anonymous Posting** — Backend retains user identity for moderation, frontend hides it
4. **Transaction-tied Reviews** — Reviews only from completed rentals/buddy sessions
5. **Commission Tracking** — Configurable percentage/fixed commission architecture
6. **PostGIS** — Native geospatial queries for radius-based discovery

## Environment Variables

See `backend/.env.example` and `frontend/.env.example` for all configuration options.

## License

Private — All rights reserved.
