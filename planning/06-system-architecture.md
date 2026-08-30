# System Architecture

## Architecture Pattern

**Modular Monolith** — A single deployable application with clear internal module boundaries.

This is the right choice for the MVP because:
- Simpler to develop, deploy, and debug
- No inter-service communication overhead
- Clear module boundaries allow future extraction to microservices if needed

## High-Level Architecture

```
┌─────────────────────────────────────┐
│           React Frontend            │
│  (TypeScript, Tailwind, Leaflet)    │
└──────────────┬──────────────────────┘
               │ HTTPS REST + WebSocket
┌──────────────▼──────────────────────┐
│         Express API Gateway         │
│    (TypeScript, middleware chain)   │
├─────────────────────────────────────┤
│           Auth Layer                │
│    (JWT, session management)        │
├─────────────────────────────────────┤
│         Route Handlers              │
│  ┌─────┬──────┬─────┬──────┐       │
│  │Auth │Feed  │Rent │Buddy │       │
│  │Users│Forum │Msgs │Admin │       │
│  └─────┴──────┴─────┴──────┘       │
├─────────────────────────────────────┤
│          Service Layer              │
│  (Business logic, validation)       │
├─────────────────────────────────────┤
│        Repository Layer             │
│  (Database queries, transactions)   │
├─────────────────────────────────────┤
│           PostgreSQL                │
│    (Primary data store)             │
├─────────────────────────────────────┤
│          Socket.IO                  │
│    (Real-time messaging)            │
├─────────────────────────────────────┤
│       Local File Storage            │
│    (Image uploads)                  │
└─────────────────────────────────────┘
```

## Module Boundaries

Each domain is organized as a self-contained module:

```
src/
├── modules/
│   ├── auth/          # Authentication, authorization
│   ├── users/         # User accounts, profiles
│   ├── feed/          # Social feed, posts, comments
│   ├── rentals/       # Rental listings, requests
│   ├── buddy/         # Buddy profiles, requests
│   ├── forums/        # College forums, posts, comments
│   ├── messaging/     # Conversations, messages
│   ├── notifications/ # Notification system
│   ├── reviews/       # Reviews and ratings
│   ├── reports/       # Content/user reporting
│   ├── transactions/  # Transaction and commission tracking
│   └── admin/         # Admin dashboard operations
├── middleware/         # Auth, validation, error handling
├── lib/               # Database, utilities, config
└── index.ts           # Entry point
```

Each module contains:
- `routes.ts` — Express route definitions
- `controller.ts` — Request handling
- `service.ts` — Business logic
- `repository.ts` — Database queries
- `validators.ts` — Input validation schemas
- `types.ts` — TypeScript types

## Request Lifecycle

```
HTTP Request
  → CORS middleware
  → Rate limiter
  → Body parser
  → Auth middleware (JWT verification)
  → Route handler
  → Validation (Zod schemas)
  → Controller
  → Service (business logic)
  → Repository (database)
  → Response
```

## Key Design Decisions

1. **No ORM** — Use raw SQL with `pg` (node-postgres) for full control and performance. A query builder (Knex) may be added later if beneficial.
2. **JWT Authentication** — Stateless auth with refresh tokens. No paid auth provider dependency.
3. **File uploads** — Local disk storage initially. Abstracted behind a service interface for future S3 migration.
4. **Real-time** — Socket.IO for messaging. HTTP polling for notifications initially, upgradeable to WebSocket.
5. **Geolocation** — PostGIS extension for PostgreSQL. Latitude/longitude stored with ST_DWithin queries for radius search.

## Technology Justification

| Choice | Reason |
|--------|--------|
| PostgreSQL + PostGIS | Free, battle-tested, geospatial queries |
| Express | Mature, well-understood, fast for monolith |
| Socket.IO | Free, reliable real-time with fallback |
| JWT | Stateless, no provider dependency |
| Zod | TypeScript-first validation, excellent DX |
| Leaflet + OSM | Free maps, no API key required |
