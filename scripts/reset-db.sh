#!/usr/bin/env bash
# =============================================================================
# Emailed Platform — Reset Database
# =============================================================================
# Usage: ./scripts/reset-db.sh
#
# Drops and recreates the emailed database, runs migrations, and seeds.
# Useful when you need a clean slate during development.
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infrastructure/docker/docker-compose.dev.yml"

# ─── Colors ──────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}[info]${NC}  $*"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $*"; }
error() { echo -e "${RED}[error]${NC} $*"; }
step()  { echo -e "\n${BOLD}── $* ──${NC}"; }

# ─── Confirmation ────────────────────────────────────────────────────────────

echo ""
echo -e "${YELLOW}WARNING: This will destroy all data in the local database.${NC}"
echo ""

if [ "${1:-}" != "--yes" ] && [ "${1:-}" != "-y" ]; then
  read -rp "Are you sure? [y/N] " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    info "Aborted."
    exit 0
  fi
fi

# ─── Source environment ──────────────────────────────────────────────────────

cd "$ROOT_DIR"

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# ─── Find the Postgres container ────────────────────────────────────────────

step "Resetting database"

POSTGRES_CONTAINER=$(docker ps -qf "ancestor=postgres:16-alpine" | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
  error "Postgres container is not running."
  info "Start it with: docker compose -f $COMPOSE_FILE up -d postgres"
  exit 1
fi

# ─── Drop and recreate ──────────────────────────────────────────────────────

info "Dropping database 'emailed'..."
docker exec "$POSTGRES_CONTAINER" psql -U emailed -d postgres -c "DROP DATABASE IF EXISTS emailed;" 2>/dev/null
ok "Database dropped"

info "Creating database 'emailed'..."
docker exec "$POSTGRES_CONTAINER" psql -U emailed -d postgres -c "CREATE DATABASE emailed OWNER emailed;" 2>/dev/null
ok "Database created"

# ─── Run migrations ─────────────────────────────────────────────────────────

step "Running migrations"

bun run db:migrate
ok "Migrations complete"

# ─── Run seed ────────────────────────────────────────────────────────────────

step "Seeding database"

bun run db:seed
ok "Seed complete"

# ─── Done ────────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}Database reset complete.${NC}"
echo -e "A new API key was generated above — update your .env or client config if needed."
echo ""
