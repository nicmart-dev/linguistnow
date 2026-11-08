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
    - "${FRANKFURTER_BIND_IP:-127.0.0.1}:${FRANKFURTER_PORT:-8080}:8080"
  environment:
    - DATABASE_URL=sqlite:///app/data/frankfurter.sqlite3
    - FRANKFURTER_RETENTION_DAYS=${FRANKFURTER_RETENTION_DAYS:-90}
  volumes:
    - frankfurter-data:/app/data
  command:
    - sh
    - -c
    - |
      ruby -e '
        retention_days = Integer(ENV.fetch("FRANKFURTER_RETENTION_DAYS", 90))
        providers_dir = "/app/db/seeds/providers"
        if Dir.exist?(providers_dir)
          Dir.glob("#{providers_dir}/*.json").each do |file|
            File.delete(file) unless File.basename(file) == "ecb.json"
          end

          ecb_file = "#{providers_dir}/ecb.json"
          if File.exist?(ecb_file)
            require "json"
            require "date"
            data = JSON.parse(File.read(ecb_file))
            data["coverage_start"] = (Date.today - retention_days).to_s
            File.write(ecb_file, JSON.pretty_generate(data))
          end
        end

        config_ru = "/app/config.ru"
        if File.exist?(config_ru)
          content = File.read(config_ru)
          unless content.include?("LegacyRewrite")
            middleware = %Q{
      class LegacyRewrite
        def initialize(app)
          @app = app
        end
        def call(env)
          path = env["PATH_INFO"]
          if path == "/latest" || path =~ %r{\\A/\\d{4}-\\d{2}-\\d{2}} || path == "/currencies"
            env["PATH_INFO"] = "/v1\#{path}"
          end
          @app.call(env)
        end
      end
      use LegacyRewrite
            }
            new_content = content.sub("run App.freeze.app", "\#{middleware}\nrun App.freeze.app")
            File.write(config_ru, new_content)
          end
        end

        schedule_file = "/app/bin/schedule"
        if File.exist?(schedule_file)
          content = File.read(schedule_file)
          unless content.include?("rates_prune")
            prune_job = %Q{
      unless dry_run
        scheduler.cron("0 1 * * *") do # rates_prune
          cutoff = (Date.today - Integer(ENV.fetch("FRANKFURTER_RETENTION_DAYS", 90))).to_s
          if DB.table_exists?(:rates)
            deleted = DB[:rates].where { date < cutoff }.delete
            Log.info("Pruned \#{deleted} rates older than \#{cutoff}") if deleted.positive?
          end
        end
      end
            }
            new_content = content.sub("scheduler.join unless dry_run", "\#{prune_job}\nscheduler.join unless dry_run")
            File.write(schedule_file, new_content)
          end
        end
      '
      bundle exec rake db:setup
      ruby -e '
        require_relative "boot"
        require "db"
        require "date"
        cutoff = (Date.today - Integer(ENV.fetch("FRANKFURTER_RETENTION_DAYS", 90))).to_s
        if DB.table_exists?(:rates)
          deleted = DB[:rates].where { date < cutoff }.delete
          puts "Pruned #{deleted} historical rates older than #{cutoff}" if deleted.positive?
        end
      '
      exec bundle exec foreman start
  healthcheck:
    test:
      [
        "CMD-SHELL",
        'ruby -rnet/http -e ''res = Net::HTTP.get_response(URI("http://localhost:8080/latest")); exit(res.is_a?(Net::HTTPSuccess) ? 0 : 1)''',
      ]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s

volumes:
  frankfurter-data:
    name: linguistnow-frankfurter-data
```

## Lightweight Operation & CPU Optimization

By default, the upstream `lineofflight/frankfurter` image bundles seed metadata for ~100 global central banks and backfills up to 27+ years of historical exchange rates from 1999 to the present on startup. Because LinguistNow only requires current reference exchange rates for conversion (not historical reporting), an unconstrained backfill causes prolonged 100% container CPU load and excessive memory consumption (issue [#178](https://github.com/nicmart-dev/linguistnow/issues/178)).

To keep resource usage minimal and the service responsive within seconds:

1. **ECB-Only Filtering**: All ~100 non-ECB central bank provider definitions are pruned on boot. Only the European Central Bank (ECB) feed is seeded and scheduled.
2. **Rolling Retention Window**: ECB's `coverage_start` is dynamically capped to a rolling window (default: 90 days, configurable via `FRANKFURTER_RETENTION_DAYS`). Initial sync downloads only ~1,800 rates in ~1-2 seconds instead of 260,000+ historical rows.
3. **Automated Pruning**: Rates older than the retention cutoff are pruned at startup and daily at 01:00 UTC via the background scheduler, keeping the SQLite database permanently compact (~1-2 MB).
4. **Persistent SQLite Database**: `DATABASE_URL=sqlite:///app/data/frankfurter.sqlite3` ensures data is saved to the persistent `frankfurter-data` volume so restarts do not re-backfill.
5. **Legacy `/latest` Rewriting**: An embedded Rack middleware seamlessly rewrites `/latest` to `/v1/latest`, preventing 404s and keeping healthchecks and existing backend queries functioning smoothly.

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

### Local Development (without Docker Compose)

1. **Run Frankfurter locally with lightweight entrypoint:**

   ```bash
   docker run -d -p 8080:8080 \
     -e DATABASE_URL=sqlite:///app/data/frankfurter.sqlite3 \
     -e FRANKFURTER_RETENTION_DAYS=90 \
     -v frankfurter-data:/app/data \
     -v ./scripts/frankfurter-entrypoint.sh:/entrypoint.sh:ro \
     --entrypoint /entrypoint.sh \
     lineofflight/frankfurter:latest
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
