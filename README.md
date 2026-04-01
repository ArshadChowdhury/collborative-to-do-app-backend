# Multi-Tenant Collaborative Todo App — Backend

A NestJS + PostgreSQL backend for a Trello-inspired multi-tenant todo application with real-time collaboration via Socket.io.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | NestJS (TypeScript) |
| Database | PostgreSQL 16 |
| Auth | JWT (Bearer) via Passport |
| Real-time | Socket.io (namespace `/boards`) |
| Container | Docker + docker-compose |

---

## Quick Start

### Option A — Docker (recommended)

```bash
cp .env.example .env          # adjust JWT_SECRET at minimum
docker-compose up --build
```

The API is available at `http://localhost:3000/api/v1`.
Migrations run automatically on container start.

### Option B — Local

**Prerequisites:** Node 20+, PostgreSQL 16 running locally.

```bash
cp .env.example .env          # fill in your DB credentials
pnpm install
pnpm run migrate               # runs SQL migrations
pnpm run start:dev             # hot-reload dev server
```

---

## Running Tests

```bash
pnpm run test              # unit tests (no DB required)
pnpm run test:coverage     # with coverage report
```

---

## API Reference

All REST routes are prefixed with `/api/v1`.
Every protected route requires:
```
Authorization: Bearer <token>
```
Tenant-scoped routes also require:
```
X-Tenant-Slug: <tenant_slug>
```

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | No | Register a new user |
| POST | `/auth/login` | No | Login, receive JWT |
| GET | `/auth/me` | Yes | Get current user profile |

**Signup body:**
```json
{ "email": "alice@acme.com", "password": "secret1234", "displayName": "Alice" }
```

**Login / Response:**
```json
{ "accessToken": "eyJ..." }
```

---

### Tenants

| Method | Path | Header | Description |
|---|---|---|---|
| POST | `/tenants` | — | Create tenant (caller becomes owner) |
| GET | `/tenants/current` | X-Tenant-Slug | Get tenant info |
| GET | `/tenants/current/members` | X-Tenant-Slug | List members |
| POST | `/tenants/current/members` | X-Tenant-Slug | Add a member |
| DELETE | `/tenants/current/members/:userId` | X-Tenant-Slug | Remove a member |

**Create tenant body:**
```json
{ "name": "Acme Corp", "slug": "acme" }
```
> Slug must match `^[a-z0-9_]+$`. A dedicated PostgreSQL schema (`tenant_acme`) is provisioned automatically.

---

### Boards

All routes require `Authorization` + `X-Tenant-Slug`.

| Method | Path | Description |
|---|---|---|
| GET | `/boards` | List all boards |
| GET | `/boards/:id` | Get single board |
| POST | `/boards` | Create board |
| PATCH | `/boards/:id` | Update board |
| DELETE | `/boards/:id` | Delete board |

---

### Todos

All routes require `Authorization` + `X-Tenant-Slug`.

| Method | Path | Description |
|---|---|---|
| GET | `/boards/:boardId/todos` | List todos on a board |
| GET | `/boards/:boardId/todos/:id` | Get single todo |
| POST | `/boards/:boardId/todos` | Create todo |
| PATCH | `/boards/:boardId/todos/:id` | Update todo |
| DELETE | `/boards/:boardId/todos/:id` | Delete todo |

**Todo body:**
```json
{
  "title": "Deploy to production",
  "description": "Run migrations first",
  "status": "todo",
  "assigneeId": "<user-uuid>"
}
```
`status` values: `todo` | `in-progress` | `done`

---

## Real-Time Collaboration

### Connection

```js
const socket = io('http://localhost:3000/boards', {
  auth: { token: '<jwt>' }
});
```

### Client → Server events

| Event | Payload | Description |
|---|---|---|
| `board:join` | `{ boardId, tenantSlug }` | Subscribe to board updates |
| `board:leave` | `{ boardId, tenantSlug }` | Unsubscribe |

### Server → Client events

| Event | Payload | Description |
|---|---|---|
| `todo:created` | `Todo` | A todo was added |
| `todo:updated` | `Todo` | A todo was changed |
| `todo:deleted` | `{ id, boardId }` | A todo was removed |

**Room isolation:** rooms are named `{tenantSlug}:{boardId}`, so two tenants sharing a board UUID never receive each other's events.

---

## Architecture & Design Decisions

### Multi-Tenancy — Schema-based + RLS

Each tenant gets a dedicated PostgreSQL schema (`tenant_{slug}`) with its own `boards` and `todos` tables. RLS is enabled as a second defense layer — each table has a policy checking `current_setting('app.current_tenant')`, so even a misconfigured `search_path` cannot leak data across tenants.

`DatabaseService.withTenantClient()` sets both `search_path` and `app.current_tenant` before every query and releases the client in a `finally` block.

### Repository Pattern

Each module has a `*.repository.ts` owning all SQL for that domain. Services call only repositories; controllers call only services. Each layer is independently testable with mocks.

### Real-Time

`TodosService` calls `TodosGateway.broadcastToBoard()` synchronously after every write. For multi-instance deployments, replace this with Redis pub/sub so all API nodes can fan out.

### JWT on WebSockets

`TodosGateway.handleConnection()` verifies the Bearer token before any room join is permitted. Invalid tokens cause an immediate disconnect.

---

## Security

- bcrypt password hashing (cost 12)
- Tenant slug allowlist regex (`^[a-z0-9_]+$`) prevents SQL injection via schema names
- `ValidationPipe(whitelist: true)` strips undeclared request properties
- RLS as defense-in-depth
- WebSocket auth before any room operation

---

## Trade-offs & Future Improvements

| Area | Current | Improvement |
|---|---|---|
| Real-time fan-out | In-process broadcast | Redis pub/sub for multi-instance |
| Migrations | Plain SQL ordered files | Flyway / proper migration tool with checksums |
| Authorization | Membership check | Role-based permissions per board |
| Rate limiting | None | `@nestjs/throttler` per user/tenant |
| Pagination | None | Cursor-based for large boards |

---

## Project Structure

```
src/
├── database/
│   ├── database.service.ts       # Pool, withTenantClient(), schema provisioning
│   ├── migrate.ts                # Migration runner
│   └── migrations/001_public_schema.sql
├── common/
│   ├── decorators/               # @CurrentUser, @CurrentTenant, @Public
│   ├── guards/                   # JwtAuthGuard (global), TenantGuard
│   ├── middleware/               # TenantMiddleware (X-Tenant-Slug → req.tenant)
│   └── filters/                  # AllExceptionsFilter
└── modules/
    ├── auth/                     # Signup/login, JwtStrategy
    ├── users/                    # UsersRepository
    ├── tenants/                  # Tenant CRUD, member management
    ├── boards/                   # Board CRUD (tenant-scoped)
    └── todos/                    # Todo CRUD + Socket.io gateway (TodosGateway)
```