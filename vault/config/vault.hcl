# Vault Configuration File
# For production mode, uncomment and configure these settings

# Storage backend (file storage for simplicity)
# For production, consider using Consul, etcd, or cloud storage
storage "file" {
  path = "/vault/data"
}

# API listener
listener "tcp" {
  address     = "0.0.0.0:8200"
  tls_disable = 1  # Enable TLS in production with proper certificates
}

# UI
ui = true

# Logging
log_level = "INFO"
log_format = "json"

# Default lease TTL
default_lease_ttl = "168h"  # 7 days

# Maximum lease TTL
max_lease_ttl = "720h"  # 30 days

