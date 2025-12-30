# Deploy LinguistNow Locally with Docker

This guide covers running LinguistNow locally using Docker for development or self-contained deployments.

> **For production deployment with Portainer**, see [Deploy to Production](./deploy-app-to-production.md).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Understanding Docker Compose Files](#understanding-docker-compose-files)
- [Environment Variables](#environment-variables)
- [Building Custom Images](#building-custom-images)
- [Understanding Vite Build-time Variables](#understanding-vite-build-time-variables)

---

## Prerequisites

1. **Docker** and **Docker Compose** installed
2. **Google OAuth credentials** configured (see [Set up OAuth in Google Cloud](./set-up-oauth-in-google-cloud.md))
3. **Airtable database** set up (see [Install Instructions](./install-instructions.md#airtable-database))

> **Note**: For local development, `docker-compose.yml` includes ALL services (Vault, n8n) in one stack. You don't need to deploy them separately.

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/nicmart-dev/linguistnow.git
cd linguistnow

# Copy environment files
cp example.env .env
cp server/example.env server/.env
cp client/example.env client/.env

# Edit .env with your credentials
nano .env

# Build and run all services
docker-compose up -d --build

# View logs
docker-compose logs -f
```

Access the application:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **n8n**: http://localhost:5678
- **Vault**: http://localhost:8200

---

## Understanding Docker Compose Files

| File                       | Purpose                            | Includes                                    |
| -------------------------- | ---------------------------------- | ------------------------------------------- |
| `docker-compose.yml`       | Full stack, builds from source     | Frontend, Backend, n8n, Vault (all-in-one)  |
| `docker-compose.prod.yml`  | Pre-built images, external network | Frontend, Backend only (connects to shared) |
| `docker-compose.vault.yml` | Vault only, shared infrastructure  | Vault (deploy separately for production)    |

### docker-compose.yml (Full Stack - Local Development)

Includes **all services** for self-contained local development:

- Frontend (builds from source)
- Backend (builds from source)
- n8n (workflow automation)
- HashiCorp Vault (token storage)

```bash
# Use for local development
docker-compose up -d --build
```

### docker-compose.prod.yml (Production)

Uses **pre-built images** and connects to external shared infrastructure:

- Frontend (pre-built from GHCR)
- Backend (pre-built from GHCR)
- **No n8n or Vault** (assumes deployed separately)

**Prerequisites for production:**

- Vault deployed via `docker-compose.vault.yml` - see [Vault Integration Guide](./n8n-vault-integration-guide.md#deploy-vault)
- n8n deployed separately - see [n8n Workflow Integration](./n8n-workflow-integration.md#3-deploy-n8n)

```bash
# Use for production with existing shared infrastructure
docker-compose -f docker-compose.prod.yml up -d
```

### docker-compose.vault.yml (Shared Vault)

Deploys **Vault only** as shared infrastructure for production:

```bash
# Deploy Vault for production (once, shared by all apps)
docker-compose -f docker-compose.vault.yml up -d
```

See [Vault Integration Guide](./n8n-vault-integration-guide.md) for initialization and configuration.

---

## Environment Variables

### Backend Environment Variables

These are set at **runtime** and work with pre-built images:

| Variable                         | Description                                 | Example                            |
| -------------------------------- | ------------------------------------------- | ---------------------------------- |
| `FRONTEND_URL`                   | Public URL of frontend (for OAuth redirect) | `http://localhost:3000`            |
| `BACKEND_URL`                    | Public URL of backend API                   | `http://localhost:5000`            |
| `GOOGLE_CLIENT_ID`               | From Google Cloud Console                   | `123...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET`           | From Google Cloud Console                   | `GOCSPX-...`                       |
| `AIRTABLE_PERSONAL_ACCESS_TOKEN` | From Airtable                               | `pat_...`                          |
| `AIRTABLE_BASE_ID`               | From Airtable URL                           | `app...`                           |
| `N8N_BASE_URL`                   | n8n instance URL                            | `http://n8n:5678`                  |
| `N8N_WEBHOOK_PATH`               | Webhook path (optional)                     | `/webhook/calendar-check`          |
| `VAULT_ADDR`                     | Vault server address                        | `http://vault:8200`                |
| `VAULT_TOKEN`                    | Vault authentication token                  | Generated from Vault init          |
| `VAULT_SECRET_PATH`              | Secret path prefix (optional)               | `secret/data/linguistnow/tokens`   |

### Frontend Build-time Variables

These are only used when **building** the frontend image:

| Variable                | Description              | Example                            |
| ----------------------- | ------------------------ | ---------------------------------- |
| `VITE_API_URL`          | Backend API URL          | `http://localhost:5000`            |
| `VITE_BASE_URL`         | Frontend public URL      | `http://localhost:3000`            |
| `VITE_GOOGLE_CLIENT_ID` | Same as GOOGLE_CLIENT_ID | `123...apps.googleusercontent.com` |

---

## Building Custom Images

### Build Frontend with Custom URLs

For production with custom domains, build the frontend with your URLs:

```bash
# Clone repository
git clone https://github.com/nicmart-dev/linguistnow.git
cd linguistnow

# Build frontend with your production URLs
# Note: Build context is the root directory (for pnpm workspace support)
docker build -t linguistnow-frontend:custom -f client/Dockerfile . \
  --build-arg VITE_API_URL=https://api.yourdomain.com \
  --build-arg VITE_BASE_URL=https://app.yourdomain.com \
  --build-arg VITE_GOOGLE_CLIENT_ID=your_client_id

# Build backend
docker build -t linguistnow-backend:custom -f server/Dockerfile .
```

Then reference `linguistnow-frontend:custom` and `linguistnow-backend:custom` in your docker-compose or Portainer stack.

### Pre-built Images

Pre-built images are published to GitHub Container Registry:

```bash
ghcr.io/nicmart-dev/linguistnow-backend:latest   # ✅ Works with runtime env vars
ghcr.io/nicmart-dev/linguistnow-frontend:latest  # ⚠️ Has localhost URLs baked in
```

---

## Understanding Vite Build-time Variables

> ⚠️ **Important**: The frontend uses Vite, which **bakes environment variables into the static files at build time**. This means:
>
> - Setting `VITE_*` environment variables at runtime has **no effect**
> - The pre-built Docker image uses `localhost` URLs by default
> - For production URLs, you must **rebuild the frontend image** with your URLs

### Options for Custom URLs

1. **Build locally** with `--build-arg` flags (see above)
2. **Configure GitHub Actions secrets** to build images with your URLs automatically
3. **Use docker-compose.yml** which builds from source with your environment variables

---

## Vault Setup (Local Development)

For local development, Vault runs in dev mode with an in-memory backend:

```bash
# Vault is accessible at http://localhost:8200
# Default dev token is set via VAULT_DEV_TOKEN (default: dev-token)

# Test Vault is running
curl http://localhost:8200/v1/sys/health
```

For production Vault setup (separate deployment), see [Vault Integration Guide](./n8n-vault-integration-guide.md).
