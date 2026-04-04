#!/usr/bin/env bash
# =============================================================================
# Emailed Platform — Quick Setup
# =============================================================================
# Usage: ./scripts/setup.sh
#
# This script prepares a fresh clone for local development:
#   1. Checks prerequisites (bun, docker, git)
#   2. Creates .env from .env.example (if missing)
#   3. Installs dependencies
#   4. Starts infrastructure services (Postgres, Redis, ClickHouse, Meilisearch, MinIO)
#   5. Waits for Postgres to accept connections
#   6. Runs database migrations and seed
#   7. Prints credentials and next steps
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
NC='\033[0m' # No Color

info()  { echo -e "${CYAN}[info]${NC}  $*"; }
ok()    { echo -e "${GREEN}[ok]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC}  $*"; }
error() { echo -e "${RED}[error]${NC} $*"; }
step()  { echo -e "\n${BOLD}── $* ──${NC}"; }

# ─── 1. Check prerequisites ─────────────────────────────────────────────────

step "Checking prerequisites"

missing=0

check_cmd() {
  if command -v "$1" &>/dev/null; then
    ok "$1 found: $(command -v "$1")"
  else
    error "$1 is not installed."
    missing=1
  fi
}

check_cmd bun
check_cmd docker
check_cmd git

# Check that Docker daemon is running
if docker info &>/dev/null; then
  ok "Docker daemon is running"
else
  error "Docker daemon is not running. Start Docker Desktop or dockerd first."
  missing=1
fi

# Check docker compose (v2 plugin or standalone)
if docker compose version &>/dev/null; then
  COMPOSE_CMD="docker compose"
  ok "docker compose found"
elif command -v docker-compose &>/dev/null; then
  COMPOSE_CMD="docker-compose"
  ok "docker-compose found"
else
  error "docker compose is not available. Install Docker Compose v2."
  missing=1
fi

if [ "$missing" -ne 0 ]; then
  echo ""
  error "Missing prerequisites. Install the tools above and re-run this script."
  exit 1
fi

# ─── 2. Create .env ─────────────────────────────────────────────────────────

step "Setting up environment"

cd "$ROOT_DIR"

if [ -f .env ]; then
  ok ".env already exists (skipping copy)"
else
  cp .env.example .env
  # Set the DATABASE_URL to the local Docker Postgres
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's|^DATABASE_URL=.*|DATABASE_URL=postgres://emailed:dev_password@localhost:5432/emailed|' .env
  else
    sed -i 's|^DATABASE_URL=.*|DATABASE_URL=postgres://emailed:dev_password@localhost:5432/emailed|' .env
  fi
  ok "Created .env from .env.example (DATABASE_URL set to local Postgres)"
fi

# ─── 3. Install dependencies ────────────────────────────────────────────────

step "Installing dependencies"

bun install
ok "Dependencies installed"

# ─── 4. Start infrastructure services ───────────────────────────────────────

step "Starting infrastructure services"

info "Starting Postgres, Redis, ClickHouse, Meilisearch, MinIO..."
$COMPOSE_CMD -f "$COMPOSE_FILE" up -d postgres redis clickhouse meilisearch minio
ok "Infrastructure containers started"

# ─── 5. Wait for Postgres ───────────────────────────────────────────────────

step "Waiting for Postgres to be ready"

MAX_WAIT=60
WAITED=0

while ! docker exec "$(docker ps -qf "ancestor=postgres:16-alpine" | head -1)" pg_isready -U emailed -d emailed &>/dev/null; do
  if [ "$WAITED" -ge "$MAX_WAIT" ]; then
    error "Postgres did not become ready within ${MAX_WAIT}s."
    error "Check: $COMPOSE_CMD -f $COMPOSE_FILE logs postgres"
    exit 1
  fi
  sleep 2
  WAITED=$((WAITED + 2))
  info "Waiting... (${WAITED}s / ${MAX_WAIT}s)"
done

ok "Postgres is accepting connections"

# Wait a beat for Redis too
sleep 1

# ─── 6. Run migrations ──────────────────────────────────────────────────────

step "Running database migrations"

# Source .env for DATABASE_URL
set -a
source "$ROOT_DIR/.env"
set +a

bun run db:migrate
ok "Migrations complete"

# ─── 7. Run seed ────────────────────────────────────────────────────────────

step "Seeding database"

bun run db:seed
ok "Seed complete"

# ─── 8. Print summary ───────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}============================================================${NC}"
echo -e "${GREEN}  Emailed Platform — Setup Complete${NC}"
echo -e "${BOLD}============================================================${NC}"
echo ""
echo -e "  ${BOLD}Test credentials:${NC}"
echo -e "    Email:    ${CYAN}admin@test.emailed.dev${NC}"
echo -e "    Password: ${CYAN}password123${NC}"
echo ""
echo -e "  ${BOLD}API Key:${NC}"
echo -e "    The seed script printed a full API key above."
echo -e "    Copy it now — it is only shown once."
echo ""
echo -e "  ${BOLD}Infrastructure services:${NC}"
echo -e "    Postgres:     ${CYAN}localhost:5432${NC}"
echo -e "    Redis:        ${CYAN}localhost:6379${NC}"
echo -e "    ClickHouse:   ${CYAN}localhost:8123${NC}"
echo -e "    Meilisearch:  ${CYAN}localhost:7700${NC}"
echo -e "    MinIO Console:${CYAN} localhost:9001${NC}"
echo -e "    MinIO S3 API: ${CYAN}localhost:9002${NC}"
echo ""
echo -e "  ${BOLD}Next steps:${NC}"
echo -e "    Start all dev servers:  ${CYAN}./scripts/dev.sh${NC}"
echo -e "    Or run individually:    ${CYAN}bun run dev${NC}"
echo ""
echo -e "  ${BOLD}Useful commands:${NC}"
echo -e "    Reset database:   ${CYAN}./scripts/reset-db.sh${NC}"
echo -e "    Run tests:        ${CYAN}bun run test${NC}"
echo -e "    Build all:        ${CYAN}bun run build${NC}"
echo -e "    DB studio:        ${CYAN}bun run db:studio${NC}"
echo ""
