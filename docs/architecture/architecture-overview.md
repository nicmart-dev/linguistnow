# Architecture Overview

This document provides a comprehensive overview of the LinguistNow application architecture, emphasizing component-based design, DRY (Don't Repeat Yourself) principles, and modern development practices.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Component Architecture](#component-architecture)
- [DRY Principles](#dry-principles)
- [Build System](#build-system)
- [Environment Configuration](#environment-configuration)

## Tech Stack

### Frontend

- **React 19** - Modern React with latest features
- **TypeScript** - Type-safe JavaScript with strict mode
- **Vite** - Fast build tool and dev server (migrated from Create React App)
- **Tailwind CSS v4** - Utility-first CSS framework with PostCSS
- **React Router v7** - Client-side routing
- **TanStack Table** - Powerful data table component
- **shadcn/ui** - High-quality component library built on Radix UI
- **i18next** - Internationalization (i18n) support
- **Vitest 4.0.16** - Fast unit test framework with happy-dom
- **Zod** - Runtime type validation

### Backend

- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe JavaScript with strict mode
- **Express.js** - Web application framework
- **ES Modules (ESM)** - Modern JavaScript module system
- **tsx** - TypeScript execution for Node.js
- **google-auth-library** - Google OAuth2 authentication
- **Vitest 4.0.16** - Fast unit test framework
- **Zod** - Runtime type validation

### Database & Services

- **Airtable** - Cloud-based database (user profiles only, no sensitive data)
- **HashiCorp Vault** - Secure token storage (self-hosted)
- **n8n** - Workflow automation for calendar availability checks
- **Google Calendar API** - Calendar integration

## Project Structure

```
linguistnow/
├── client/                 # React frontend application (TypeScript)
│   ├── src/
│   │   ├── components/     # Atomic Design component structure
│   │   │   ├── ui/         # Atoms - shadcn/ui primitives
│   │   │   │   ├── button.tsx
│   │   │   │   ├── button.test.tsx  # Co-located tests
│   │   │   │   └── ...
│   │   │   ├── molecules/  # Molecules - composite components
│   │   │   │   ├── DateInput.tsx
│   │   │   │   ├── DateInput.test.tsx
│   │   │   │   └── ...
│   │   │   ├── organisms/  # Organisms - feature components
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Navbar.test.tsx
│   │   │   │   └── ...
│   │   │   └── index.ts    # Barrel export for all layers
│   │   ├── pages/          # Route components (.tsx)
│   │   ├── auth-users/     # Authentication utilities (.ts)
│   │   ├── i18n/           # Internationalization (.ts/.tsx)
│   │   ├── lib/            # Shared utilities (.ts)
│   │   ├── utils/          # Application utilities (.ts)
│   │   ├── test/           # Test setup files
│   │   └── assets/         # Static assets
│   ├── public/             # Public assets
│   ├── vite.config.ts      # Vite configuration (TypeScript)
│   ├── vitest.config.ts    # Vitest configuration
│   ├── tsconfig.json       # TypeScript configuration
│   └── tailwind.config.js  # Tailwind CSS configuration
│
├── server/                  # Express backend (TypeScript + ESM)
│   ├── controllers/        # Request handlers (.ts)
│   ├── routes/             # API routes (.ts)
│   ├── server.ts           # Server entry point (TypeScript)
│   ├── env.ts              # Environment validation (Zod)
│   ├── vitest.config.ts    # Vitest configuration
│   └── tsconfig.json       # TypeScript configuration
│
├── shared/                  # Shared types package
│   ├── src/
│   │   ├── user.ts         # User-related types
│   │   ├── api.ts          # API request/response types
│   │   ├── calendar.ts     # Calendar-related types
│   │   └── index.ts        # Package exports
│   └── tsconfig.json       # TypeScript configuration
│
└── docs/                    # Documentation
```

## System Architecture

```mermaid
graph TB
    subgraph "Frontend (Vite + React)"
        A[React App] --> B[GoogleOAuthProvider]
        A --> C[LanguageProvider]
        A --> D[BrowserRouter]
        D --> E[Pages]
        E --> F[Components]
        F --> G[shadcn/ui]
    end

    subgraph "Backend (Express)"
        H[Express Server] --> I[Auth Controller]
        H --> J[Users Controller]
        H --> K[Calendar Controller]
        H --> T[Token Refresh Controller]
        H --> U[Token Refresh Utils]
    end

    subgraph "External Services"
        L[Google OAuth2]
        M[Google Calendar API]
        N[Airtable]
        O[n8n Workflow]
        V[HashiCorp Vault]
    end

    A -->|API Calls| H
    I -->|OAuth| L
    I -->|Write Tokens| V
    J -->|CRUD| N
    K -->|Calendar Data| M
    H -->|Availability Check| O
    O -->|Read Tokens| V
    O -->|Calendar Query| M
    T -->|Refresh Tokens| V
    T -->|OAuth| L
    U -->|Auto Refresh| K
    U -->|Validate Tokens| V

    style A fill:#61dafb
    style H fill:#90ee90
    style L fill:#4285f4
    style M fill:#4285f4
    style N fill:#ffb400
    style O fill:#ff6d5a
```

## Component Architecture

### Design Philosophy

The application follows an **Atomic Design** architecture with emphasis on:

1. **Reusability** - Components are designed to be reused across the application
2. **Composability** - Small, focused components that can be combined
3. **Separation of Concerns** - Clear boundaries between UI, logic, and data
4. **Maintainability** - Easy to understand and modify
5. **Atomic Design** - Components organized into atoms, molecules, and organisms

### Atomic Design Structure

Components are organized into three tiers following Brad Frost's Atomic Design methodology:

```text
client/src/components/
├── index.ts              # Barrel export for all layers
├── ui/                   # ATOMS - Basic building blocks (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   ├── calendar.tsx
│   ├── dialog.tsx
│   ├── popover.tsx
│   ├── select.tsx
│   ├── skeleton.tsx
│   ├── slider.tsx
│   ├── table.tsx
│   ├── tabs.tsx
│   └── command.tsx
├── molecules/            # MOLECULES - Composite components
│   ├── AvailabilityBadge.tsx
│   ├── DateInput.tsx
│   ├── DateRangePicker.tsx
│   └── RatingInput.tsx
└── organisms/            # ORGANISMS - Complex feature components
    ├── AvailabilitySettings.tsx
    ├── AvailabilityTimeline.tsx
    ├── BookingModal.tsx
    ├── CalendarSelector.tsx
    ├── DataTable.tsx
    ├── FilterBar.tsx
    ├── Footer.tsx
    ├── Hero.tsx
    ├── LinguistCard.tsx
    ├── LinguistProfileSettings.tsx
    ├── LinguistTable.tsx
    ├── Navbar.tsx
    └── ScrollToTop.tsx
```

### Component Hierarchy

```mermaid
graph TD
    A[App] --> B[GoogleOAuthProvider]
    A --> C[LanguageProvider]
    A --> D[BrowserRouter]

    D --> E[Navbar - Organism]
    D --> F[Routes]
    D --> Z[Footer - Organism]

    F --> G[Login Page]
    F --> H[Dashboard Page]
    F --> I[Account Settings]
    F --> J[Privacy Policy]

    H --> K[Hero - Organism]
    H --> L[FilterBar - Organism]
    H --> M[LinguistTable - Organism]
    H --> N[LinguistCard - Organism]

    M --> O[DataTable - Organism]
    O --> P[Table - Atom]
    O --> Q[Button - Atom]
    O --> R[Input - Atom]

    L --> S[DateRangePicker - Molecule]
    S --> T[DateInput - Molecule]
    S --> U[Calendar - Atom]

    N --> V[AvailabilityBadge - Molecule]
    N --> W[RatingInput - Molecule]

    I --> X[CalendarSelector - Organism]
    I --> Y[AvailabilitySettings - Organism]

    style A fill:#61dafb
    style B fill:#4285f4
    style C fill:#ff6d5a
    style P fill:#10b981
    style Q fill:#10b981
    style R fill:#10b981
    style T fill:#f59e0b
    style S fill:#f59e0b
    style V fill:#f59e0b
    style W fill:#f59e0b
```

### Component Layers

#### Atoms (`ui/`)

Basic building blocks - single-purpose components with no dependencies on other custom components:

| Component  | Purpose                                                       |
| ---------- | ------------------------------------------------------------- |
| `Button`   | Reusable button with variants (default, outline, ghost, etc.) |
| `Input`    | Form input component                                          |
| `Badge`    | Status/label badges                                           |
| `Calendar` | Date picker calendar                                          |
| `Dialog`   | Modal dialog primitives                                       |
| `Popover`  | Floating content panels                                       |
| `Select`   | Dropdown select component                                     |
| `Skeleton` | Loading state placeholder                                     |
| `Slider`   | Range slider input                                            |
| `Table`    | Table primitives (TableHeader, TableBody, TableRow, etc.)     |
| `Tabs`     | Tabbed interface                                              |
| `Command`  | Command palette/combobox                                      |

#### Molecules (`molecules/`)

Composite components combining atoms with specific functionality:

| Component           | Purpose                               | Composed of                             |
| ------------------- | ------------------------------------- | --------------------------------------- |
| `AvailabilityBadge` | Displays linguist availability status | Badge + icons                           |
| `DateInput`         | Date input with keyboard navigation   | Input fields                            |
| `DateRangePicker`   | Date range selection with presets     | Calendar + DateInput + Popover + Button |
| `RatingInput`       | Star rating with API integration      | Button + icons                          |

#### Organisms (`organisms/`)

Complex feature components with business logic:

| Component                 | Purpose                                                      |
| ------------------------- | ------------------------------------------------------------ |
| `Navbar`                  | Navigation bar with language selector                        |
| `Footer`                  | Application footer with links                                |
| `Hero`                    | Landing page hero section                                    |
| `DataTable`               | Full-featured data table with sorting, filtering, pagination |
| `FilterBar`               | Search filters for linguist search                           |
| `LinguistTable`           | Specialized table for linguist data                          |
| `LinguistCard`            | Card view of linguist with availability                      |
| `BookingModal`            | Booking confirmation dialog                                  |
| `CalendarSelector`        | Google Calendar selection interface                          |
| `AvailabilitySettings`    | Working hours configuration                                  |
| `AvailabilityTimeline`    | Visual availability timeline                                 |
| `LinguistProfileSettings` | Linguist profile form                                        |
| `ScrollToTop`             | Scroll to top button                                         |

### Component Patterns

#### 1. Compound Components

The Table component uses compound component pattern:

```jsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### 2. Component Variants

Buttons use `class-variance-authority` for type-safe variants:

```jsx
<Button variant="outline" size="sm">
  Click me
</Button>
```

#### 3. Forward Refs

Components use `React.forwardRef` for proper ref forwarding:

```jsx
const Input = React.forwardRef(({ className, ...props }, ref) => {
  // Component implementation
});
```

## DRY Principles

### Shared Utilities Architecture

```mermaid
graph LR
    subgraph "Shared Utilities"
        A[auth-users/utils.js]
        B[lib/utils.js]
    end

    subgraph "Components Using Utilities"
        C[Login Page]
        D[Dashboard]
        E[Account Settings]
        F[CalendarSelector]
    end

    A -->|isAccessTokenValid| C
    A -->|refreshAccessToken| C
    A -->|fetchUserDetails| C
    A -->|fetchUserList| D
    A -->|refreshAccessToken| D
    A -->|refreshAccessToken| E
    A -->|refreshAccessToken| F

    B -->|cn utility| G[All Components]
    G --> C
    G --> D
    G --> E
    G --> F

    style A fill:#ffd700
    style B fill:#ffd700
    style G fill:#90ee90
```

### Shared Utilities

#### Authentication Utilities (`client/src/auth-users/utils.js`)

Centralized authentication functions:

- `isAccessTokenValid()` - Validates Google OAuth tokens
- `refreshAccessToken()` - Refreshes expired tokens (server-side)
- `fetchUserDetails()` - Retrieves user from Airtable
- `fetchUserList()` - Gets all users
- `createUserIfNotFound()` - Creates new user on first login

**Benefits:**

- Single source of truth for auth logic
- Consistent error handling
- Easy to test and maintain

#### Utility Functions (`client/src/lib/utils.js`)

- `cn()` - Combines class names using `clsx` and `tailwind-merge`
- Ensures Tailwind classes are properly merged and deduplicated

#### Date Utilities (`client/src/utils/date-presets.ts`)

Date range preset calculations for DateRangePicker:

- `getPresetRange()` - Calculates date ranges for presets (next7, next14, next30, nextWeek, nextMonth)
- `getDateAdjustedForTimezone()` - Parses date strings adjusted for timezone
- `PRESETS` - Array of available date presets with i18n label keys

**Benefits:**

- Testable date calculations
- Consistent date range handling
- Locale-aware week start (Sunday/Monday)

#### Currency Utilities (`client/src/utils/currency.ts`)

Currency symbol and code management:

- `getCurrencySymbol()` - Gets currency symbol from ISO 4217 code
- `CURRENCIES` - Array of supported currencies with codes, symbols, and names

**Benefits:**

- Centralized currency definitions
- Consistent currency display across the app
- Easy to extend with new currencies

#### Shared Date Locale Utilities (`shared/src/date-locale.ts`)

Shared date and locale utilities for consistent date handling:

- `getWeekStartsOn()` - Determines first day of week based on locale (0=Sunday, 1=Monday)
- `getDateFnsLocale()` - Maps i18next locale codes to date-fns locale objects
- `DAY_NUMBERS` - Constants for day numbers (0-6)
- `DAY_NAMES` - Array of day names in English

**Benefits:**

- Consistent date handling across client and server
- Locale-aware date formatting
- Uses browser's Intl.Locale API when available

#### Server Token Refresh Utilities (`server/utils/tokenRefresh.ts`)

Automatic token refresh for Google OAuth tokens:

- `getValidAccessToken()` - Gets valid access token, refreshing if expired
- `withAutoRefresh()` - Executes function with automatic token refresh on expiration

**Benefits:**

- Prevents user disruption from expired tokens
- Automatic token management
- Retry logic for transient token expiration errors

### Path Aliases

Vite configuration provides clean import paths:

```javascript
// vite.config.js
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    'components': path.resolve(__dirname, './src/components'),
    'utils': path.resolve(__dirname, './src/lib/utils.js'),
  }
}
```

Usage:

```javascript
import { cn } from "@/lib/utils";
import Button from "components/Button";
```

### Reusable Patterns

1. **API Calls** - Centralized in utility functions
2. **Error Handling** - Consistent patterns across components
3. **Loading States** - Reusable Skeleton component
4. **Form Validation** - Shared validation logic
5. **Token Management** - Centralized in auth utilities

## Data Flow

```mermaid
graph LR
    subgraph "User Actions"
        A[Linguist Login]
        B[Select Calendars]
        C[PM Views Dashboard]
    end

    subgraph "Frontend"
        D[React Components]
        E[Auth Utils]
        F[API Calls]
    end

    subgraph "Backend"
        G[Express Routes]
        H[Controllers]
    end

    subgraph "Data Sources"
        I[Airtable]
        J[Google Calendar]
        K[n8n Workflow]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    D --> F
    F --> G
    G --> H
    H --> I
    H --> J
    H --> K
    K --> J
    I --> H
    J --> H
    H --> G
    G --> F
    F --> D

    style D fill:#61dafb
    style H fill:#90ee90
    style I fill:#ffb400
    style J fill:#4285f4
    style K fill:#ff6d5a
```

## Build System

### Vite Migration

The application was migrated from **Create React App** to **Vite** for:

- **Faster Development** - Instant HMR (Hot Module Replacement)
- **Better Performance** - Optimized builds with esbuild
- **Modern Tooling** - Native ES modules support
- **Smaller Bundle** - Tree-shaking and code splitting

### Build Flow

```mermaid
graph LR
    A[Source Code] --> B[Vite Dev Server]
    B --> C[HMR Updates]
    B --> D[Development Build]

    A --> E[Vite Build]
    E --> F[ESBuild Transform]
    F --> G[Tree Shaking]
    G --> H[Code Splitting]
    H --> I[Optimized Bundle]
    I --> J[Production Build]

    style B fill:#61dafb
    style E fill:#4fc08d
    style I fill:#ffd700
```

### Build Configuration

**Development:**

```bash
npm run dev  # Starts Vite dev server on port 3000
```

**Production:**

```bash
npm run build  # Creates optimized build in /build directory
```

### Tailwind CSS v4

Upgraded to Tailwind CSS v4 with:

- **PostCSS Integration** - Using `@tailwindcss/postcss` plugin
- **CSS Variables** - Theme customization via CSS variables
- **Improved Performance** - Faster compilation

## Environment Configuration

### Frontend Environment Variables

All frontend environment variables use `VITE_` prefix (Vite requirement):

```env
VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_API_URL=http://localhost:8080
```

Access in code:

```javascript
import.meta.env.VITE_GOOGLE_CLIENT_ID;
```

### Backend Environment Variables

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080
BACKEND_URL=http://localhost:8080
N8N_BASE_URL=http://localhost:5678
```

### Security Improvements

**Token Refresh on Server:**

- Client secret never exposed to frontend
- Token refresh handled server-side via `/api/auth/google/refresh`
- Secure credential management

## Best Practices

### Code Organization

1. **Feature-based structure** - Group related files together
2. **Barrel exports** - Use index files for clean imports
3. **Consistent naming** - PascalCase for components, camelCase for utilities

### Component Design

1. **Single Responsibility** - Each component has one clear purpose
2. **Props Interface** - Well-defined prop types
3. **Composition over Configuration** - Prefer composition patterns

### Performance

1. **Code Splitting** - Route-based lazy loading
2. **Memoization** - Use React.memo for expensive components
3. **Tree Shaking** - Only import what you need

## Type Safety

The project uses TypeScript with strict mode enabled for both client and server:

- **Shared Types**: `@linguistnow/shared` package provides type-safe API contracts
- **Runtime Validation**: Zod validates environment variables and API responses
- **Type Safety**: Full type coverage prevents runtime errors

See [TypeScript Guidelines](../development/typescript-guidelines.md) for detailed information.

## Testing

We follow Test-Driven Development (TDD) with Vitest 4.0.16:

- **Client Tests**: React components with `happy-dom` environment
- **Server Tests**: API endpoints with Node.js environment
- **Coverage**:
  - Client: ≥80% statements/branches/lines, ≥70% functions
  - Server: ≥90% statements/lines, ≥75% branches, ≥80% functions

See [Testing and TDD](../development/testing-and-tdd.md) for workflow and examples.

## Related Documentation

- [TypeScript Guidelines](../development/typescript-guidelines.md) - TypeScript best practices
- [Testing and TDD](../development/testing-and-tdd.md) - Test-driven development workflow
- [Component Design](../development/style-using-tailwind-css-framework.md) - UI components and styling
- [Authentication](../integrations/google-authentication.md) - OAuth2 implementation
- [Install Instructions](../getting-started/install-instructions.md) - Setup guide
