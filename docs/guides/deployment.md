# Deployment Guide

This guide covers deploying Emailed to production using Docker and Kubernetes.

## Build Docker Images

Each service has its own Dockerfile. Build all images from the repository root:

```bash
# Build all service images
docker build -f infrastructure/docker/Dockerfile.web -t emailed/web:latest .
docker build -f infrastructure/docker/Dockerfile.api -t emailed/api:latest .
docker build -f infrastructure/docker/Dockerfile.mta -t emailed/mta:latest .
docker build -f infrastructure/docker/Dockerfile.inbound -t emailed/inbound:latest .
docker build -f infrastructure/docker/Dockerfile.ai-engine -t emailed/ai-engine:latest .
docker build -f infrastructure/docker/Dockerfile.dns -t emailed/dns:latest .
docker build -f infrastructure/docker/Dockerfile.jmap -t emailed/jmap:latest .
docker build -f infrastructure/docker/Dockerfile.reputation -t emailed/reputation:latest .
docker build -f infrastructure/docker/Dockerfile.sentinel -t emailed/sentinel:latest .

# Or build all at once with the helper script
./infrastructure/scripts/build-all.sh
```

## Push to Container Registry

Tag and push images to your container registry:

```bash
# Example using a private registry
REGISTRY=registry.example.com/emailed
TAG=$(git rev-parse --short HEAD)

for SERVICE in web api mta inbound ai-engine dns jmap reputation sentinel; do
  docker tag emailed/$SERVICE:latest $REGISTRY/$SERVICE:$TAG
  docker push $REGISTRY/$SERVICE:$TAG
done
```

## Kubernetes Deployment

### Prerequisites

- A Kubernetes cluster (v1.28+)
- `kubectl` configured to access the cluster
- Helm (v3+) for managing releases
- Secrets configured in the cluster (see Environment Variables below)

### Deploy with Kubernetes Manifests

```bash
# Create the namespace
kubectl create namespace emailed

# Apply secrets (see Environment Variables section)
kubectl apply -f infrastructure/kubernetes/secrets.yaml -n emailed

# Apply all manifests
kubectl apply -f infrastructure/kubernetes/ -n emailed
```

### Deploy with Pulumi

```bash
cd infrastructure/pulumi
bun install
pulumi up --stack production
```

## Environment Variables for Production

Configure the following environment variables via Kubernetes secrets or your secrets manager:

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `ANTHROPIC_API_KEY` | Claude API key for AI features |
| `APP_URL` | Public URL of the web app |
| `API_URL` | Public URL of the API gateway |
| `SESSION_SECRET` | Secret for session encryption (min 32 chars) |
| `DKIM_PRIVATE_KEY` | Default DKIM signing key |
| `S3_ENDPOINT` | S3-compatible storage endpoint |
| `S3_ACCESS_KEY` | S3 access key |
| `S3_SECRET_KEY` | S3 secret key |
| `S3_BUCKET` | S3 bucket name |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `CLICKHOUSE_URL` | ClickHouse connection string | `http://localhost:8123` |
| `MEILISEARCH_URL` | Meilisearch endpoint | `http://localhost:7700` |
| `MEILISEARCH_API_KEY` | Meilisearch master key | none |
| `SMTP_PORT` | Inbound SMTP listener port | `25` |
| `JMAP_PORT` | JMAP server port | `443` |
| `LOG_LEVEL` | Logging level | `info` |
| `NODE_ENV` | Environment mode | `production` |

## Database Migration in Production

Run migrations as a Kubernetes Job before deploying new application pods:

```bash
# Run migrations via a Job
kubectl apply -f infrastructure/kubernetes/migration-job.yaml -n emailed

# Watch the job status
kubectl wait --for=condition=complete job/db-migrate -n emailed --timeout=120s

# Check migration logs
kubectl logs job/db-migrate -n emailed
```

Alternatively, run migrations directly:

```bash
DATABASE_URL=postgresql://user:pass@host:5432/emailed bun run db:migrate
```

Always back up the database before running migrations in production:

```bash
pg_dump -Fc $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).dump
```

## Health Checks and Monitoring

### Health Check Endpoints

Each service exposes health check endpoints:

- `GET /health` - Basic liveness check (returns 200 if the process is running)
- `GET /health/ready` - Readiness check (returns 200 when the service can accept traffic)

Configure Kubernetes probes:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 4000
  initialDelaySeconds: 10
  periodSeconds: 15

readinessProbe:
  httpGet:
    path: /health/ready
    port: 4000
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Monitoring

Emailed uses OpenTelemetry for observability. Configure the collector endpoint:

```env
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
OTEL_SERVICE_NAME=emailed-api
```

Grafana dashboards are provided in `infrastructure/kubernetes/monitoring/`:

- **Email Pipeline** - Send queue depth, delivery rates, bounce rates
- **API Performance** - Request latency, error rates, throughput
- **AI Engine** - Classification latency, model accuracy, token usage
- **Infrastructure** - CPU, memory, disk, network across all pods

### Alerting

Alerting rules are defined in `infrastructure/kubernetes/monitoring/alerts.yaml`. Key alerts:

- Send queue depth exceeds threshold
- Bounce rate exceeds 5%
- API p99 latency exceeds 500ms
- AI classification latency exceeds 1s
- Disk usage exceeds 80%
- Pod restart count exceeds threshold

## Rollback Procedures

### Application Rollback

Roll back to the previous deployment:

```bash
# Rollback a specific deployment
kubectl rollout undo deployment/emailed-api -n emailed

# Rollback to a specific revision
kubectl rollout undo deployment/emailed-api -n emailed --to-revision=3

# Check rollout status
kubectl rollout status deployment/emailed-api -n emailed
```

### Database Rollback

If a migration needs to be reverted:

1. Restore from the pre-migration backup:
   ```bash
   pg_restore -d $DATABASE_URL backup_20260403_120000.dump
   ```
2. Deploy the previous application version that matches the restored schema.

### Pulumi Rollback

```bash
cd infrastructure/pulumi
pulumi stack history
pulumi up --target-version <version-number>
```

## SSL/TLS Certificate Management

### Automated Certificates with cert-manager

Emailed uses cert-manager for automatic TLS certificate provisioning via Let's Encrypt:

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml

# Apply the ClusterIssuer for Let's Encrypt
kubectl apply -f infrastructure/kubernetes/cert-manager/cluster-issuer.yaml
```

The ClusterIssuer is configured in `infrastructure/kubernetes/cert-manager/cluster-issuer.yaml`:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ops@emailed.dev
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
```

### SMTP TLS

The MTA service requires a TLS certificate for STARTTLS and implicit TLS on port 465:

```bash
# Generate or provide the SMTP TLS certificate
kubectl create secret tls emailed-smtp-tls \
  --cert=path/to/smtp.crt \
  --key=path/to/smtp.key \
  -n emailed
```

### Certificate Rotation

Certificates managed by cert-manager are automatically rotated before expiry. For manually managed certificates:

1. Update the Kubernetes secret with the new certificate.
2. Restart the affected pods:
   ```bash
   kubectl rollout restart deployment/emailed-mta -n emailed
   ```

## Production Checklist

Before going live, verify:

- [ ] All environment variables are set and secrets are configured
- [ ] Database migrations have been applied successfully
- [ ] DNS records (MX, SPF, DKIM, DMARC) are configured for all domains
- [ ] TLS certificates are provisioned for web, API, and SMTP
- [ ] Health check endpoints are responding
- [ ] Monitoring dashboards and alerts are configured
- [ ] Backup strategy is in place and tested
- [ ] Rate limiting is configured on public endpoints
- [ ] IP warm-up plan is prepared for new sending IPs
