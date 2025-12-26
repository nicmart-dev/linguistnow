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

- [Install Instructions](./install-instructions.md) - Setup guide for local development
- [Set up OAuth in Google Cloud](./set-up-oauth-in-google-cloud.md) - Google OAuth configuration

### Software Design Documents

#### Architecture

- [Architecture Overview](./architecture-overview.md) - Component-based design, DRY principles, and modern architecture

#### API

- [API Documentation](./api-documentation.md) - Interactive OpenAPI/Swagger documentation

#### Authentication and Google APIs

- [Google Authentication](./google-authentication.md) - Authentication implementation details
- [Integration of Google Calendar API](./integration-of-google-calendar-api.md) - Calendar API integration

#### Localization

- [Internationalization using react-intl package](./internationalization-using-react-intl-package.md) - i18n implementation

#### n8n Workflow

- [n8n workflow integration](./n8n-workflow-integration.md) - Workflow automation setup

#### Database

- [Store user data in Airtable](./store-user-data-in-airtable.md) - Database structure and usage

#### UI

- [Style using Tailwind CSS framework](./style-using-tailwind-css-framework.md) - UI styling approach

### User Experience

- [Sitemap and user journey](./sitemap-and-user-journey.md) - User flows and screenshots

### Deployment

- [Deploy app to production](./deploy-app-to-production.md) - Production deployment guide for Synology NAS with Portainer

### Docker

The application is fully containerized with Docker:

- `docker-compose.yml` - Complete stack configuration
- `example.env` - Environment variables template for Docker deployment
- See the [deployment guide](./deploy-app-to-production.md) for detailed instructions
