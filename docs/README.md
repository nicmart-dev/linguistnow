# LinguistNow Documentation

Welcome to the LinguistNow documentation! This folder contains all project documentation, migrated from the GitHub wiki.

## Project Overview

**LinguistNow** simplifies finding available linguists for translation projects by integrating with Google Calendar to check real-time availability.

📊 [View the 3-minute pitch slides](https://www.canva.com/design/DAGH8QYv9D0/ErSLJJqaQy9WQG6f6aKHWQ/view?utm_content=DAGH8QYv9D0)

## Viewing Mermaid Diagrams

**Note:** Documentation includes Mermaid diagrams for visual representation of architecture, flows, and component hierarchies.

### Online Viewing

- **GitHub**: Mermaid diagrams render automatically when viewing files on GitHub
- **GitHub Pages**: If deployed, diagrams will render automatically

### Local Viewing

If Mermaid diagrams don't render in your local markdown preview:

**VS Code / Cursor:**

1. Install the [Markdown Preview Mermaid Support](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) extension
2. Or use the [Markdown Preview Enhanced](https://marketplace.visualstudio.com/items?itemName=shd101wyy.markdown-preview-enhanced) extension

**Other Options:**

- View files directly on GitHub
- Use online Mermaid editors: [Mermaid Live Editor](https://mermaid.live/)
- Use tools like [Obsidian](https://obsidian.md/) or [Typora](https://typora.io/) which support Mermaid natively

## Table of Contents

### Getting Started

- [Install Instructions](./getting-started/install-instructions.md) - Setup guide for local development
- [Sitemap and User Journey](./getting-started/sitemap-and-user-journey.md) - User flows and screenshots

### Architecture

- [Architecture Overview](./architecture/architecture-overview.md) - Component-based design, DRY principles, and modern architecture
- [Dashboard Design](./architecture/dashboard-design.md) - Comprehensive design document for the Project Manager Dashboard
- [Linguist Settings Design](./architecture/linguist-settings-design.md) - Comprehensive design document for the Linguist Settings Page
- [Currency Support](./architecture/currency-support.md) - Multi-currency support and future exchange rate integration
- [Email Language Policy](./architecture/email-language-policy.md) - English-only email policy and rationale

### API

- [API Documentation](./api/api-documentation.md) - Interactive OpenAPI/Swagger documentation

### Integrations

- [Google Authentication](./integrations/google-authentication.md) - Google OAuth setup, authentication implementation, and token management
- [Integration of Google Calendar API](./integrations/integration-of-google-calendar-api.md) - Calendar API integration
- [n8n Workflow Integration](./integrations/n8n-workflow-integration.md) - Workflow automation setup
- [Vault Integration Guide](./integrations/vault-integration-guide.md) - HashiCorp Vault setup and token storage
- [Store User Data in Airtable](./integrations/store-user-data-in-airtable.md) - Database structure and usage (includes manual field creation appendix)

### Development

- [AI IDE Setup](./development/ai-ide-setup.md) - Use Cursor, VS Code + Gemini Code Assist, or both
- [TypeScript Guidelines](./development/typescript-guidelines.md) - TypeScript best practices
- [Testing and TDD](./development/testing-and-tdd.md) - Test-driven development workflow, Vitest configuration, and test examples
- [Style using Tailwind CSS Framework](./development/style-using-tailwind-css-framework.md) - UI styling approach and implementation
- [Internationalization using i18next](./development/internationalization-using-i18next.md) - i18n implementation
- [Automated Code Reviews using CodeRabbit](./development/automated-code-reviews-using-coderabbit.md) - Code review automation setup

### Deployment

- [Deploy App to Production](./deployment/deploy-app-to-production.md) - Production deployment guide for Synology NAS with Portainer
- [PWA Installation](./deployment/PWA-Installation.md) - Progressive Web App installation guide

### Plans

Feature and improvement plans are managed as Cursor plans with task tracking in [`.cursor/plans/`](../.cursor/plans/).

### Docker

The application is fully containerized with Docker:

- `docker-compose.yml` - Complete stack configuration
- `example.env` - Environment variables template for Docker deployment
- See the [deployment guide](./deployment/deploy-app-to-production.md) for detailed instructions
