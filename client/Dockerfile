# =============================================================================
# LinguistNow Frontend - Multi-stage Docker Build
# =============================================================================
# Build arguments are passed at build time to configure the Vite application.
# These become baked into the static files and cannot be changed at runtime.
# =============================================================================

# Stage 1: Build the Vite React application
FROM node:25-alpine AS build

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies (using ci for reproducible builds)
# --legacy-peer-deps needed for React 19 compatibility with some packages
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments - these are baked into the static files at build time
# VITE_API_URL: Backend API endpoint (e.g., https://api.example.com)
# VITE_BASE_URL: Frontend base URL for OAuth redirects (e.g., https://app.example.com)
# VITE_GOOGLE_CLIENT_ID: Google OAuth client ID
ARG VITE_API_URL
ARG VITE_BASE_URL
ARG VITE_GOOGLE_CLIENT_ID

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Build the application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Add labels for container metadata
LABEL org.opencontainers.image.source="https://github.com/nicmart-dev/linguistnow"
LABEL org.opencontainers.image.description="LinguistNow Frontend - React application for linguist availability management"
LABEL org.opencontainers.image.licenses="MIT"

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check for container orchestration
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
