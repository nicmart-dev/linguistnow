# LinguistNow

> Simplifying the hassle of finding available linguists for translation projects.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [About](#about)

## Overview

### The Problem

Linguists (freelance translators) often work with multiple translation agencies or language service providers (LSPs). Managing availability across all clients is challenging:

- They manually enter availability in multiple systems
- They must remember to notify each client about holidays
- Availability quickly becomes outdated without a single source of truth
- Some linguists accept work before checking their calendar, causing delays when conflicts arise

📽️ See the 3-minute pitch [slides](https://www.canva.com/design/DAGH8QYv9D0/ErSLJJqaQy9WQG6f6aKHWQ/view)

### The Solution

LinguistNow connects to linguists' Google Calendars to provide real-time availability information to project managers, eliminating manual availability tracking.

### User Profiles

- **Project Managers** - Add linguists and instantly see who's available for translation projects
- **Linguists** - Connect their Google Calendar once and let availability sync automatically

## Features

| Feature                     | Description                                                                   |
| --------------------------- | ----------------------------------------------------------------------------- |
| 🔐 **Authentication**       | Secure Google OAuth2 login with role-based access control                     |
| 📅 **Calendar Integration** | Real-time availability from Google Calendar                                   |
| 👥 **Linguist Management**  | CRUD operations for managing linguist profiles                                |
| 🌍 **Internationalization** | Support for 11 languages including English, French, Spanish, German, and more |
| 🔒 **Secure Token Storage** | OAuth tokens stored in HashiCorp Vault                                        |

## Installation

Follow the [Installation Guide](./docs/install-instructions.md) to set up the application locally.

For Docker deployment, see [Deploy Locally with Docker](./docs/deploy-local-docker.md).

## Tech Stack

### Frontend

- React 19 with Vite
- React Router v7
- Tailwind CSS v4
- shadcn/ui components
- TanStack Table
- i18next for internationalization

### Backend

- Node.js with Express.js
- TypeScript (strict mode)
- HashiCorp Vault for secure token storage
- n8n for scheduled token refresh

### External Services

- **Database**: Airtable
- **Authentication**: Google OAuth2
- **Calendar API**: Google Calendar freeBusy API

### Deployment

- **Frontend**: Netlify
- **Backend**: Render
- **Infrastructure**: Docker Compose

## Architecture

```
linguistnow/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── i18n/     # Internationalization
│   └── public/
├── server/           # Express backend
│   ├── controllers/
│   ├── services/     # Business logic
│   ├── routes/
│   └── utils/
├── shared/           # Shared TypeScript types
├── n8n/              # Workflow automation configs
├── docs/             # Documentation
└── docker-compose.yml
```

**Design Principles**: Component-based design with DRY principles, API-first development, and TDD.

See [Architecture Overview](./docs/architecture-overview.md) for details.

## Documentation

| Document                                                                    | Description                  |
| --------------------------------------------------------------------------- | ---------------------------- |
| [Install Instructions](./docs/install-instructions.md)                      | Local development setup      |
| [Architecture Overview](./docs/architecture-overview.md)                    | System architecture          |
| [Dashboard Design](./docs/dashboard-design.md)                              | Dashboard feature design     |
| [Linguist Settings Design](./docs/linguist-settings-design.md)              | Settings page feature design |
| [Google Calendar Integration](./docs/integration-of-google-calendar-api.md) | Calendar API implementation  |
| [Vault Integration](./docs/vault-integration-guide.md)                      | Secure token storage         |
| [Airtable Data Structure](./docs/store-user-data-in-airtable.md)            | Database schema              |
| [User Journey & Sitemap](./docs/sitemap-and-user-journey.md)                | UX documentation             |
| [Google Authentication](./docs/google-authentication.md)                    | OAuth2 flow                  |

## Roadmap

Track progress on the [GitHub Project Board](https://github.com/users/nicmart-dev/projects/1/views/6).

### Planned Features

- Multi-calendar provider support (Outlook, Apple Calendar, Calendly)
- Bulk availability checking
- Advanced timezone handling
- Email notifications

See the [backlog](https://github.com/users/nicmart-dev/projects/1/views/8) for the complete list.

## About

This capstone project was developed by **Nicolas Martinez** as part of the Web Development Diploma Program at BrainStation.

With 20+ years in the Localization & Translation industry and 7 years as a Technical Product Manager, this project combines domain expertise with modern development practices.

---

## License

MIT
