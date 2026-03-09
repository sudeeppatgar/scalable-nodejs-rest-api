# Scalable Node.js REST API (Learning Project)

This repository is a learning-focused backend project to practice how a scalable Node.js REST API is structured with Express, MongoDB, Redis, JWT auth, RBAC, and clean layering.

## What This Project Teaches

- How to separate API code into route -> controller -> service -> model layers.
- How to centralize concerns like auth, validation, error handling, and rate limiting in middleware.
- How to run app lifecycle cleanly (startup + graceful shutdown) with dependency connections.
- How to keep response/error formats consistent across all endpoints.

## Tech Stack

- Node.js 18+
- Express
- MongoDB + Mongoose
- Redis
- JWT (`jsonwebtoken`)
- Validation (`express-validator`)
- Security middleware (`helmet`, `cors`, `express-rate-limit`)

## End-to-End Flow

1. `src/index.js` boots the app:
   - Creates Express app (`createApp`).
   - Creates DB adapter (`createMongoDatabase`).
   - Creates server lifecycle object (`createServer`).
   - Registers shutdown handlers (`SIGINT`, `SIGTERM`, etc).
2. `src/app/app.js` creates an Express instance and calls `src/loaders/express.loader.js`.
3. Express loader wires global middleware, then mounts routes:
   - `GET /health`
   - `/api/auth`, `/api/users`, `/api/admin`
4. For API requests, flow is:
   - Route validation/rate-limit/auth middleware runs first.
   - Controller receives request, extracts input/metadata.
   - Service executes business logic.
   - Model performs MongoDB operations.
   - Controller returns standardized `ApiResponse`.
5. If anything fails, `errorHandler` converts errors to consistent JSON responses.
6. On shutdown, `src/app/server.js` closes HTTP server, MongoDB, and Redis connections.

## Project Design (File-by-File)

### Entry and lifecycle

- `src/index.js`: main bootstrap and graceful shutdown orchestration.
- `src/app/app.js`: builds the Express app (without starting server) for testability.
- `src/app/server.js`: owns start/stop lifecycle; connects dependencies and listens on port.

### Configuration

- `src/config/env.js`: loads and validates environment variables.
- `src/config/redis.js`: Redis client wrapper (`connect`, `disconnect`, `isConnected`).
- `src/config/database/mongo.database.js`: MongoDB adapter used by server lifecycle.
- `src/config/database/index.js`: exports database adapter factory.

### Loaders

- `src/loaders/express.loader.js`: installs security, parsers, logging, routes, 404, error middleware.

### Routes

- `src/routes/index.js`: mounts all `/api` modules.
- `src/routes/health.routes.js`: health endpoint.
- `src/routes/auth.routes.js`: register/login/refresh/logout routes + validation + auth-specific limits.
- `src/routes/user.routes.js`: authenticated user profile/password routes.
- `src/routes/admin.routes.js`: admin-only user management + activity routes.

### Controllers

- `src/controllers/health.controller.js`: returns app/db/redis health data.
- `src/controllers/auth.controller.js`: HTTP layer for auth flows.
- `src/controllers/user.controller.js`: HTTP layer for user self-service flows.
- `src/controllers/admin.controller.js`: HTTP layer for admin flows.

### Services (business logic)

- `src/services/auth.service.js`: register/login/refresh/logout logic, token storage in Redis, activity logs.
- `src/services/user.service.js`: profile update and password change logic.
- `src/services/admin.service.js`: user listing/filtering/pagination and admin actions.

### Models

- `src/models/user.model.js`: user schema, validation, password hash hook, helper methods.
- `src/models/activity.model.js`: audit activity schema and query helpers.

### Middlewares

- `src/middlewares/auth.middleware.js`: JWT verification and user attachment.
- `src/middlewares/role.middleware.js`: role-based authorization (`adminOnly`, `authorize`).
- `src/middlewares/validate.middleware.js`: `express-validator` result handler.
- `src/middlewares/rateLimit.middleware.js`: global/auth/register rate limiting.
- `src/middlewares/error.middleware.js`: centralized error + 404 handling.

### Utilities

- `src/utils/ApiResponse.js`: consistent success response shape.
- `src/utils/ApiError.js`: app-specific error class + helpers.
- `src/utils/asyncHandler.js`: async controller wrapper.
- `src/utils/token.js`: JWT access/refresh token generation and verification.
- `src/utils/constants.js`: enums and shared constants.

## API Endpoints

### Health

- `GET /health`

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Users

- `GET /api/users/me`
- `PATCH /api/users/me`
- `POST /api/users/me/change-password`

### Admin

- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/users/:id/activities`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env`:

```env
NODE_ENV=development
PORT=3000

MONGODB_URI=mongodb://localhost:27017/scalable-api
MONGODB_OPTIONS={}

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRE=30d

BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:3000
```

3. Start MongoDB + Redis:

```bash
docker-compose up -d
```

4. Run app:

```bash
node src/index.js
```

## Useful Scripts

- `npm test` - run Jest tests
- `npm run lint` - run ESLint
- `npm run lint:fix` - auto-fix ESLint issues

## Note for Learners

This codebase is learning-focused and still a good place to practice refactoring and adding tests as you evolve the architecture.

## License

ISC
