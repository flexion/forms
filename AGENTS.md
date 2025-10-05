# Repository Guidelines

This guide helps AI agents and contributors work effectively in the Forms Platform monorepo.

## Documentation Index

For comprehensive documentation, see [DOCS.md](./DOCS.md).

**Quick links:**
- [Quick Reference](./documents/quick-reference.md) - Common commands and workflows
- [Patterns and Conventions](./documents/patterns-and-conventions.md) - Coding standards
- [Architecture Overview](./documents/architecture.md) - System design
- [Terminology](./documents/terminology.md) - Domain language
- [ADRs](./documents/adr/) - Architectural decisions

## Project Structure & Module Organization

- `apps/*`: runnable apps (e.g., `cli`, `sandbox`, `server-doj`, `spotlight`).
- `packages/*`: shared libraries and UI (`auth`, `common`, `database`, `design`, `forms`, `server`).
- `e2e`: Playwright end‑to‑end tests and config.
- `infra/*`: CDKTF and AWS CDK infrastructure code.
- `documents/`: architecture, ADRs, and process docs.
- Root tooling: `manage.sh`, `turbo.json`, `pnpm-workspace.yaml`, `vitest.workspace.ts`.

## Build, Test, and Development Commands

- `pnpm install`: install workspace dependencies (use Node from `.nvmrc`).
- `pnpm build`: build all packages/apps via Turbo.
- `pnpm dev`: start local development (Astro site on 4321; Storybook on 61610).
- `pnpm test`: run Vitest across the workspace. For watch: `pnpm vitest`.
- `pnpm test:e2e:dev` / `:ci`: run Playwright E2E in `e2e/`.
- `pnpm lint` / `pnpm format`: lint and Prettier‑format sources.
- `pnpm clean:dist` / `pnpm clean:modules`: remove build artifacts and `node_modules`.
- `pnpm typecheck`: project‑wide TypeScript checks.

Tip: Tests that hit the database require Docker or Podman. Install Playwright browsers once: `pnpm dlx playwright@1.51.1 install --with-deps`.

## Coding Style & Naming Conventions

- Language: TypeScript (strict, NodeNext modules). Keep code typed and narrow.
- Formatting: Prettier is source of truth; Husky runs `pnpm format` on commit.
- Linting: ESLint per package (see `packages/*/package.json` scripts).
- Naming: `camelCase` vars/functions; `PascalCase` types/components; folder/package names `kebab-case`. Tests end with `*.test.ts(x)`.

## Testing Guidelines

- Unit/integration: Vitest; co‑locate tests near `src/` or under `tests/` using `*.test.ts(x)`.
- E2E: Playwright in `e2e/`. Prefer realistic fixtures and stable selectors.
- Coverage: ensure meaningful assertions; enable coverage where configured.

## Commit & Pull Request Guidelines

- Commits: follow Conventional Commits (e.g., `feat:`, `fix:`, `refactor:`). Include scope and ticket/issue (`TCKT-123`, `#123`) when relevant.
- PRs: clear description, linked issues, screenshots for UI, tests updated, docs updated, and passing CI. One logical change per PR.

## Documentation Maintenance

When making code changes, update relevant documentation in the same PR:
- Update package READMEs when public APIs change
- Create ADR for significant architectural decisions (use next number in sequence)
- Update [DOCS.md](./DOCS.md) when adding new documentation files
- Keep [Quick Reference](./documents/quick-reference.md) current with command changes
- Update [Patterns and Conventions](./documents/patterns-and-conventions.md) for new patterns

See [ADR 0018: Documentation Strategy](./documents/adr/0018-documentation-strategy.md) for complete guidelines.

## Security & Configuration Tips

- Never commit secrets. Use `.env` files (see examples like `e2e/.env.sample`).
- Match Node version via `.nvmrc`. For static builds, set `BASEURL` when needed.
- Prefer Podman or Docker for local DB‑backed tests.
