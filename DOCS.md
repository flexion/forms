# Documentation Index

This index helps you navigate all Forms Platform documentation.

## Quick Start

**New to the project?** Start here:
1. [README.md](./README.md) - Project overview and setup
2. [AGENTS.md](./AGENTS.md) - AI agent guidelines and repository structure
3. [Quick Reference](./documents/quick-reference.md) - Common commands and workflows
4. [Architecture Overview](./documents/architecture.md) - System design and component relationships

**Using Claude Code?** See [CLAUDE.md](./CLAUDE.md) for Claude-specific guidance.

## Documentation by Purpose

### Understanding the System

**Core Concepts**
- [Architecture Overview](./documents/architecture.md) - System design, packages, data flows
- [Terminology](./documents/terminology.md) - Domain language (blueprints, patterns, prompts, components)
- [DOJ Deployment Diagram](./documents/doj-diagram.md) - Department of Justice specific architecture

**Patterns & Conventions**
- [Patterns and Conventions](./documents/patterns-and-conventions.md) - Coding standards, naming, architecture patterns
- [Pattern System](./packages/forms/src/patterns/README.md) - Form building blocks and pattern usage

### Building and Developing

**Getting Started**
- [Quick Reference](./documents/quick-reference.md) - Common commands, workflows, troubleshooting
- [Podman Integration](./documents/podman-integration.md) - Development environment setup with Podman/Docker

**Package Documentation**
- [Forms Package](./packages/forms/README.md) - Core business logic, services, patterns
- [Design Package](./packages/design/README.md) - UI components and Storybook
- [Server Package](./packages/server/README.md) - Node.js web server (Astro + Express)
- [Auth Package](./packages/auth/README.md) - Authentication and authorization
- [Database Package](./packages/database/README.md) - PostgreSQL/SQLite with Kysely and Knex
- [Common Package](./packages/common/README.md) - Shared utilities

**Application Documentation**
- [Spotlight App](./apps/spotlight/README.md) - Main Astro website
- [CLI App](./apps/cli/README.md) - Command-line interface
- [Sandbox App](./apps/sandbox/README.md) - Testing and demo application
- [Server DOJ App](./apps/server-doj/README.md) - Department of Justice server instance

**Testing**
- [E2E Testing](./e2e/README.md) - Playwright end-to-end tests
- [ADR 0010: End-to-End Testing](./documents/adr/0010-end-to-end-testing.md) - E2E testing strategy

### Operations and Deployment

**Release and Deployment**
- [Release Process](./documents/release-process.md) - How to release new versions
- [ADR 0003: Initial Deployment Choices](./documents/adr/0003-initial-deployment-choices.md)
- [ADR 0004: Infrastructure as Code](./documents/adr/0004-infrastructure-as-code.md)

**Infrastructure**
- [AWS CDK Infrastructure](./infra/aws-cdk/README.md) - AWS deployment
- [Terraform CDK Infrastructure](./infra/cdktf/README.md) - Terraform deployment
- [Core Infrastructure](./infra/core/README.md) - Shared infrastructure utilities

**Security**
- [ADR 0011: Secrets Management](./documents/adr/0011-secrets-management.md)
- [ADR 0014: Authentication](./documents/adr/0014-authentication.md)

### Architectural Decisions

All architectural decisions are documented as ADRs in [documents/adr/](./documents/adr/). Key decisions:

**System Architecture**
- [ADR 0001: Record Architecture Decisions](./documents/adr/0001-record-architecture-decisions.md)
- [ADR 0005: Build System](./documents/adr/0005-build-system.md) - Turborepo + pnpm workspaces
- [ADR 0013: Database Strategy](./documents/adr/0013-database-strategy.md) - PostgreSQL, SQLite, Kysely, Knex
- [ADR 0015: REST API](./documents/adr/0015-rest-api.md)
- [ADR 0018: Documentation Strategy](./documents/adr/0018-documentation-strategy.md)

**Frontend & Design**
- [ADR 0006: Spotlight Frontend](./documents/adr/0006-spotlight-frontend.md) - Astro framework
- [ADR 0007: Initial CSS Strategy](./documents/adr/0007-initial-css-strategy.md)
- [ADR 0009: Design Assets Workflow](./documents/adr/0009-design-assets-workflow.md)
- [ADR 0012: Rich Text Editor](./documents/adr/0012-rich-text-editor.md)
- [ADR 0016: Unused CSS](./documents/adr/0016-unused-css.md)

**Code Quality**
- [ADR 0017: Use Named Exports](./documents/adr/0017-use-named-exports.md)
- [ADR 0002: Generate Dependency Diagram](./documents/adr/0002-generate-dependency-diagram.md)

**Domain Logic**
- [ADR 0008: Initial Form Handling Strategy](./documents/adr/0008-initial-form-handling-strategy.md)

### Reference

**Sample Documents**
- [California Unlawful Detainer](./packages/forms/sample-documents/ca-unlawful-detainer/README.md)
- [DOJ Pardon Marijuana](./packages/forms/sample-documents/doj-pardon-marijuana/README.md)

**Work in Progress**
- [Pending Loose Ends](./documents/pending-loose-ends.md) - Known gaps and future work

## Documentation Maintenance

When making code changes:
1. Update relevant documentation in the same PR
2. Create ADR for significant architectural decisions
3. Update package READMEs when public APIs change
4. Keep this index current when adding new documentation

See [ADR 0018: Documentation Strategy](./documents/adr/0018-documentation-strategy.md) for complete guidelines.
