# Frankfurter FX Rates Setup

## Overview

Frankfurter is a self-hosted service that provides ECB (European Central Bank) exchange rates. It's used as the data source for currency conversion in LinguistNow.

## Docker Compose Configuration

Frankfurter is configured in `docker-compose.yml`:

```yaml
frankfurter:
  image: lineofflight/frankfurter:latest
  container_name: linguistnow-frankfurter
  restart: unless-stopped
  ports:
    - "${FRANKFURTER_PORT:-8080}:8080"
  volumes:
    - frankfurter-data:/app/data
  healthcheck:
    test:
      [
        "CMD-SHELL",
        'ruby -rnet/http -e ''res = Net::HTTP.get_response(URI("http://localhost:8080/latest")); exit(res.is_a?(Net::HTTPSuccess) ? 0 : 1)''',
      ]
    interval: 60s
    timeout: 10s
    retries: 3
    start_period: 45m
  networks:
    - linguistnow-net

volumes:
  frankfurter-data:
    name: linguistnow-frankfurter-data
```

## Key Features

- **ECB Rates**: Uses European Central Bank reference rates
- **Daily Updates**: Rates updated daily from ECB feed
- **REST API**: Simple HTTP API for fetching rates
- **Base Currency**: USD (configurable via query parameter)

## API Endpoints

### Get Latest Rates

```bash
GET http://frankfurter:8080/latest?base=USD
```

**Response:**

```json
{
  "base": "USD",
  "date": "2024-01-15",
  "rates": {
    "EUR": 0.85,
    "GBP": 0.73,
    "JPY": 110.0,
    ...
  }
}
```

### Get Historical Rates

```bash
GET http://frankfurter:8080/2024-01-15?base=USD
```

### Get Rate for Specific Date Range

```bash
GET http://frankfurter:8080/2024-01-01..2024-01-15?base=USD
```

## Environment Variables

### Server Configuration

Add to `server/.env`:

```bash
FRANKFURTER_URL=http://frankfurter:8080
# Optional: Fallback to public hosted API if self-hosted instance is unreachable
FRANKFURTER_FALLBACK_URL=https://api.frankfurter.dev/v1
```

For local development (outside Docker):

```bash
# Note: Default local port is 8081 to avoid conflict if Docker Frankfurter is running on 8080
FRANKFURTER_URL=http://localhost:8081
FRANKFURTER_FALLBACK_URL=https://api.frankfurter.dev/v1
```

### Docker Compose

Add to root `.env` (optional, defaults provided):

```bash
FRANKFURTER_PORT=8080
```

## Supported Currencies

Frankfurter supports all currencies available from ECB:

- USD (US Dollar) - Base currency
- EUR (Euro)
- GBP (British Pound)
- JPY (Japanese Yen)
- CNY (Chinese Yuan)
- CAD (Canadian Dollar)
- AUD (Australian Dollar)
- CHF (Swiss Franc)
- INR (Indian Rupee)
- BRL (Brazilian Real)
- MXN (Mexican Peso)
- KRW (South Korean Won)
- ZAR (South African Rand)
- SGD (Singapore Dollar)

**Note**: RUB (Russian Ruble) was removed as ECB suspended rates in March 2022.

## Troubleshooting

### Connection Issues

**Check Frankfurter is running:**

```bash
docker ps | grep frankfurter
```

**Test API:**

```bash
curl http://localhost:8080/latest?base=USD
```

**Check logs:**

```bash
docker logs linguistnow-frankfurter
```

### Rate Update Issues

**Check last update date:**

```bash
curl http://localhost:8080/latest?base=USD | jq .date
```

**Verify rates are recent:**

- Rates should update daily
- Check date matches current date (or previous business day)

**Manual refresh:**

```bash
# Trigger backend refresh endpoint
curl -X POST http://localhost:5000/api/currency/refresh
```

### Common Errors

**Error: "Frankfurter API error: 500"**

- Check Frankfurter container logs: `docker logs linguistnow-frankfurter`
- Verify container is healthy: `docker ps | grep frankfurter`
- Check network connectivity: `docker network inspect linguistnow-net`

**Error: "Connection refused"**

- Verify Frankfurter port is exposed: `docker ps | grep frankfurter`
- Check FRANKFURTER_URL uses correct hostname (use `frankfurter` in Docker, `localhost` locally)
- Verify health check is passing: `docker inspect linguistnow-frankfurter | grep -A 10 Health`

**Error: "Currency XXX not supported"**

- Verify currency code is correct (ISO 4217)
- Check supported currencies list above
- Ensure currency is available from ECB

## Production Considerations

### Rate Freshness & Resilience

- **Update Frequency**: Rates update daily from ECB
- **Persistent Cache**: Rates cached in Redis for 48 hours
- **In-Memory Fallback**: Node.js in-memory cache buffers rates if Redis is disconnected
- **Public API Fallback**: If the self-hosted Frankfurter container is offline or during a long historical sync, requests automatically fail over to `https://api.frankfurter.dev/v1`
- **Decoupled Boot**: The backend depends on Frankfurter with `condition: service_started`, ensuring the main application boots instantly even when Frankfurter is doing an initial historical backfill

### Monitoring

**Health check:**

```bash
curl http://localhost:8080/latest
```

**Monitor update schedule:**

- Set up monitoring for n8n workflow execution
- Alert if rates are older than 2 days
- Check ECB feed status

### Rate Accuracy

- **Source**: ECB reference rates (official)
- **Update Time**: Typically around 4 PM CET
- **Weekend Handling**: Last Friday's rates used for weekends
- **Holiday Handling**: Last business day's rates used

## Development

### Local Development (without Docker)

1. **Run Frankfurter locally:**

   ```bash
   docker run -d -p 8080:8080 lineofflight/frankfurter:latest
   ```

2. **Update server/.env:**

   ```bash
   FRANKFURTER_URL=http://localhost:8080
   ```

3. **Test API:**
   ```bash
   curl http://localhost:8080/latest?base=USD
   ```

### Testing

Run tests with mocked Frankfurter:

```bash
pnpm --filter ./server test currencyService
```

Tests mock the fetch API to avoid requiring a running Frankfurter instance.

## References

- [Frankfurter GitHub](https://github.com/frankfurter-app/frankfurter)
- [Frankfurter Docker Hub](https://hub.docker.com/r/frankfurter/frankfurter)
- [ECB Exchange Rates](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html)
