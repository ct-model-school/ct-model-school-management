<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# C.T. Model School project instructions

## Read first
Before starting or continuing work, read `PROJECT_ROADMAP.md`. It is the master project plan and contains the non-negotiable architecture, theme, database, testing and workflow rules.

## Core rules
- C.T. Model School is the actual project.
- SutoCraft is reference-only. Never modify SutoCraft and do not copy its UI wholesale.
- The project must be fully theme-aware.
- Never hardcode primary/theme colors inside individual pages or components.
- Theme colors and theme-dependent visual values must come from the central theme/settings system and remain changeable from Admin Settings.
- Preserve existing working functionality and avoid unrelated changes.
- Inspect existing code and database assumptions before implementing a feature.
- Database changes must be deliberate. When direct Supabase execution is unavailable, provide exact manual SQL for the user to run.
- Do not expose secrets or credentials.
- Every completed UI section requires a theme/color audit.
- Run lint/build and relevant checks before committing.
- Work in bounded sections and move forward according to `PROJECT_ROADMAP.md` without waiting for the user to specify every individual coding step.
- Commit and push only verified work.
