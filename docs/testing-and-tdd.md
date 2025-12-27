# Testing and TDD

This document describes the testing setup and Test-Driven Development (TDD) workflow for LinguistNow.

## Table of Contents

- [Overview](#overview)
- [Vitest Configuration](#vitest-configuration)
- [TDD Workflow](#tdd-workflow)
- [Writing Tests](#writing-tests)
- [Test Examples](#test-examples)
- [Coverage](#coverage)

## Overview

We use **Vitest** for testing both client and server code:

- **Client**: Vitest with jsdom environment for React components
- **Server**: Vitest with Node.js environment for API endpoints

## Vitest Configuration

### Client (`client/vitest.config.ts`)

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
```

### Server (`server/vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,spec}.ts"],
  },
});
```

## TDD Workflow

Follow the **Red-Green-Refactor** cycle:

### 1. Red: Write a Failing Test

Write a test that describes the desired behavior:

```typescript
// Button.test.tsx
describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

Run the test to confirm it fails:

```bash
pnpm --filter client test
```

### 2. Green: Make the Test Pass

Write the minimal code to make the test pass:

```typescript
// Button.tsx
export const Button = ({ children }: { children: React.ReactNode }) => {
  return <button>{children}</button>;
};
```

Run the test again to confirm it passes:

```bash
pnpm --filter client test
```

### 3. Refactor: Improve the Code

Refactor while keeping tests green:

```typescript
// Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline';
}

export const Button = ({ children, variant = 'default' }: ButtonProps) => {
  return <button className={cn(buttonVariants({ variant }))}>{children}</button>;
};
```

## Writing Tests

### React Component Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('border');
  });
});
```

### API Endpoint Tests

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import { getAll } from "./usersController";

describe("usersController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch all users", async () => {
    const req = {} as Request;
    const res = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    } as unknown as Response;

    await getAll(req, res);

    expect(res.json).toHaveBeenCalled();
  });
});
```

### Utility Function Tests

```typescript
import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });
});
```

## Test Examples

### Testing User Authentication

```typescript
import { describe, it, expect, vi } from "vitest";
import { fetchUserDetails } from "./utils";

describe("fetchUserDetails", () => {
  it("should fetch and map user details", async () => {
    const mockUser = {
      Email: "user@example.com",
      Name: "John Doe",
      Role: "Linguist",
    };

    vi.spyOn(axios, "get").mockResolvedValue({ data: mockUser });

    const setUserDetails = vi.fn();
    const user = await fetchUserDetails("user@example.com", setUserDetails);

    expect(user.email).toBe("user@example.com");
    expect(setUserDetails).toHaveBeenCalled();
  });
});
```

### Testing Error Handling

```typescript
describe("refreshAccessToken", () => {
  it("should throw error for invalid refresh token", async () => {
    vi.spyOn(axios, "post").mockRejectedValue({
      response: {
        data: {
          code: "INVALID_REFRESH_TOKEN",
          details: "Token expired",
        },
      },
    });

    await expect(refreshAccessToken("invalid")).rejects.toThrow();
  });
});
```

## Coverage

### Running Tests with Coverage

```bash
# Client
pnpm --filter client test -- --coverage

# Server
pnpm --filter server test -- --coverage
```

### Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Excluding Files from Coverage

Add to `vitest.config.ts`:

```typescript
test: {
  coverage: {
    exclude: [
      '**/*.test.ts',
      '**/*.spec.ts',
      '**/test/**',
    ],
  },
}
```

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// Good: Tests behavior
it("should display error message on failed login", () => {
  // ...
});

// Bad: Tests implementation details
it("should call setError with message", () => {
  // ...
});
```

### 2. Use Descriptive Test Names

```typescript
// Good
it("should return 404 when user is not found", () => {
  // ...
});

// Bad
it("should work", () => {
  // ...
});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it("should calculate total price", () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(30);
});
```

### 4. Mock External Dependencies

```typescript
import { vi } from "vitest";

vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));
```

### 5. Clean Up After Tests

```typescript
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
```

## Running Tests

### Watch Mode (Development)

```bash
# Client
pnpm --filter client test

# Server
pnpm --filter server test
```

### Single Run (CI)

```bash
# Client
pnpm --filter client test run

# Server
pnpm --filter server test run
```

### Specific Test File

```bash
pnpm --filter client test Button.test.tsx
```

## Related Documentation

- [TypeScript Guidelines](./typescript-guidelines.md) - TypeScript best practices
- [Architecture Overview](./architecture-overview.md) - Project architecture
