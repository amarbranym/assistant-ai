# API endpoints

This document describes HTTP APIs for the **assistant-ai** monorepo. Unless noted, the backend serves JSON under a versioned prefix.

## Conventions

- **Backend base URL (local default):** `http://localhost:4000`
- **API prefix:** `/api/v1`
- **Response envelope (most routes):**

```json
{
  "success": true,
  "data": {}
}
```

Error shape:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable message",
    "code": "OPTIONAL_CODE"
  }
}
```

Validation errors (Zod) return `400` with `error.code` `VALIDATION_ERROR` and `error.details` (issue list) when the validation middleware is used.

- **Authentication:** Protected routes expect:

  `Authorization: Bearer <access_token>`

  The access token is returned by **register**, **login**, and **OAuth success** (fragment redirect; see OAuth section).

---

## Health (no prefix)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness; returns `{ status, env }` (not the standard envelope). |
| `GET` | `/api/v1/health` | Same idea under the versioned API. |

---

## Auth (`/api/v1/auth`)

### Register

| | |
|---|---|
| **Method / path** | `POST /api/v1/auth/register` |
| **Auth** | None |
| **Rate limit** | Yes (`auth` bucket) |

**Request body**

```json
{
  "email": "user@example.com",
  "password": "minimum-8-chars",
  "name": "Full name"
}
```

| Field | Rules |
|-------|--------|
| `email` | Valid email, max 255 |
| `password` | 8–128 characters |
| `name` | 1–120 characters |

**Success `201` — `data`**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Full name",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "accessToken": "<jwt>"
}
```

**Errors**

| Status | When |
|--------|------|
| `400` | Validation failed |
| `409` | Email already registered (`EMAIL_IN_USE`) |

**Usage:** Call from the sign-up flow; store `accessToken` for subsequent requests. The Next.js app also calls `POST /api/auth/session` (frontend route) to mirror the JWT in an httpOnly cookie for middleware.

---

### Login

| | |
|---|---|
| **Method / path** | `POST /api/v1/auth/login` |
| **Auth** | None |
| **Rate limit** | Yes |

**Request body**

```json
{
  "email": "user@example.com",
  "password": "string"
}
```

**Success `200` — `data`**

Same shape as register: `{ user, accessToken }`.

**Errors**

| Status | When |
|--------|------|
| `400` | Validation failed |
| `401` | Invalid email or password (`INVALID_CREDENTIALS`) |
| `401` | OAuth-only account (`USE_OAUTH`) — use Google, GitHub, or Apple |

---

### Logout

| | |
|---|---|
| **Method / path** | `POST /api/v1/auth/logout` |
| **Auth** | None (JWT is optional) |
| **Rate limit** | Yes |

**Request body**

```json
{}
```

**Success `200` — `data`**

```json
{ "ok": true }
```

JWTs are stateless; the client must discard the token (and clear the session cookie if used).

---

### Current user (profile)

| | |
|---|---|
| **Method / path** | `GET /api/v1/auth/me` |
| **Auth** | Required — `Authorization: Bearer <access_token>` |
| **Rate limit** | Yes |

**Success `200` — `data`**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Full name",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Errors**

| Status | When |
|--------|------|
| `401` | Missing or invalid token (`UNAUTHORIZED`) |
| `404` | User id in token no longer exists (`USER_NOT_FOUND`) |

---

## Social OAuth (`/api/v1/auth/oauth/...`)

State is stored in **Redis** (Upstash) for 10 minutes to mitigate CSRF. Each **start** endpoint issues a redirect to the provider; **callback** exchanges the code and then **redirects the browser** to `FRONTEND_OAUTH_SUCCESS_URL` with a **URL fragment** (hash):

- Success: `#access_token=<jwt>&token_type=Bearer`
- Failure: `#error=oauth_failed&error_code=<CODE>&message=<encoded>`

The fragment is not sent to your frontend server over HTTP; read it in client-side JavaScript when you wire the frontend.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/auth/oauth/google` | Redirect to Google consent (requires `GOOGLE_OAUTH_*` env). |
| `GET` | `/api/v1/auth/oauth/google/callback` | OAuth redirect target; processes `code` + `state`. |
| `GET` | `/api/v1/auth/oauth/github` | Redirect to GitHub (requires `GITHUB_OAUTH_*`). |
| `GET` | `/api/v1/auth/oauth/github/callback` | OAuth redirect target. |
| `GET` | `/api/v1/auth/oauth/apple` | Redirect to Apple (requires `APPLE_OAUTH_*`). |
| `POST` | `/api/v1/auth/oauth/apple/callback` | Apple **form_post** callback (`application/x-www-form-urlencoded`). |

**Redirect URI registration** (must match `API_PUBLIC_URL`):

- Google / GitHub: `{API_PUBLIC_URL}/api/v1/auth/oauth/{provider}/callback`
- Apple: same URL with **POST** (Sign in with Apple “Return URL”).

**Behaviour**

1. If `(provider, providerAccountId)` already exists → same JWT session as email login.
2. Else if a **user with the same email** exists → links a new `OAuthAccount` to that user (merge).
3. Else → creates `User` (no password) + `OAuthAccount`.

**Typical errors** (`error_code` in fragment): `OAUTH_NOT_CONFIGURED`, `OAUTH_INVALID_STATE`, `OAUTH_DENIED`, `OAUTH_UPSTREAM`, `OAUTH_EMAIL_REQUIRED`, `OAUTH_ACCOUNT_TAKEN`, `OAUTH_STATE_MISMATCH`.

---

## Assistants (`/api/v1/assistants`)

All routes in this group use **JWT auth** (`authMiddleware` + `requireAuth`). A valid Bearer token is required.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/assistants` | List assistants (query: `projectId`, `activeOnly`). |
| `POST` | `/api/v1/assistants` | Create assistant (validated body). |
| `GET` | `/api/v1/assistants/:id` | Get one assistant. |
| `PUT` | `/api/v1/assistants/:id` | Update assistant. |
| `DELETE` | `/api/v1/assistants/:id` | Delete assistant. |

Implementation: `backend/src/modules/assistant/`.

---

## Assistant test chat (streaming)

| | |
|---|---|
| **Method / path** | `POST /api/v1/assistants/test/chat` |
| **Auth** | None (same as previous file-based route; lock down before production). |
| **Response** | Streams text to the response (non-envelope); errors may be raw JSON. |

**Request body (expected)**

```json
{
  "assistantId": "uuid",
  "conversationId": "uuid",
  "input": "User message"
}
```

---

## Frontend-only routes (Next.js)

These are served by the **frontend** app, not the Express API.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/session` | Body: `{ "accessToken": "<jwt>" }` — sets httpOnly `access_token` cookie. |
| `DELETE` | `/api/auth/session` | Clears the session cookie. |

---

## Backend source layout (`backend/src`)

| Path | Role |
|------|------|
| `app.ts` | Express app factory, global middleware, health checks. |
| `server.ts` | HTTP server bootstrap. |
| `routes.ts` | Registers `/api/v1` routers. |
| `config/` | `env.ts`, `logger.ts`, `prisma.ts`, `redis.ts`, `supabase.ts` (stub). |
| `lib/prismaClient.ts` | Re-exports Prisma client factory. |
| `modules/auth/` | Register, login, logout, OAuth (Google/GitHub/Apple) — controller(s), service, repository, validation, routes, types, `oauth.service`, `oauth-state.service`. |
| `modules/user/` | Profile — `GET /auth/me` (mounted under `/auth`). |
| `modules/assistant/` | Assistants CRUD, test chat stream, Zod validation, tools registry, repository (incl. messages). |
| `middlewares/` | Auth JWT, require-auth re-export, validation, rate limit, error re-export. |
| `common/` | `AppError`, `errorHandler`, `apiResponse`, `auth.guard`, request typings. |
| `utils/` | `asyncHandler`, `jwt`, `password`, `helpers`. |
| `constants/` | `roles`, `messages`, `statusCodes`. |
| `realtime/` | WebSocket / voice hooks (stub). |

---

## Environment variables (quick reference)

| Variable | Where | Purpose |
|----------|--------|---------|
| `JWT_SECRET` | Backend (required) | Sign and verify access tokens |
| `JWT_SECRET` | Frontend (server, recommended) | Verify cookie in `middleware.ts` |
| `JWT_EXPIRES_IN` | Backend (optional) | Token lifetime (default `7d`) |
| `BCRYPT_COST` | Backend (optional) | bcrypt rounds (clamped 10–14, default 12) |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend origin for `fetch` |
| `NEXT_PUBLIC_API_KEY` | Frontend | Optional `x-api-key` header |

See `backend/.env.example` and `frontend/.env.example` for full lists.
