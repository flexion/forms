# Quick Reference

Common commands and workflows for Forms Platform development.

## Initial Setup

```bash
# Use correct Node version
nvm install                           # Install Node version from .nvmrc

# Install dependencies
pnpm install                          # Install all workspace dependencies

# One-time: Install Playwright browsers (version must match exactly)
pnpm dlx playwright@1.51.1 install --with-deps

# Install Docker or Podman
# See: documents/podman-integration.md for Podman setup
```

## Development Workflow

```bash
# Build all packages (required before dev)
pnpm build

# Start development servers
pnpm dev                              # Astro (localhost:4321) + Storybook (localhost:61610)

# Type checking
pnpm typecheck                        # Check all packages

# Code quality
pnpm lint                             # Lint all packages
pnpm format                           # Format with Prettier (runs automatically on commit)
```

## Testing

```bash
# Run all tests
pnpm test                             # Full test suite (requires Docker/Podman)

# Watch mode
pnpm vitest                           # Watch mode for all packages

# Test specific package
pnpm --filter @flexion/forms test     # Test forms package
pnpm --filter @flexion/forms-design test:watch  # Watch mode for design package

# End-to-end tests
pnpm test:e2e:dev                     # E2E tests in dev mode
pnpm test:e2e:ci                      # E2E tests in CI mode
```

## Package Management

```bash
# Add dependency to specific package
pnpm --filter @flexion/forms add lodash

# Add dev dependency to workspace root
pnpm add -Dw prettier

# Remove dependency
pnpm --filter @flexion/forms remove lodash

# Update dependencies
pnpm update                           # Update all dependencies
```

## Build and Cleanup

```bash
# Build commands
pnpm build                            # Build all packages via Turborepo
pnpm --filter @flexion/forms build    # Build specific package

# Cleanup commands
pnpm clean:dist                       # Remove all build artifacts recursively
pnpm clean:modules                    # Remove all node_modules recursively

# Full reset workflow
pnpm clean:modules                    # Step 1: Remove node_modules
pnpm install                          # Step 2: Reinstall
pnpm build                            # Step 3: Rebuild all
```

## CLI Tools

```bash
# Access command-line operations
./manage.sh --help                    # View available CLI commands
```

## Common Development Tasks

### Adding a New Pattern

1. Create pattern file in `packages/forms/src/patterns/`
2. Implement pattern interface with `type`, `id`, and `data`
3. Add pattern builder if needed
4. Export from `packages/forms/src/patterns/index.ts`
5. Add tests in `*.test.ts` file
6. Update pattern README

### Creating a New Component

1. Create component in `packages/design/src/components/`
2. Add Storybook story in `*.stories.tsx`
3. Add component tests
4. Export from `packages/design/src/index.ts`
5. Document props and usage

### Adding a Database Migration

1. Create migration in `packages/database/src/migrations/`
2. Use Knex migration format
3. Test against both PostgreSQL and SQLite
4. Update database schema types if needed

### Running Specific App

```bash
# Run specific application
pnpm --filter spotlight dev           # Run Spotlight app
pnpm --filter sandbox dev             # Run Sandbox app
pnpm --filter server-doj dev          # Run DOJ server
```

## Troubleshooting

### Build Errors

**Symptom**: Unexplained build failures
```bash
# Solution: Clean and rebuild
pnpm clean:dist
pnpm clean:modules
pnpm install
pnpm build
```

### Test Failures

**Symptom**: Database tests failing
- Ensure Docker/Podman is running
- Check PostgreSQL container is accessible
- Verify `.env` files are configured

**Symptom**: Playwright tests failing
- Ensure browsers installed: `pnpm dlx playwright@1.51.1 install --with-deps`
- Verify version matches exactly (1.51.1)
- Check local and CI environments match

### Development Server Issues

**Symptom**: Dev server won't start
- Run `pnpm build` first (required before `pnpm dev`)
- Check ports 4321 and 61610 are available
- Clear build artifacts: `pnpm clean:dist`

**Symptom**: Hot reload not working
- Restart dev server
- Check file watchers limit (Linux): `sudo sysctl fs.inotify.max_user_watches=524288`

### Type Errors

**Symptom**: TypeScript errors in IDE but not in CLI
- Restart TypeScript server in IDE
- Run `pnpm typecheck` to verify
- Check `tsconfig.json` is correctly configured

### Dependency Issues

**Symptom**: Module not found errors
- Verify package is in `dependencies` or `devDependencies`
- Run `pnpm install` again
- Check workspace protocol versions in `package.json`

**Symptom**: Version conflicts
- Use `pnpm why <package>` to trace dependency tree
- Use `pnpm update` to resolve
- Check peer dependency requirements

## Environment Variables

Key environment variables (see `.env.sample` files in each app):

- `DATABASE_URL` - PostgreSQL connection string
- `BASEURL` - Base URL for static builds
- `NODE_ENV` - Environment (development, production, test)

## Important Files

| File | Purpose |
|------|---------|
| `.nvmrc` | Node version specification |
| `pnpm-workspace.yaml` | Workspace configuration |
| `turbo.json` | Turborepo build configuration |
| `vitest.workspace.ts` | Vitest workspace configuration |
| `manage.sh` | CLI tool wrapper |

## Getting Help

- [DOCS.md](../DOCS.md) - Full documentation index
- [Architecture](./architecture.md) - System design
- [ADRs](./adr/) - Architectural decisions
- Package READMEs - Package-specific documentation

## See Also

- [AGENTS.md](../AGENTS.md) - Repository guidelines for AI agents
- [CLAUDE.md](../CLAUDE.md) - Claude Code specific guidance
- [Patterns and Conventions](./patterns-and-conventions.md) - Coding standards
- [Podman Integration](./podman-integration.md) - Container setup
