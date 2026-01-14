# Testing and TDD

This document describes the testing setup and Test-Driven Development (TDD) workflow for LinguistNow.

## Table of Contents

- [Overview](#overview)
- [Test File Organization](#test-file-organization)
- [Vitest Configuration](#vitest-configuration)
- [TDD Workflow](#tdd-workflow)
- [Writing Tests](#writing-tests)
- [Test Examples](#test-examples)
- [Coverage](#coverage)

## Overview

We use **Vitest 4.0.16** for testing both client and server code:

- **Client**: Vitest with `happy-dom` environment for React components
- **Server**: Vitest with Node.js environment for API endpoints

Both packages use `@vitest/coverage-v8` for code coverage reporting.

## Test File Organization

Tests are **co-located** with their source files following Atomic Design structure:

```
client/src/components/
├── ui/                         # Atoms
│   ├── button.tsx
│   ├── button.test.tsx         ✅ Co-located
│   ├── input.tsx
│   ├── input.test.tsx          ✅ Co-located
│   ├── skeleton.tsx
│   ├── skeleton.test.tsx       ✅ Co-located
│   ├── table.tsx
│   └── table.test.tsx          ✅ Co-located
├── molecules/                  # Molecules
│   ├── DateInput.tsx
│   ├── DateInput.test.tsx      ✅ Co-located
│   ├── RatingInput.tsx
│   └── RatingInput.test.tsx    ✅ Co-located
└── organisms/                  # Organisms
    ├── Footer.tsx
    ├── Footer.test.tsx         ✅ Co-located
    ├── Hero.tsx
    ├── Hero.test.tsx           ✅ Co-located
    ├── Navbar.tsx
    └── Navbar.test.tsx         ✅ Co-located
```

### Benefits of Co-location

1. **Discoverability** - Tests are easy to find next to their source
2. **Maintenance** - Moving a component moves its tests automatically
3. **Context** - Related code stays together
4. **Import paths** - Shorter, cleaner import statements

## Vitest Configuration

### Client (`client/vitest.config.ts`)

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 70,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Server (`server/vitest.config.ts`)

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,spec}.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        statements: 90,
        branches: 75,
        functions: 80,
        lines: 90,
      },
    },
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
pnpm --filter ./client test
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
pnpm --filter ./client test
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

Tests are co-located with components. Use `@/` path aliases for imports:

```typescript
// client/src/components/ui/button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeDefined();
  });

  it('applies variant classes', () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    const button = container.querySelector('button');
    expect(button?.className).toContain('border');
  });
});
```

For components requiring i18n or routing providers:

```typescript
// client/src/components/organisms/Footer.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18nInstance from '@/i18n';
import { Footer } from '@/components/organisms';

const renderWithProviders = (component: React.ReactNode) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18nInstance}>{component}</I18nextProvider>
    </BrowserRouter>
  );
};

describe('Footer', () => {
  it('renders footer element', () => {
    renderWithProviders(<Footer />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeDefined();
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

### Testing Currency Utilities

```typescript
import { describe, it, expect } from "vitest";
import { CURRENCIES, getCurrencySymbol } from "./currency";

describe("currency utilities", () => {
  it("should return symbol for valid currency code", () => {
    expect(getCurrencySymbol("USD")).toBe("$");
    expect(getCurrencySymbol("EUR")).toBe("€");
  });

  it("should be case-insensitive", () => {
    expect(getCurrencySymbol("usd")).toBe("$");
    expect(getCurrencySymbol("EUR")).toBe("€");
  });

  it("should return code itself for unknown currency", () => {
    expect(getCurrencySymbol("XYZ")).toBe("XYZ");
  });
});
```

### Testing Date Presets

```typescript
import { describe, it, expect } from "vitest";
import { getPresetRange, PRESETS } from "./date-presets";

describe("date-presets utilities", () => {
  const referenceDate = new Date(2026, 0, 3); // Saturday, January 3, 2026

  it("should return range for next7 preset", () => {
    const range = getPresetRange("next7", 0, referenceDate);
    expect(range.from.getDate()).toBe(4); // Tomorrow
    expect(range.to?.getDate()).toBe(10); // 7 days from today
  });

  it("should handle week start preferences", () => {
    const sundayStart = getPresetRange("nextWeek", 0, referenceDate);
    const mondayStart = getPresetRange("nextWeek", 1, referenceDate);
    expect(sundayStart.from.getDay()).toBe(0); // Sunday
    expect(mondayStart.from.getDay()).toBe(1); // Monday
  });
});
```

### Testing Token Refresh Utilities

```typescript
import { describe, it, expect, vi } from "vitest";
import { getValidAccessToken, withAutoRefresh } from "./tokenRefresh";
import * as vaultClient from "./vaultClient";

vi.mock("./vaultClient");

describe("tokenRefresh utilities", () => {
  it("should return valid access token when token is still valid", async () => {
    vi.mocked(vaultClient.readToken).mockResolvedValue({
      accessToken: "valid-token",
      refreshToken: "refresh-token",
    });
    vi.mocked(axios.get).mockResolvedValue({
      status: 200,
      data: { expires_in: 3600 },
    });

    const result = await getValidAccessToken("user@example.com");
    expect(result).toBe("valid-token");
  });

  it("should refresh token when expired", async () => {
    // Mock expired token scenario
    vi.mocked(vaultClient.readToken).mockResolvedValue({
      accessToken: "expired-token",
      refreshToken: "refresh-token",
    });
    vi.mocked(axios.get).mockResolvedValue({ status: 401 });

    // Mock OAuth2Client refresh
    const mockOAuth2Client = {
      setCredentials: vi.fn(),
      refreshAccessToken: vi.fn().mockResolvedValue({
        credentials: { access_token: "new-token" },
      }),
    };
    vi.mocked(OAuth2Client).mockImplementation(() => mockOAuth2Client as any);

    const result = await getValidAccessToken("user@example.com");
    expect(result).toBe("new-token");
  });
});
```

### Testing React Components with User Interactions

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateInput } from "./DateInput";

describe("DateInput", () => {
  it("should update date on valid input", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const initialDate = new Date(2026, 0, 15);

    render(<DateInput value={initialDate} onChange={onChange} />);

    const dayInput = screen.getByPlaceholderText("D");
    await user.clear(dayInput);
    await user.type(dayInput, "20");

    expect(onChange).toHaveBeenCalled();
    const newDate = onChange.mock.calls[0][0];
    expect(newDate.getDate()).toBe(20);
  });

  it("should handle arrow key navigation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const initialDate = new Date(2026, 0, 15);

    render(<DateInput value={initialDate} onChange={onChange} />);

    const monthInput = screen.getByPlaceholderText("M");
    monthInput.focus();
    await user.keyboard("{ArrowUp}");

    expect(onChange).toHaveBeenCalled();
    const newDate = onChange.mock.calls[0][0];
    expect(newDate.getMonth()).toBe(1); // February
  });
});
```

### Testing Components with API Calls

```typescript
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import RatingInput from "./RatingInput";

vi.mock("axios");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("RatingInput", () => {
  it("should update rating on star click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    vi.mocked(axios.patch).mockResolvedValue({
      data: { rating: 4 },
    });

    render(
      <RatingInput
        rating={2}
        linguistEmail="test@example.com"
        onRatingChange={onChange}
      />
    );

    const stars = screen.getAllByRole("button");
    await user.click(stars[3]); // Click 4th star

    await waitFor(() => {
      expect(axios.patch).toHaveBeenCalledWith(
        expect.stringContaining("/api/linguists/test@example.com/rating"),
        { rating: 4 }
      );
    });
  });
});
```

## Coverage

### Running Tests with Coverage

```bash
# Client
pnpm --filter ./client test -- --coverage

# Server
pnpm --filter ./server test -- --coverage
```

### Coverage Goals

**Client:**

- **Statements**: ≥ 80%
- **Branches**: ≥ 65% (lower threshold due to complex UI component conditionals)
- **Functions**: ≥ 75%
- **Lines**: ≥ 80%

**Server:**

- **Statements**: ≥ 90%
- **Branches**: ≥ 75%
- **Functions**: ≥ 80%
- **Lines**: ≥ 90%

### Excluding Files from Coverage

Coverage exclusions are configured in `vitest.config.ts` for each package:

**Client exclusions:**
- `src/components/ui/**` - UI primitives tested implicitly through component tests
- `src/components/**/index.ts` - Barrel exports with no logic
- `src/pages/**` - Pages tested via E2E/integration tests
- `src/auth-users/**` - Auth utilities tested via integration
- Complex organisms with heavy integrations (tested via E2E):
  - `AvailabilitySettings`, `AvailabilityTimeline`, `BookingModal`
  - `CalendarSelector`, `DataTable`, `FilterBar`
  - `LinguistCard`, `LinguistProfileSettings`, `LinguistTable`

**Server exclusions:**
- Test files, config files, and entry points tested via integration

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
pnpm --filter ./client test

# Server
pnpm --filter ./server test
```

### Single Run (CI)

```bash
# Client
pnpm --filter ./client test:run

# Server
pnpm --filter ./server test:run
```

### Specific Test File

```bash
# Test a specific file by name pattern
pnpm --filter ./client test button.test.tsx

# Test all tests in a directory
pnpm --filter ./client test src/components/ui/

# Test molecules
pnpm --filter ./client test src/components/molecules/

# Test organisms
pnpm --filter ./client test src/components/organisms/
```

## Related Documentation

- [TypeScript Guidelines](./typescript-guidelines.md) - TypeScript best practices
- [Architecture Overview](../architecture/architecture-overview.md) - Project architecture
