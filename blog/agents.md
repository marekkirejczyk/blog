# Blog Conventions

Conventions for the Astro blog at zkmarek.com. For feature specs see `docs/comments.md` and `docs/subscribe.md`.

## Stack

- **Framework**: Astro 5 (static site)
- **TypeScript**: strict mode (extends `astro/tsconfigs/strict`)
- **Testing**: Vitest

## JavaScript in Astro Components

- Keep JS logic out of `.astro` files — extract it to `.ts` files in `src/lib/` with tests
- `.astro` `<script>` blocks should contain only minimal binding code: reading data attributes, attaching event listeners, calling imported functions
- All business logic, API calls, rendering, and formatting belong in `src/lib/` modules
- Client-side modules split by feature: `lib/comments/api.ts`, `lib/comments/ui.ts`, `lib/subscribe/api.ts`
- API modules wrap `fetch()` with `credentials: "include"`
- UI modules are pure functions (no DOM, no fetch) — testable rendering, escaping, formatting

## Astro Component Patterns

- Data attributes (`data-slug`, `data-api-base`) to pass SSR values to client-side JS
- `import.meta.env.PUBLIC_COMMENTS_API` for API base, passed via data attributes

## Testing

General testing rules live in the `testing` skill (`.claude/skills/testing/SKILL.md`).

- Integration tests for `api.ts` fetch wrappers run against the real comments server by instantiating `TestApp` (from `comments/src/app.ts`) with in-memory SQLite, not mocked fetch
- See `tests/comments/ui.test.ts` (unit) and `tests/comments/api.test.ts` (integration) for examples

## Dialogs

- Each dialog must be a separate `.astro` file with minimal JS, one concern per file
- Use HTML `<dialog>` element with `showModal()` / `close()`
- Close on backdrop click (`e.target === dialog`) and close button
