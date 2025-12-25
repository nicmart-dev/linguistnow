#!/bin/sh

# If REACT_APP_BACKEND_URL is not set, default to localhost
BACKEND_URL=${REACT_APP_BACKEND_URL:-http://localhost:5000}

echo "Starting Nginx..."
echo "Replacing __BACKEND_URL_PLACEHOLDER__ with $BACKEND_URL"

# Find all JS files and replace the placeholder with the actual runtime variable
find /usr/share/nginx/html -type f -name "*.js" -exec sed -i "s|__BACKEND_URL_PLACEHOLDER__|$BACKEND_URL|g" {} +

# Run Nginx
exec "$@"