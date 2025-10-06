# Patterns and Conventions

Coding standards and architectural patterns for Forms Platform.

## TypeScript Conventions

### Type System
- Strict TypeScript mode enabled (`"strict": true`)
- Use NodeNext module resolution
- Prefer type inference when possible
- Explicitly type function parameters and return values
- Use `type` for object types, `interface` for extensible contracts

```typescript
// Good - explicit parameter and return types
export function getForm(ctx: Context, id: string): Promise<Result<Form>> {
  // implementation
}

// Good - type alias for object shape
export type InputPattern = {
  type: 'input';
  id: string;
  data: InputData;
};

// Good - interface for extensible contract
export interface PatternConfig<P, O> {
  displayName: string;
  initial: P['data'];
  parseUserInput: (input: string) => Result<O>;
}
```

### Imports and Exports

**Use named exports** (see ADR 0017)
```typescript
// Good
export function FormManager() { ... }
export type FormData = { ... };

// Avoid (except for single-purpose files)
export default function FormManager() { ... }
```

**Import style**
```typescript
// Good - named imports
import { getForm, saveForm } from './repository';
import { type Blueprint, type Pattern } from './types';

// Use `type` modifier for type-only imports
import { type Context } from './context';
```

**File organization**
- Avoid `index.ts` barrel files - use descriptive filenames
- Exception: Package entry points (`packages/*/src/index.ts`)
- Co-locate related files (tests, types, utilities)

```
patterns/input/
  ├── config.ts          # Pattern configuration types
  ├── prompt.ts          # Prompt generation logic
  ├── response.ts        # Response parsing logic
  ├── builder.ts         # Builder utility
  └── index.ts           # Pattern export (PatternConfig)
```

### Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Variables | camelCase | `const userName = 'alice'` |
| Functions | camelCase | `function parseInput() {}` |
| Classes | PascalCase | `class FormManager {}` |
| Types/Interfaces | PascalCase | `type UserData = {}` |
| Components | PascalCase | `function FormInput() {}` |
| Constants | UPPER_SNAKE_CASE | `const MAX_FILE_SIZE = 1024` |
| Files | kebab-case | `form-manager.ts` |
| Folders | kebab-case | `user-authentication/` |
| Packages | kebab-case | `@flexion/forms-design` |
| Test files | `*.test.ts(x)` | `form-manager.test.ts` |

## Architecture Patterns

### Pattern System

Patterns are the building blocks of forms. Each pattern follows this structure:

```typescript
// Pattern type definition
export type InputPattern = {
  type: 'input';        // Pattern type identifier
  id: string;           // Unique instance ID
  data: {               // Pattern-specific configuration
    label: string;
    hint: string;
    initial: string;
    required: boolean;
  };
};
```

**Pattern configuration** exports a `PatternConfig` object:
```typescript
export const inputConfig: PatternConfig<InputPattern, InputPatternOutput> = {
  displayName: 'Short answer',
  iconPath: 'short-answer-icon.svg',
  initial: {
    label: 'Question text',
    hint: '',
    initial: '',
    required: false,
  },
  parseUserInput,       // Parse user response
  parseConfigData,      // Validate pattern data
  getChildren,          // Return child patterns
  createPrompt,         // Generate UI prompt
};
```

**Pattern file structure:**
- `config.ts` - Type definitions and validation
- `prompt.ts` - UI prompt generation
- `response.ts` - User input parsing
- `index.ts` - PatternConfig export

### Service Layer Pattern

Services encapsulate business logic and coordinate between layers:

```typescript
// Service function signature
export async function getForm(
  ctx: FormServiceContext,
  formId: string
): Promise<Result<Blueprint | null>> {
  // 1. Validate input
  // 2. Call repository layer
  // 3. Transform data
  // 4. Return result
}
```

**Context pattern** for dependency injection:
```typescript
export type FormServiceContext = {
  db: DatabaseContext;
  formConfig: FormConfig;
};

// Usage
const result = await getForm(
  { db: dbContext, formConfig: defaultFormConfig },
  'form-id'
);
```

### Repository Pattern

Repository layer handles database operations:

```typescript
export async function getForm(
  ctx: DatabaseContext,
  id: string
): Promise<Result<Form | null>> {
  const kysely = await ctx.getKysely();
  const row = await kysely
    .selectFrom('forms')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();

  return { success: true, data: row ? parseForm(row) : null };
}
```

### Result Pattern

Use Result type for operations that can fail:

```typescript
// Success result
return { success: true, data: form };

// Error result
return {
  success: false,
  error: {
    type: 'validation-error',
    message: 'Invalid form data'
  }
};

// Handling results
const result = await getForm(ctx, id);
if (!result.success) {
  console.error(result.error);
  return;
}
const form = result.data;
```

## Testing Patterns

### Unit Tests

Co-locate tests with source code using `*.test.ts` suffix:

```typescript
import { expect, it, describe } from 'vitest';
import { parseInput } from './input';

describe('parseInput', () => {
  it('parses valid input', () => {
    const result = parseInput('hello');
    expect(result).toEqual({ success: true, data: 'hello' });
  });

  it('rejects empty input', () => {
    const result = parseInput('');
    expect(result.success).toBe(false);
  });
});
```

### Database Tests

Use `describeDatabase` for testing database operations against both SQLite and PostgreSQL:

```typescript
import { expect, it } from 'vitest';
import { type DbTestContext, describeDatabase } from '@flexion/forms-database/testing';

describeDatabase('getForm', () => {
  it<DbTestContext>('retrieves form successfully', async ({ db }) => {
    const kysely = await db.ctx.getKysely();

    // Setup test data
    await kysely.insertInto('forms').values({
      id: 'test-id',
      data: JSON.stringify(testForm),
    }).execute();

    // Test the function
    const result = await getForm({ db: db.ctx }, 'test-id');
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests

Use in-memory database for business logic integration tests:

```typescript
import { createInMemoryDatabaseContext } from '@flexion/forms-database/context';

it('creates and retrieves form', async () => {
  const db = await createInMemoryDatabaseContext();
  const ctx = { db, formConfig: defaultFormConfig };

  await saveForm(ctx, testForm);
  const result = await getForm(ctx, testForm.id);

  expect(result.success).toBe(true);
  expect(result.data).toEqual(testForm);
});
```

### Component Tests

Use Storybook stories for component development and testing:

```typescript
// Component.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { FormInput } from './FormInput';

const meta: Meta<typeof FormInput> = {
  component: FormInput,
  title: 'Components/FormInput',
};

export default meta;
type Story = StoryObj<typeof FormInput>;

export const Default: Story = {
  args: {
    label: 'Your name',
    hint: 'Enter your full name',
  },
};
```

### E2E Tests

Use Playwright for end-to-end testing:

```typescript
import { test, expect } from '@playwright/test';

test('user can create form', async ({ page }) => {
  await page.goto('http://localhost:4321');
  await page.click('text=New Form');
  await page.fill('[name="title"]', 'Test Form');
  await page.click('button:has-text("Create")');

  await expect(page).toHaveURL(/\/forms\/.+/);
});
```

## Code Organization

### Package Structure

```
packages/forms/
├── src/
│   ├── patterns/              # Form patterns
│   │   ├── input/
│   │   │   ├── config.ts
│   │   │   ├── prompt.ts
│   │   │   ├── response.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── services/              # Business logic
│   ├── repository/            # Database operations
│   ├── documents/             # Document handling
│   ├── context/               # Runtime contexts
│   └── index.ts               # Package exports
├── package.json
└── README.md
```

### Dependency Rules

Packages follow strict dependency hierarchy (see architecture.md):

```
common ← database ← auth
              ↑       ↑
            forms ← design
              ↑       ↑
              └─ server
```

**Never introduce circular dependencies.**

## Code Style

### Formatting

- Prettier is the source of truth
- Pre-commit hook runs `pnpm format` automatically
- 2 space indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multi-line structures

### Linting

- ESLint configured per package
- Run `pnpm lint` before committing
- Fix issues with `pnpm lint --fix`

### Comments

```typescript
// Good - explain why, not what
// Retry logic needed because Login.gov occasionally times out
const result = await retryWithBackoff(() => loginGov.authenticate());

// Avoid - redundant comments
// Get the user's name
const name = user.name;

// Good - document complex types
/**
 * Pattern configuration defining behavior and UI generation.
 *
 * @template P - Pattern type
 * @template O - Output type from user input
 */
export interface PatternConfig<P, O> { ... }
```

## Git Conventions

### Commit Messages

Follow Conventional Commits:

```
feat(forms): add email validation pattern
fix(design): correct button styling in dark mode
refactor(database): simplify migration logic
docs(patterns): update pattern creation guide
test(repository): add tests for form deletion
chore(deps): update dependencies
```

Format: `type(scope): description`

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `style`

### Pull Requests

- One logical change per PR
- Link related issues
- Include tests for new features
- Update documentation
- Ensure CI passes
- Request review from relevant code owners

## Error Handling

### Validation Errors

```typescript
// Return validation errors as Results
if (!email.includes('@')) {
  return {
    success: false,
    error: {
      type: 'validation-error',
      message: 'Invalid email address',
    },
  };
}
```

### Exceptions

```typescript
// Throw for programmer errors
if (!ctx.db) {
  throw new Error('Database context required');
}

// Catch and convert to Result for runtime errors
try {
  const data = await externalApi.fetch();
  return { success: true, data };
} catch (error) {
  return {
    success: false,
    error: {
      type: 'api-error',
      message: error instanceof Error ? error.message : 'Unknown error',
    },
  };
}
```

## Performance Considerations

- Use database indexes for frequently queried fields
- Implement pagination for large result sets
- Lazy load components when appropriate
- Cache expensive computations
- Profile before optimizing

## Security Practices

- Never commit secrets (use `.env` files)
- Validate all user input
- Sanitize data before rendering
- Use parameterized queries (Kysely/Knex handles this)
- Follow principle of least privilege
- See ADR 0011 for secrets management strategy

## See Also

- [Architecture Overview](./architecture.md) - System design
- [Terminology](./terminology.md) - Domain language
- [Quick Reference](./quick-reference.md) - Common commands
- [ADR 0017: Use Named Exports](./adr/0017-use-named-exports.md)
- [ADR 0013: Database Strategy](./adr/0013-database-strategy.md)
- [ADR 0005: Build System](./adr/0005-build-system.md)
