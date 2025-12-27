# TypeScript Guidelines

This document provides guidelines and best practices for working with TypeScript in the LinguistNow project.

## Table of Contents

- [Configuration](#configuration)
- [Strict Mode](#strict-mode)
- [Shared Types](#shared-types)
- [Path Aliases](#path-aliases)
- [Common Patterns](#common-patterns)
- [Best Practices](#best-practices)

## Configuration

### Client (`client/tsconfig.json`)

The client uses TypeScript with strict mode enabled:

- **Target**: ES2022
- **Module**: ESNext (ES Modules)
- **JSX**: react-jsx
- **Module Resolution**: bundler (for Vite)
- **Strict**: true

### Server (`server/tsconfig.json`)

The server uses TypeScript with Node.js ESM:

- **Target**: ES2022
- **Module**: NodeNext
- **Module Resolution**: NodeNext
- **Strict**: true
- **OutDir**: ./dist

## Strict Mode

Strict mode is enabled globally, which includes:

- `noImplicitAny`: Prevents implicit `any` types
- `strictNullChecks`: Ensures null/undefined safety
- `strictFunctionTypes`: Stricter function type checking
- `strictPropertyInitialization`: Ensures class properties are initialized
- `noImplicitThis`: Prevents implicit `this` usage
- `alwaysStrict`: Parses in strict mode

### Benefits

- Catches errors at compile time
- Better IDE autocomplete and IntelliSense
- Self-documenting code
- Easier refactoring

## Shared Types

We use a shared types package (`@linguistnow/shared`) for type-safe API contracts between client and server.

### Usage

```typescript
import type { User, ApiResponse } from "@linguistnow/shared";

// Client
const user: User = {
  id: "user@example.com",
  email: "user@example.com",
  name: "John Doe",
  role: "Linguist",
};

// Server
const response: ApiResponse<User> = {
  success: true,
  data: user,
};
```

### Adding New Types

1. Add types to `shared/src/` (e.g., `shared/src/user.ts`)
2. Export from `shared/src/index.ts`
3. Use in both client and server

## Path Aliases

### Client

```typescript
// Instead of
import { cn } from "../../../lib/utils";

// Use
import { cn } from "@/lib/utils";
```

Configured in `client/tsconfig.json`:

```json
{
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

### Server

Use relative imports with `.js` extension (ESM requirement):

```typescript
import { env } from "./env.js";
import authRoutes from "./routes/authRoutes.js";
```

## Common Patterns

### Type Guards

```typescript
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === "object" && obj !== null && "email" in obj && "name" in obj
  );
}
```

### Error Handling

```typescript
try {
  // ...
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error("Unknown error:", error);
  }
}
```

### Axios Error Handling

```typescript
import axios from "axios";

try {
  const response = await axios.get<User>("/api/users");
} catch (error: unknown) {
  if (axios.isAxiosError(error)) {
    console.error("Axios error:", error.response?.status);
  }
}
```

### React Component Props

```typescript
interface ButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant, size, children }) => {
  // ...
};
```

### Express Route Handlers

```typescript
import type { Request, Response } from "express";

interface CreateUserRequest {
  email: string;
  name: string;
}

export const createUser = async (
  req: Request<{}, {}, CreateUserRequest>,
  res: Response,
) => {
  const { email, name } = req.body;
  // ...
};
```

## Best Practices

### 1. Use `type` for Aliases, `interface` for Objects

```typescript
// Use type for unions, intersections, primitives
type UserRole = "Project Manager" | "Linguist";
type UserWithRole = User & { role: UserRole };

// Use interface for object shapes
interface User {
  id: string;
  email: string;
}
```

### 2. Prefer Explicit Return Types

```typescript
// Good
function getUser(id: string): Promise<User> {
  // ...
}

// Avoid
function getUser(id: string) {
  // ...
}
```

### 3. Use `const` Assertions for Literal Types

```typescript
const roles = ["Project Manager", "Linguist"] as const;
type Role = (typeof roles)[number]; // 'Project Manager' | 'Linguist'
```

### 4. Avoid `any`, Use `unknown` Instead

```typescript
// Bad
function process(data: any) {
  // ...
}

// Good
function process(data: unknown) {
  if (typeof data === "string") {
    // TypeScript knows data is string here
  }
}
```

### 5. Use Generics for Reusable Types

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const userResponse: ApiResponse<User> = {
  success: true,
  data: user,
};
```

### 6. Environment Variables

Use Zod for runtime validation:

```typescript
// client/src/env.ts
import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
});

export const env = envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
});
```

## Related Documentation

- [Testing and TDD](./testing-and-tdd.md) - Test-driven development workflow
- [Architecture Overview](./architecture-overview.md) - Project architecture
