# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Forms Platform is a forms-as-a-service platform for government organizations, enabling non-technical staff to create user-friendly "guided interview" web experiences. The platform serves two primary personas:
- **Form Builders**: Create and publish forms via a no-code browser interface
- **Form Fillers**: Complete forms created by form builders

## Core Concepts

- **Blueprint**: Defines the structure of an interactive session between government and user
- **Conversation**: A single instance of a blueprint (one interactive session)
- **Pattern/Template**: Building blocks of a blueprint, implementing UX best-practices
- **Prompt**: Produced by a pattern, defines what is presented to the user at a single point in a conversation
- **Component**: UI building block of prompts

## Common Commands

### Setup
```bash
pnpm install                          # Install dependencies
pnpm dlx playwright@1.51.1 install --with-deps  # One-time: Install browsers for Vitest
```

### Development
```bash
pnpm build                            # Build all packages (required before dev)
pnpm dev                              # Start dev servers (Astro at :4321, Storybook at :61610)
```

### Testing
```bash
pnpm test                             # Run all tests (requires Docker/Podman for PostgreSQL)
pnpm vitest                           # Run tests in watch mode
pnpm test:ci                          # Run tests in CI mode
pnpm test:e2e:dev                     # Run E2E tests in dev mode
pnpm test:e2e:ci                      # Run E2E tests in CI mode
```

### Testing Individual Packages
```bash
pnpm --filter @flexion/forms-design test:watch  # Watch mode for specific package
```

### Code Quality
```bash
pnpm lint                             # Lint all packages
pnpm format                           # Format code with Prettier
pnpm typecheck                        # Type-check all packages
```

### Cleanup
```bash
pnpm clean:dist                       # Remove all build artifacts recursively
pnpm clean:modules                    # Remove all node_modules recursively
```

### CLI Tool
```bash
./manage.sh --help                    # Access command-line operations
```

## Architecture

### Monorepo Structure

This is a pnpm workspace managed with Turborepo for efficient builds. The codebase is organized into packages and apps:

**Packages** (in `/packages/`):
- `forms`: Core business logic, services, patterns, repository, and document handling
  - `/src/services`: Public interface of Forms Platform
  - `/src/patterns`: Form building blocks ("patterns")
  - `/src/repository`: Database routines
  - `/src/documents`: Document ingest and creation
  - `/src/context`: Runtime contexts (testing, browser, server-side)
- `design`: User-facing React components, USWDS theme, Storybook stories
- `server`: Node.js web server built on Astro with Express adapter
- `auth`: Authentication and authorization (uses deprecated Lucia Auth with Arctic for Login.gov)
- `database`: PostgreSQL (production) and SQLite (testing) support with Knex migrations and Kysely queries
- `common`: Shared utilities

**Apps** (in `/apps/`):
- `spotlight`: Main Astro website (http://localhost:4321/)
- `sandbox`: Testing/demo application
- `server-doj`: Department of Justice specific server instance
- `cli`: Command-line interface (accessed via `./manage.sh`)

**Infrastructure** (in `/infra/`):
- `aws-cdk`: AWS CDK infrastructure code
- `cdktf`: Terraform CDK infrastructure code
- `core`: Shared infrastructure utilities

### Dependency Flow
```
server → auth, common, database, design, forms
forms → common, database
design → common, forms
auth → common, database
database → common
common → (no dependencies)
```

### Key Technologies

- **Build System**: pnpm workspaces + Turborepo for efficient caching and builds
- **Frontend**: Astro (static site framework), React components, USWDS design system
- **Backend**: Node.js with Express
- **Database**: PostgreSQL (production), SQLite (testing)
  - Query builders: Kysely (type-safe queries) and Knex.js (migrations)
  - Testing: Testcontainers for Postgres unit tests, in-memory SQLite for integration tests
- **Auth**: Lucia Auth (deprecated) with Arctic for Login.gov OIDC/PKCE
- **Testing**: Vitest (unit/integration), Playwright (E2E), @vitest/browser (Storybook)
- **Language**: TypeScript throughout

### Development Workflow with Conditional Exports

This monorepo uses **conditional exports** for zero-build development workflow:

**In Development:**
- Library packages (common, database, forms-core, auth, design) are consumed directly from TypeScript source files
- No build step required when editing library code - changes are immediately reflected in consuming apps
- Hot module replacement (HMR) works instantly across package boundaries
- Consumer apps (server, spotlight, etc.) are configured with `customConditions: ["development"]` in tsconfig.json
- Vite/Astro resolve the `development` export condition to use `./src/**/*.ts` files

**In Production:**
- Library packages are built and published from `dist/` folders
- Production builds use optimized, transpiled artifacts
- The `development` export condition is not used

**How it Works:**
Each library package.json has exports like:
```json
{
  "exports": {
    ".": {
      "development": {
        "types": "./src/index.ts",
        "import": "./src/index.ts"
      },
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

**Build Scripts:**
- **Important:** The `design` package requires CSS/SASS compilation:
  - First time setup: Run `pnpm --filter @flexion/forms-design build:styles` (one-time)
  - Or use `pnpm dev` which includes `dev:styles` (gulp watch) for the design package
- Production builds (`pnpm build`) are still required before publishing

### Pattern System

Patterns are the platform's primary building blocks. Each pattern has:
- `type`: String identifier for the pattern type
- `id`: Unique identifier for the pattern instance
- `data`: Configuration data specific to the pattern type

Patterns can be constructed manually or via `PatternBuilder` helper classes. They are stored on the form `Blueprint`'s pattern attribute.

## Testing Strategy

- **Unit tests**: Service-level with in-memory SQLite via `createInMemoryDatabaseContext()`
- **Integration tests**: Database gateway logic tested against PostgreSQL Testcontainers
- **E2E tests**: Playwright tests for full user flows
- **Component tests**: Storybook + @vitest/browser

Use `describeDatabase` helper for testing database routines against both SQLite and PostgreSQL.

## Important Notes

- Node version is specified in `.nvmrc` - use `nvm install` to ensure correct version
- Requires Docker or Podman for running tests (PostgreSQL container)
- Playwright version must match exactly (1.51.1) across local and CI environments
- **Development**:
  - No TypeScript build required - packages are consumed from source via conditional exports
  - CSS/styles must be built once: `pnpm --filter @flexion/forms-design build:styles`
  - Or run `pnpm dev` which includes style watching
- **Production/Publishing**: Run `pnpm build` to create optimized artifacts before publishing
- Pre-commit hook runs `pnpm format` automatically
