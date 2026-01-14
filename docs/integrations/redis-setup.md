# Redis Setup and Configuration

## Overview

Redis is used as a persistent cache for FX exchange rates in the LinguistNow application. It provides fast access to cached rates and survives container restarts.

## Docker Compose Configuration

Redis is configured in `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  container_name: linguistnow-redis
  restart: unless-stopped
  ports:
    - "${REDIS_PORT:-6379}:6379"
  volumes:
    - redis-data:/data
  command: redis-server --appendonly yes
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
  networks:
    - linguistnow-net
```

## Key Features

### Persistence

- **AOF (Append-Only File)**: Enabled with `--appendonly yes`
- **Named Volume**: `redis-data:/data` persists data across container restarts
- **TTL**: FX rates cached for 48 hours (172800 seconds)

### Health Checks

- Redis health check runs every 10 seconds
- Backend service waits for Redis to be healthy before starting
- Uses `redis-cli ping` to verify connectivity

## Environment Variables

### Server Configuration

Add to `server/.env`:

```bash
REDIS_URL=redis://redis:6379
```

For local development (outside Docker):

```bash
REDIS_URL=redis://localhost:6379
```

### Docker Compose

Add to root `.env` (optional, defaults provided):

```bash
REDIS_PORT=6379
```

## Data Persistence

### Volume Management

**List volumes:**
```bash
docker volume ls | grep redis
```

**Inspect volume:**
```bash
docker volume inspect linguistnow-redis-data
```

**Backup data:**
```bash
docker exec linguistnow-redis redis-cli SAVE
docker cp linguistnow-redis:/data/dump.rdb ./redis-backup-$(date +%Y%m%d).rdb
```

**Restore data:**
```bash
docker cp ./redis-backup-YYYYMMDD.rdb linguistnow-redis:/data/dump.rdb
docker restart linguistnow-redis
```

### Data Retention

- FX rates: 48 hours TTL (auto-expires)
- Data survives container restarts
- Data lost only if volume is explicitly deleted

## Troubleshooting

### Connection Issues

**Check Redis is running:**
```bash
docker ps | grep redis
```

**Test connection:**
```bash
docker exec linguistnow-redis redis-cli ping
# Should return: PONG
```

**Check logs:**
```bash
docker logs linguistnow-redis
```

### Cache Issues

**View cached rates:**
```bash
docker exec linguistnow-redis redis-cli GET fx:rates
```

**Check TTL:**
```bash
docker exec linguistnow-redis redis-cli TTL fx:rates
```

**Clear cache:**
```bash
docker exec linguistnow-redis redis-cli DEL fx:rates
```

**List all keys:**
```bash
docker exec linguistnow-redis redis-cli KEYS "*"
```

### Performance

**Monitor memory usage:**
```bash
docker exec linguistnow-redis redis-cli INFO memory
```

**Monitor commands:**
```bash
docker exec linguistnow-redis redis-cli MONITOR
```

### Common Errors

**Error: "Redis connection error"**
- Check Redis container is running: `docker ps`
- Verify REDIS_URL in server/.env
- Check network connectivity: `docker network inspect linguistnow-net`

**Error: "Failed to get cached rates"**
- Check Redis logs: `docker logs linguistnow-redis`
- Verify Redis is healthy: `docker exec linguistnow-redis redis-cli ping`
- Check if rates exist: `docker exec linguistnow-redis redis-cli GET fx:rates`

**Error: "Connection refused"**
- Verify Redis port is exposed: `docker ps | grep redis`
- Check firewall rules
- Verify REDIS_URL uses correct hostname (use `redis` in Docker, `localhost` locally)

## Production Considerations

### Security

- **Network isolation**: Redis only accessible on `linguistnow-net` network
- **No authentication**: Redis runs on internal network only (not exposed externally)
- **Port binding**: Only bind to localhost if exposing port externally

### Monitoring

**Set up monitoring:**
```bash
# Install redis-cli locally
# macOS: brew install redis
# Ubuntu: apt-get install redis-tools

# Monitor from host
redis-cli -h localhost -p 6379 MONITOR
```

**Health check endpoint:**
```bash
curl http://localhost:5000/api/currency/check
```

### Backup Strategy

1. **Automated backups**: Set up cron job to backup Redis data
2. **Snapshot before updates**: Always backup before major updates
3. **Test restores**: Regularly test restore procedures

**Example backup script:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d-%H%M%S)
docker exec linguistnow-redis redis-cli SAVE
docker cp linguistnow-redis:/data/dump.rdb ./backups/redis-$DATE.rdb
```

## Development

### Local Development (without Docker)

1. **Install Redis:**
   ```bash
   # macOS
   brew install redis
   brew services start redis

   # Ubuntu
   sudo apt-get install redis-server
   sudo systemctl start redis-server
   ```

2. **Update server/.env:**
   ```bash
   REDIS_URL=redis://localhost:6379
   ```

3. **Test connection:**
   ```bash
   redis-cli ping
   ```

### Testing

Run tests with mocked Redis:
```bash
pnpm --filter ./server test currencyService
```

Tests mock Redis to avoid requiring a running instance.

## References

- [Redis Documentation](https://redis.io/documentation)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [ioredis Documentation](https://github.com/redis/ioredis)
