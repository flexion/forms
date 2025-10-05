# 18. Documentation Strategy for AI Agents and Developers

Date: 2025-10-05

## Status

Accepted

## Context

Forms Platform requires documentation that serves two audiences: human developers and AI coding agents. Existing documentation includes READMEs, ADRs, AGENTS.md, CLAUDE.md, and various technical guides. However, the documentation lacks:

1. A clear navigation structure for discovery
2. Consistent organization across documents
3. Optimization for AI agent context windows
4. Clear maintenance guidelines

Research shows AI agents work best with:
- Progressive disclosure (index → summary → details)
- Context-efficient, modular documentation
- Specific, descriptive titles (not generic "Overview")
- Plain language with direct, unambiguous phrasing
- Clear cross-references between related concepts

The AGENTS.md standard has emerged as best practice for AI coding agents, adopted by 20,000+ repositories.

## Decision

We implement a six-layer documentation architecture:

### Layer 1: Navigation (Discovery)
- `DOCS.md` - Master documentation index with categorized links
- `AGENTS.md` - AI agent quick start and repository guidelines
- `CLAUDE.md` - Claude Code-specific configuration and patterns
- `README.md` - Project overview and getting started

### Layer 2: Quick Reference (Common Tasks)
- `documents/quick-reference.md` - Commands, workflows, troubleshooting
- Organized by: Setup, Development, Testing, Deployment, Common Issues

### Layer 3: Concepts & Patterns (How We Build)
- `documents/patterns-and-conventions.md` - Coding standards, architecture patterns
- `documents/terminology.md` - Domain language (ubiquitous language)
- `documents/architecture.md` - System architecture and component relationships

### Layer 4: Decisions & History (Why We Build This Way)
- `documents/adr/` - Architecture Decision Records (numbered NNNN-title.md)
- Standard format: Status, Context, Decision, Consequences

### Layer 5: Operations (Running the System)
- `documents/release-process.md` - Release workflow
- `documents/podman-integration.md` - Development environment setup
- Other operational guides as needed

### Layer 6: Package-Specific (Deep Dives)
- Package-level READMEs in each workspace package
- Detailed API documentation and implementation notes

### Documentation Standards

**File Naming**
- Use descriptive, specific names: `authentication-flow.md` not `overview.md`
- Use kebab-case for filenames
- ADRs follow pattern: `NNNN-descriptive-title.md`

**Content Structure**
- Start each document with one-sentence purpose statement
- Use consistent heading hierarchy (##, ###)
- Include "See also" sections for related documents
- Keep sentences short and direct
- Use bullet lists for scannability
- Provide code examples where helpful
- Avoid duplication - link to authoritative source

**Maintenance Process**
- Documentation changes in same PR as related code changes
- AI agents must update relevant docs when implementing features
- Create new ADR for any significant architectural decision
- Regular documentation review to identify gaps and outdated content

**AI Agent Optimization**
- Keep documents focused and modular (< 500 lines preferred)
- Use specific, searchable titles
- Include clear summary at document start
- Cross-reference related documents
- Avoid verbose explanations - prefer direct statements

## Consequences

### Positive
- AI agents can quickly discover relevant documentation via DOCS.md index
- Modular structure reduces context window usage
- Clear maintenance guidelines ensure documentation stays current
- Progressive disclosure serves both quick lookups and deep research
- Consistent structure reduces cognitive load
- Single source of truth reduces contradictions

### Negative
- Requires initial effort to create new documentation
- Developers must maintain documentation alongside code
- Additional files to track in version control

### Mitigation
- AI agents can generate initial documentation from existing code
- Documentation updates are mandatory part of code review
- Clear templates reduce friction for creating new docs
- Index structure makes it easy to find and update docs
