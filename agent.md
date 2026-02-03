# agent.md — Codex Coding Best Practices for an Online Board Game in Production

This document defines **how the agent (Codex)** should work and **which standards** to follow when implementing, refactoring, and reviewing code for an **online multiplayer board game** ready for production.

> Principles: **TDD-first**, **security-first**, **configuration via `.env`/secrets**, **no hardcoding**, **observability**, **resilience**, **privacy**, **maintainability**.

---

## 1) Golden rules (always)

1. **TDD first**
   - Write the test **before** the implementation (Red → Green → Refactor).
   - Tests must be deterministic, fast, and isolated.
2. **Security first**
   - Think about threats and abuse from the start (cheat, spam, injection, replay).
   - Validate/normalize everything on the server (never trust the client).
3. **No hardcoding**
   - No URLs, keys, IDs, business rules, timeouts, or “magic” limits in code.
   - Use versioned **config** + **`.env`** (or secret manager) for secrets.
4. **Config and secrets**
   - Credentials **only** via environment variables (e.g., `.env` locally, Secret Manager in deploy).
   - Never log tokens, passwords, cookies, or secrets.
5. **Small changes, small PRs**
   - Incremental, focused deliveries that are easy to review.
6. **Production readiness**
   - Observability, migrations, rollback, API versioning, rate limits, and resilience are part of “done”.

---

## 2) How Codex should execute tasks (workflow)

### 2.1 Before coding
- Understand the ticket/issue goal and acceptance criteria.
- Identify:
  - Relevant **game flows** (room creation, join, turns, reconnection).
  - **Sensitive data** (IDs, tokens, PII).
  - Performance impacts (broadcast, matchmaking, storage).
  - Abuse points (request spam, state tampering, race conditions).
- Propose the minimum necessary changes.
- If anything important is ambiguous, **ask** before implementing.

### 2.2 TDD (Red → Green → Refactor)
1. Write tests covering:
   - Happy path
   - Game rules (edge cases)
   - Expected failures (invalid inputs, permissions, concurrency)
2. Run tests: they should **fail** (Red)
3. Implement the minimum to pass (Green)
4. Refactor while keeping tests green (Refactor)
5. If you change game rules, add **regression tests**.

### 2.3 Definition of Done (DoD)
- ✅ Relevant unit + integration tests
- ✅ Lint/format passes
- ✅ No secrets in code
- ✅ Essential logs/telemetry
- ✅ Docs updated (README, ADRs, routes, events)
- ✅ Migration/versioning if schema/protocol changed
- ✅ No unplanned breaking changes

---

## 3) Recommended architecture (high level)

### 3.1 Layered separation
- **Domain (game rules)**: pure, deterministic, no I/O
  - e.g., move validation, scoring, turn transitions
- **Application (use cases)**: orchestrates domain + persistence + events
  - e.g., `MakeMove`, `CreateRoom`, `JoinRoom`, `ReconnectPlayer`
- **Infrastructure (I/O)**: database, cache, WebSocket, queue, auth providers
- **Interface (API / WS)**: routes, handlers, payload validation, DTOs

### 3.2 Server-authoritative game state
- Client sends **intent** (e.g., “move piece X to Y”).
- Server validates:
  - permissions (is it their turn? are they in the room?)
  - consistency (current state)
  - game rules (is the move legal?)
- Server applies and broadcasts:
  - new state / turn event
  - snapshot or diff (prefer diffs/events when possible)

### 3.3 Real-time communication
- Prefer **WebSocket** (or WebRTC if needed), with:
  - versioned events (`type`, `version`)
  - ack/seq for reconciliation
  - reconnection with bounded **replay** by time/seq
- Messages must be small and validated.

---

## 4) Security (Security-first)

### 4.1 Minimum checklist (OWASP + multiplayer)
- **Authentication**: JWT/session with rotation and short expiration.
- **Authorization**: room/match checks and per-action checks (turn-based).
- **Validation**: schema validation for every request/event.
- **Rate limiting**: per IP + per user + per room (anti-spam).
- **Replay protection**:
  - include `nonce`/`seq` per connection
  - reject out-of-order messages
- **Cheat prevention**:
  - never accept client state as truth
  - record every move as an auditable event
- **Data security**:
  - encryption in transit (TLS)
  - password hashing (if applicable) with modern algorithms (e.g., Argon2/bcrypt)
  - minimize PII and apply privacy principles
- **Dependencies**:
  - lock versions (lockfile)
  - vulnerability scanning in CI
- **CSP / headers** (web):
  - CSP, HSTS, X-Frame-Options, etc.
- **Errors**:
  - generic messages to users
  - details only in internal logs

### 4.2 `.env` and secrets
- Example keys (no hardcoding):
  - `DATABASE_URL`
  - `REDIS_URL`
  - `JWT_SECRET`
  - `COOKIE_SECRET`
  - `SENTRY_DSN`
  - `RATE_LIMIT_WINDOW_MS`
  - `RATE_LIMIT_MAX`
- **Never** commit `.env`.
  - Keep a `.env.example` without real secrets.

### 4.3 Safe logging
- Do not log:
  - tokens, cookies, passwords, sensitive headers
- Sanitize payloads.
- Use correlation:
  - `request_id`, `room_id`, `player_id` (avoid PII)

---

## 5) Quality and testing (TDD-first)

### 5.1 Testing pyramid
- **Unit tests (most)**: pure domain
- **Integration**: application + infra (db/cache/ws)
- **E2E**: critical flows (create room → join → play → finish)

### 5.2 What to test in the game (examples)
- Rules:
  - invalid move (not your turn, wrong piece, illegal move)
  - draw, win, scoring
  - special effects/cards/dice (control RNG)
- Concurrency:
  - two clients sending moves at the same time
  - reconnect during a turn
- Networking:
  - out-of-order events
  - connection loss and resume
- Security:
  - attempts to play in someone else’s room
  - event spam
  - malformed payloads

### 5.3 Determinism and RNG
- RNG must be injectable:
  - `rng = seedableRandom(seed)` or a provider
- Tests use fixed seeds.
- In production, seed may be generated server-side per match.

---

## 6) Configuration, environments, and deploy

### 6.1 Environments
- `local`, `staging`, `prod`
- Production changes require:
  - safe migrations
  - feature flags when appropriate
  - observability enabled

### 6.2 Migrations and versioning
- Any schema change:
  - backward-compatible migration (expand → migrate → contract)
  - rollback planned
- Events/WS and APIs:
  - version payloads and maintain compatibility for a defined window

---

## 7) Observability and operations

### 7.1 Essential metrics
- matches created / active
- broadcast latency
- connection drops / reconnections
- errors by route/event
- rate limit hits
- queue/backpressure (if applicable)

### 7.2 Logs and tracing
- structured logs (JSON) + levels
- tracing for HTTP requests and WS events
- alerts for:
  - 5xx errors
  - latency spikes
  - reconnection spikes

---

## 8) Code standards

### 8.1 Style
- Formatter + linter required
- Clear names, small functions, no duplication
- Prefer immutability in domain (explicit state transitions)

### 8.2 Errors and validation
- DTO/schema validation at the edge (API/WS)
- Domain throws typed errors (e.g., `InvalidMoveError`)
- Application maps errors → responses/events

### 8.3 Performance
- Avoid serializing huge states; prefer events/diffs
- Cache where it makes sense (e.g., room list)
- Backpressure for WS and payload size limits

---

## 9) PR checklist (the agent should validate)

- [ ] Tests added/updated (Red→Green)
- [ ] No secrets/credentials in code
- [ ] `.env.example` updated if new vars were added
- [ ] Server-authoritative input validation
- [ ] Rate limit and abuse prevention considered (when applicable)
- [ ] Useful logs/telemetry without sensitive data
- [ ] Docs updated
- [ ] Changes are small and well explained in commits/PR

---

## 10) `.env` conventions (example)

Create a `.env.example` file with:

```dotenv
# App
NODE_ENV=development
APP_URL=http://localhost:3000
PORT=3000

# Auth
JWT_SECRET=change_me
JWT_EXPIRES_IN=15m
COOKIE_SECRET=change_me

# Storage
DATABASE_URL=postgresql://user:pass@localhost:5432/boardgame
REDIS_URL=redis://localhost:6379

# Observability
SENTRY_DSN=
LOG_LEVEL=info

# Security / Abuse prevention
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
WS_MAX_MESSAGE_BYTES=8192
```

> In production, use your platform’s secret manager (KMS/Secret Manager) instead of storing `.env` on disk.

---

## 11) Final note

The agent’s job is to keep the project **reliable, secure, and easy to evolve**, with small, test-driven deliveries.  
When “ship fast” conflicts with “ship safely,” **security and tests win**.
