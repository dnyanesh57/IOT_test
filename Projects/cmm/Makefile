SHELL := /bin/bash

.PHONY: dev build test migrate seed fmt lint

dev:
	docker compose up -d --build

build:
	docker compose build

test:
	docker compose run --rm api pytest -q

migrate:
	docker compose run --rm api alembic upgrade head

seed:
	docker compose run --rm api python scripts/dev_seed.py

fmt:
	docker compose run --rm api bash -lc "ruff check --fix . && black ."

lint:
	docker compose run --rm api ruff check .

