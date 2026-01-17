# CMM — Maturity Meter Monorepo

Production-grade monorepo for next‑gen maturity (CMM) platform.

- apps/web: Next.js PWA (React 19 + TS)
- apps/api: FastAPI backend (Timescale + SQLAlchemy)
- apps/iot-svc: MQTT ingestion microservice
- packages/ui: shared UI library
- packages/config: shared configs (ESLint/Prettier/TS + ruff/black)

## Quickstart (Docker)

- copy `.env.example` to `.env` in root and under each app; adjust secrets
- `make dev` — boot full stack
- Web: http://localhost:3000, API: http://localhost:8000/docs

## Docs
- See `apps/*/README.md` for runbooks
- CI/CD via GitHub Actions in `.github/workflows/ci.yml`

