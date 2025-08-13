## Contributing to resk-caching

### Prerequisites
- Bun installed (see `https://bun.sh`).
- Node.js 18+.
- Set `JWT_SECRET` to exercise the `/api/*` endpoints locally.

### Setup & scripts
- `bun install`
- `bun run dev` (watch mode)
- `bun run start` (start server)
- `bun test`
- `bun run typecheck`
- `bun run lint`

### Style and quality
- TypeScript strict. Prefer explicit, descriptive names and readable code.
- Keep functions small, use guard clauses, and handle errors explicitly.

### Tests
- Cover critical paths (caching, security, error handling) and add regression tests when fixing bugs.

### Pull Requests
- Describe the change, impact, risks, and how you validated it.
- Keep PRs focused and small when possible; include tests and docs updates.

### CI
- CI runs type-check, lint, build, and tests on pushes/PRs to `main`/`master` and on version tags (`v*`).

