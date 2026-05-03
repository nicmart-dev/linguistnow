# Integration Guides

This directory contains guides for integrating and configuring external services used by LinguistNow.

## Available Integrations

### Authentication & Authorization

- **[Google Authentication](./google-authentication.md)** - Google OAuth 2.0 setup and configuration
- **[Vault Integration](./vault-integration-guide.md)** - HashiCorp Vault for secrets management

### Data Storage

- **[Airtable](./store-user-data-in-airtable.md)** - User data storage and schema
- **[Redis](./redis-setup.md)** - FX rate caching and persistence

### External APIs

- **[Google Calendar API](./integration-of-google-calendar-api.md)** - Calendar availability checking
- **[Frankfurter](./frankfurter-setup.md)** - ECB exchange rates for currency conversion

### Automation

- **[n8n Workflows](./n8n-workflow-integration.md)** - Scheduled tasks and automation

## Quick Links

### New Integrations

- **Redis**: See [Redis Setup](./redis-setup.md) for configuration and troubleshooting
- **Frankfurter**: See [Frankfurter Setup](./frankfurter-setup.md) for FX rates API configuration

### Testing

For testing currency conversion features, see:

- [Testing and TDD](../development/testing-and-tdd.md#currency-feature-testing)
- [Currency Conversion Architecture](../architecture/currency-conversion.md)
