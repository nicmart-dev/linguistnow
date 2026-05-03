# FX Rate Conversion Setup Guide

## Overview

This guide walks you through setting up the FX rate conversion feature, including Redis caching and Frankfurter integration.

## Prerequisites

- Docker and Docker Compose installed
- Access to the `linguistnow` repository
- Basic understanding of Docker services

## Quick Setup

For a quick start, follow these condensed steps:

### 1. Update Environment Variables

**Root `.env` (optional - defaults provided):**

```bash
REDIS_PORT=6379
FRANKFURTER_PORT=8080
```

**Server `.env` (required):**

```bash
REDIS_URL=redis://redis:6379
FRANKFURTER_URL=http://frankfurter:8080
```

### 2. Start Services

```bash
docker-compose up -d
```

Wait for all services to be healthy (check with `docker-compose ps`).

### 3. Initialize FX Rates

```bash
curl -X POST http://localhost:5000/api/currency/refresh
```

### 4. Verify Setup

```bash
# Check rates are cached
curl http://localhost:5000/api/currency/check

# Test conversion
curl "http://localhost:5000/api/currency/convert?amount=100&from=USD&to=EUR"
```

### 5. Set Up n8n Workflows

1. Open n8n: `http://localhost:5678`
2. Import `n8n/Error_Handler_Subworkflow.json`
3. Import `n8n/FX_Rate_Update.json`
4. Update `n8n/Token_Refresh_Schedule.json` (use new version)
5. Activate all workflows

### 6. Test Frontend

1. Open dashboard
2. Find "Display Currency" dropdown in filters
3. Select a currency (e.g., EUR)
4. Verify rates convert correctly

---

## Step-by-Step Setup

### Step 1: Update Environment Variables

#### Root `.env` (for Docker Compose)

Add these optional variables (defaults are provided):

```bash
# Redis Configuration
REDIS_PORT=6379

# Frankfurter Configuration
FRANKFURTER_PORT=8080
```

#### Server `.env` (for backend)

Add these required variables:

```bash
# Redis Configuration
REDIS_URL=redis://redis:6379

# Frankfurter Configuration
FRANKFURTER_URL=http://frankfurter:8080
```

**For local development (outside Docker):**

```bash
REDIS_URL=redis://localhost:6379
FRANKFURTER_URL=http://localhost:8081
```

**Note**: Local port 8081 avoids conflict with backend PORT (5000). In Docker, Frankfurter uses port 8080 internally.

### Step 2: Start Docker Services

Start all services including Redis and Frankfurter:

```bash
docker-compose up -d
```

This will start:

- Backend (depends on Redis and Frankfurter)
- Frontend
- Redis (FX rate cache)
- Frankfurter (ECB rates API)
- n8n (scheduler)
- Vault (secrets)

### Step 3: Verify Services Are Running

Check all services are healthy:

```bash
docker-compose ps
```

You should see all services with status "healthy" or "Up".

### Step 4: Verify Redis Connection

Test Redis connectivity:

```bash
docker exec linguistnow-redis redis-cli ping
# Should return: PONG
```

### Step 5: Verify Frankfurter API

Test Frankfurter API:

```bash
curl http://localhost:8080/latest?base=USD
```

You should see JSON with exchange rates.

### Step 6: Initialize FX Rates

Trigger initial rate refresh:

```bash
curl -X POST http://localhost:5000/api/currency/refresh
```

This fetches rates from Frankfurter and stores them in Redis.

### Step 7: Verify Rates Are Cached

Check if rates are cached:

```bash
curl http://localhost:5000/api/currency/check
# Should return: {"hasRates":true}
```

View cached rates:

```bash
curl http://localhost:5000/api/currency/rates
```

### Step 8: Test Currency Conversion

Test conversion endpoint:

```bash
curl "http://localhost:5000/api/currency/convert?amount=100&from=USD&to=EUR"
```

Expected response:

```json
{
  "amount": 100,
  "from": "USD",
  "to": "EUR",
  "converted": 85.0
}
```

### Step 9: Set Up n8n Workflows

#### Import Error Handler Subworkflow

1. Open n8n UI: `http://localhost:5678`
2. Import workflow: `n8n/Error_Handler_Subworkflow.json`
3. **Configure SMTP credentials for email alerts:**
   - In n8n, go to **Credentials** → **New** → **SMTP**
   - Fill in your SMTP server details:
     - **Host**: Your SMTP server (e.g., `smtp.gmail.com`, `smtp.sendgrid.net`)
     - **Port**: SMTP port (usually 587 for TLS or 465 for SSL)
     - **User**: Your SMTP username/email
     - **Password**: Your SMTP password or app-specific password
   - **Save** the credential with a descriptive name (e.g., "LinguistNow SMTP")
   - Open the **Error Handler Subworkflow** workflow
   - Click on the **"Send Email Alert"** node (id: `send-email`, type: `n8n-nodes-base.emailSend`)
   - In the node settings, select your newly created SMTP credential from the **Credential** dropdown
   - Update the **"to"** field to replace `admin@yourdomain.com` with your actual email address
   - **Save** the workflow
4. Activate the workflow

**Reference**: For more details on n8n Email Send node configuration, see [n8n Email Send documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.emailsend/).

#### Import FX Rate Update Workflow

1. Import workflow: `n8n/FX_Rate_Update.json`
2. Activate the workflow

#### Update Token Refresh Workflow

1. Open existing workflow: `n8n/Token_Refresh_Schedule.json`
2. Replace with updated version (uses Error Handler subworkflow)
3. Activate the workflow

### Step 10: Test Frontend Currency Selector

1. Start frontend (if not already running):

   ```bash
   pnpm --filter ./client dev
   ```

2. Navigate to dashboard
3. Look for "Display Currency" dropdown in FilterBar
4. Select a currency (e.g., EUR)
5. Verify linguist rates are converted to selected currency
6. Check for "Rates converted to EUR" indicator

### Step 11: Verify Scheduled Updates

The FX Rate Update workflow runs daily at 8:00 AM UTC. To test manually:

1. Go to n8n UI
2. Find "FX Rate Update" workflow
3. Click "Execute Workflow"
4. Verify it completes successfully
5. Check email for any error alerts (if configured)

## Verification Checklist

- [ ] All Docker services are running and healthy
- [ ] Redis is accessible and responding
- [ ] Frankfurter API is accessible
- [ ] Initial rate refresh succeeded
- [ ] Rates are cached in Redis
- [ ] Currency conversion endpoint works
- [ ] Frontend currency selector appears
- [ ] Rates convert correctly in UI
- [ ] n8n workflows are imported and activated
- [ ] Error Handler subworkflow is configured
- [ ] FX Rate Update workflow is scheduled

## Troubleshooting

### Services Won't Start

**Check logs:**

```bash
docker-compose logs redis
docker-compose logs frankfurter
docker-compose logs backend
```

**Common issues:**

- Port conflicts: Change `REDIS_PORT` or `FRANKFURTER_PORT` in `.env`
- Network issues: Verify `linguistnow-net` network exists
- Health check failures: Increase `start_period` in docker-compose.yml
- Ports in use: Check ports aren't in use
- Docker resources: Verify Docker has enough resources
- Service logs: Check logs: `docker-compose logs [service-name]`

### Redis Connection Errors

**Check Redis is running:**

```bash
docker ps | grep redis
```

**Test connection:**

```bash
docker exec linguistnow-redis redis-cli ping
```

**Check backend logs:**

```bash
docker logs linguistnow-backend | grep -i redis
```

### Frankfurter API Errors

**Check Frankfurter is running:**

```bash
docker ps | grep frankfurter
```

**Test API:**

```bash
curl http://localhost:8080/latest?base=USD
```

**Check health:**

```bash
docker inspect linguistnow-frankfurter | grep -A 5 Health
```

### Rates Not Updating

**Manual refresh:**

```bash
curl -X POST http://localhost:5000/api/currency/refresh
```

**Check n8n workflow:**

- Verify workflow is activated
- Check execution history
- Review error logs

**Check Frankfurter:**

- Verify n8n workflow is activated
- Check Frankfurter is accessible
- Manual refresh: `curl -X POST http://localhost:5000/api/currency/refresh`

**Check Redis cache:**

```bash
docker exec linguistnow-redis redis-cli GET fx:rates
```

### Frontend Currency Selector Not Working

**Check API calls:**

- Open browser DevTools → Network tab
- Look for `/api/linguists/search?displayCurrency=...`
- Verify response includes `hourlyRateConverted`

**Check console errors:**

- Look for JavaScript errors
- Verify shared package is built: `pnpm --filter @linguistnow/shared build`

**Common fixes:**

- Rebuild shared package: `pnpm --filter @linguistnow/shared build`
- Check browser console for errors
- Verify API returns `hourlyRateConverted` field

## Next Steps

After setup is complete:

1. **Monitor n8n workflows** - Ensure FX rates update daily
2. **Set up alerts** - Configure email alerts for failures
3. **Review rates** - Verify rates are updating correctly
4. **Test conversions** - Try different currency combinations
5. **User training** - Show PMs how to use currency selector

## Additional Resources

- [Redis Setup Guide](../integrations/redis-setup.md)
- [Frankfurter Setup Guide](../integrations/frankfurter-setup.md)
- [Currency Conversion Architecture](../architecture/currency-conversion.md)
- [Testing and TDD](../development/testing-and-tdd.md#currency-feature-testing)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review service logs: `docker-compose logs [service-name]`
3. Verify environment variables are set correctly
4. Check network connectivity between services
5. Review n8n workflow execution history
