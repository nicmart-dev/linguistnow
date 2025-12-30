#!/bin/bash
# Vault Initialization Script
# This script sets up HashiCorp Vault for LinguistNow token storage
#
# Usage:
#   docker exec linguistnow-vault vault operator init -key-shares=1 -key-threshold=1
#   OR for dev mode: This script runs automatically

set -e

echo "Initializing HashiCorp Vault for LinguistNow..."

# Check if Vault is running
if ! vault status > /dev/null 2>&1; then
  echo "Error: Vault is not running or not accessible"
  exit 1
fi

# Enable KV secrets engine v2 at path 'secret'
echo "Enabling KV secrets engine v2..."
vault secrets enable -version=2 -path=secret kv || echo "KV secrets engine already enabled"

# Create policy for Express backend (read-write access)
echo "Creating Express backend policy..."
vault policy write linguistnow-backend - <<EOF
# Allow read/write access to token storage
path "secret/data/linguistnow/tokens/*" {
  capabilities = ["create", "read", "update", "delete"]
}

# Allow list access to token directory
path "secret/metadata/linguistnow/tokens/*" {
  capabilities = ["list", "read"]
}

# Allow list access to parent directory
path "secret/metadata/linguistnow" {
  capabilities = ["list"]
}
EOF

# Create policy for n8n (read-only access)
echo "Creating n8n read-only policy..."
vault policy write linguistnow-n8n - <<EOF
# Allow read access to token storage
path "secret/data/linguistnow/tokens/*" {
  capabilities = ["read"]
}

# Allow list access to token directory
path "secret/metadata/linguistnow/tokens/*" {
  capabilities = ["list"]
}
EOF

echo "Vault initialization complete!"
echo ""
echo "Next steps:"
echo "1. Generate tokens for services:"
echo "   vault token create -policy=linguistnow-backend -ttl=0"
echo "   vault token create -policy=linguistnow-n8n -ttl=0"
echo ""
echo "2. Set tokens as environment variables:"
echo "   VAULT_TOKEN=<backend-token> (for Express)"
echo "   VAULT_N8N_TOKEN=<n8n-token> (for n8n credential)"

