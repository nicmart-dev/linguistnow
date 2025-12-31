# =============================================================================
# LinguistNow Backend - Node.js Express Server
# =============================================================================
# Environment variables should be passed at runtime via docker-compose or
# container orchestration (Portainer, etc.)
# =============================================================================

FROM node:25-alpine

# Build arguments for version tracking
ARG BUILD_VERSION=dev
ARG BUILD_DATE
ARG BUILD_SHA

# Add labels for container metadata
LABEL org.opencontainers.image.source="https://github.com/nicmart-dev/linguistnow"
LABEL org.opencontainers.image.description="LinguistNow Backend - Express API server for linguist availability management"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.version="${BUILD_VERSION}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${BUILD_SHA}"

# Set version as environment variable for runtime access
ENV BUILD_VERSION=${BUILD_VERSION}
ENV BUILD_DATE=${BUILD_DATE}
ENV BUILD_SHA=${BUILD_SHA}

# Install pnpm globally
RUN npm install -g pnpm@9.15.2

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy pnpm workspace files from root context
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./

# Copy package.json files for both server and shared
COPY server/package.json ./server/
COPY shared/package.json ./shared/

# Copy source code for both packages BEFORE pnpm install
# (pnpm workspace links need source files to exist)
COPY server/ ./server/
COPY shared/ ./shared/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile && \
    pnpm store prune

# Manually create the workspace symlink (pnpm sometimes fails in Docker)
RUN mkdir -p /app/node_modules/@linguistnow && \
    ln -sf /app/shared /app/node_modules/@linguistnow/shared && \
    echo "=== Verifying workspace setup ===" && \
    ls -la /app/node_modules/@linguistnow/ && \
    ls -la /app/shared/src/ && \
    echo "=== End verification ==="

WORKDIR /app/server

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
CMD ["pnpm", "start"]
