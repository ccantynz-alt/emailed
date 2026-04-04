#!/usr/bin/env bash
# =============================================================================
# Emailed Platform — Development Servers
# =============================================================================
# Usage: ./scripts/dev.sh
#
# Starts all application services in development mode with hot reload.
# Infrastructure services (Postgres, Redis, etc.) must already be running.
# Run ./scripts/setup.sh first if you haven't yet.
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

# ─── Check infrastructure is running ────────────────────────────────────────

if docker compose version &>/dev/null; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE_CMD="docker-compose"
else
  error "docker compose not found"
  exit 1
fi

RUNNING=$($COMPOSE_CMD -f "$COMPOSE_FILE" ps --status running --format json 2>/dev/null | wc -l || echo "0")

if [ "$RUNNING" -lt 2 ]; then
  warn "Infrastructure services don't appear to be running."
  info "Starting them now..."
  $COMPOSE_CMD -f "$COMPOSE_FILE" up -d postgres redis clickhouse meilisearch minio
  info "Waiting 5s for services to initialize..."
  sleep 5
fi

# ─── Source environment ──────────────────────────────────────────────────────

cd "$ROOT_DIR"

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# ─── Print service map ──────────────────────────────────────────────────────

echo ""
echo -e "${BOLD}============================================================${NC}"
echo -e "${GREEN}  Emailed Platform — Development Mode${NC}"
echo -e "${BOLD}============================================================${NC}"
echo ""
echo -e "  ${BOLD}Application services starting:${NC}"
echo ""
echo -e "    Web App     ${CYAN}http://localhost:3000${NC}   (Next.js)"
echo -e "    API         ${CYAN}http://localhost:3001${NC}   (Hono)"
echo -e "    Admin       ${CYAN}http://localhost:3002${NC}   (Next.js)"
echo -e "    MTA         ${CYAN}localhost:587${NC}           (SMTP)"
echo -e "    Inbound     ${CYAN}localhost:2525${NC}          (SMTP)"
echo -e "    JMAP        ${CYAN}http://localhost:8080${NC}   (JMAP)"
echo -e "    Reputation  ${CYAN}http://localhost:3005${NC}   (HTTP)"
echo ""
echo -e "  ${BOLD}Infrastructure (Docker):${NC}"
echo ""
echo -e "    Postgres    ${CYAN}localhost:5432${NC}"
echo -e "    Redis       ${CYAN}localhost:6379${NC}"
echo -e "    ClickHouse  ${CYAN}localhost:8123${NC}"
echo -e "    Meilisearch ${CYAN}localhost:7700${NC}"
echo -e "    MinIO       ${CYAN}localhost:9001${NC} (console) / ${CYAN}localhost:9002${NC} (S3)"
echo ""
echo -e "  Press ${BOLD}Ctrl+C${NC} to stop all services."
echo ""
echo -e "${BOLD}============================================================${NC}"
echo ""

# ─── Start all dev servers via Turborepo ─────────────────────────────────────

# turbo run dev starts all workspaces that define a "dev" script.
# This includes: apps/web, apps/api, apps/admin, services/mta,
# services/inbound, services/jmap, services/reputation, etc.
exec bun run dev
