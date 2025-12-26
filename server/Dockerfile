# =============================================================================
# LinguistNow Backend - Node.js Express Server
# =============================================================================
# Environment variables should be passed at runtime via docker-compose or
# container orchestration (Portainer, etc.)
# =============================================================================

FROM node:20-alpine

# Add labels for container metadata
LABEL org.opencontainers.image.source="https://github.com/nicmart-dev/linguistnow"
LABEL org.opencontainers.image.description="LinguistNow Backend - Express API server for linguist availability management"
LABEL org.opencontainers.image.licenses="MIT"

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the API port
EXPOSE 5000

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-5000}/api/health || exit 1

# Start the server
CMD ["npm", "start"]
