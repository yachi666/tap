# Domain Docs

How agents should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root — the single source of truth for domain terminology, business processes, and canonical terms.
- **`CLAUDE.md`** at the repo root — project overview, architecture, conventions, and current milestone status.
- **`docs/TECHNICAL_ARCHITECTURE.md`** — system-level architecture decisions and module map.
- **`docs/IMPLEMENTATION_PLAN.md`** — current milestone and task breakdown.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront.

## File structure

This is a single-context monorepo:

```
/
├── CLAUDE.md                         ← Project instructions (auto-loaded by Claude Code)
├── CONTEXT.md                        ← Domain glossary
├── docs/
│   ├── PRD.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   └── IMPLEMENTATION_PLAN.md
├── apps/                             ← Control Plane, Runner, Web
├── packages/contracts/               ← 5 shared Zod contract packages
└── packages/test-fixtures/           ← Hermetic Fixture Server
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms the glossary explicitly avoids.

Key distinctions:

| Say | Don't Say |
|-----|-----------|
| TestCaseVersion | test case (ambiguous) |
| WorkflowVersion | workflow (ambiguous) |
| CanonicalApiModel | API spec, parsed API |
| ExecutionPlan | compiled workflow |
| RunSnapshot | run config |
| RunEvent | execution log |
| GeneratedDraft | AI test, generated test |

If the concept you need isn't in the glossary yet, that's a signal — either you're inventing language the project doesn't use (reconsider) or there's a real gap worth documenting.
