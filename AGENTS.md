# Repository Guidelines

## Project Overview

`pastelrain` is a TanStack Start app (React 19, SSR) deployed to Cloudflare Workers. It was scaffolded with create-tanstack-app (`.cta.json`: file-router, Tailwind, `cloudflare` add-on, no examples). It is still close to the starter: a single `/` route that renders a centered "pastelrain" heading. `README.md` is empty, and there are no server functions, loaders, data fetching, or app state yet.

## Architecture & Data Flow

- **Request path:** Cloudflare Worker (`wrangler.jsonc` → `main: @tanstack/react-start/server-entry`) → TanStack Start SSR → router from `src/router.tsx` → route tree in `src/routeTree.gen.ts` → route components in `src/routes/`.
- **Root shell:** `src/routes/__root.tsx` uses `createRootRoute({ head, shellComponent: RootDocument })`.
  - `head` sets the meta tags and title, and links the CSS via `import appCss from '../styles.css?url'`.
  - `RootDocument` renders `<html>`, `<HeadContent />`, the children, TanStack devtools (rendered unconditionally), and `<Scripts />`.
- **Router:** `src/router.tsx` exports `getRouter()`, which is the Start convention; do not rename it to `createRouter`.
  - Options: `scrollRestoration: true`, `defaultPreload: 'intent'`, `defaultPreloadStaleTime: 0`.
  - The `declare module '@tanstack/react-router' { interface Register { ... } }` block provides type-safe links. Keep it.
- **Vite plugin order** (`vite.config.ts`), which matters: `devtools()` → `cloudflare({ viteEnvironment: { name: 'ssr' } })` → `tailwindcss()` → `tanstackStart()` → `viteReact()`. `resolve.tsconfigPaths: true` is enabled.
- **Styling:** Tailwind v4, CSS-first (`src/styles.css`: `@import 'tailwindcss'` plus an `@theme` block). There is no `tailwind.config.*`.
- **Animation:** the `motion` package (`motion/react`). Follow `.agents/skills/motion/` guidance.

## Key Directories

- `src/routes/`: file-based routes. `__root.tsx` is the document shell and `index.tsx` is `/`.
- `src/`: `router.tsx`, `styles.css`, and the generated `routeTree.gen.ts`.
- `.agents/skills/motion/`: Motion animation skill docs (best practices, performance audit, CSS spring, transition preview).
- `.omp/mcp.json`: the agent MCP config (the `motion` server at `https://mcp.motion.dev`).
- Generated or ignored; never edit: `dist/`, `.wrangler/`, `.tanstack/`, `node_modules/`.

## Development Commands

```bash
pnpm dev                 # vite dev on http://localhost:3000
pnpm build               # vite build → dist/client + dist/server
pnpm preview             # preview the production build
pnpm run deploy          # build + wrangler deploy
pnpm generate-routes     # tsr generate → src/routeTree.gen.ts
pnpm exec tsc --noEmit   # typecheck (there is no script for it)
pnpm exec oxlint         # lint (see the warning below)
pnpm exec oxlint --fix
pnpm format              # oxfmt (writes)
pnpm format:check        # oxfmt --check
```

**Warning:** under pnpm 11.21, `pnpm lint` and `pnpm run lint` fail with `Command "eslint" not found`. Call `pnpm exec oxlint` directly.

## Code Conventions & Common Patterns

- **Formatting** is done by oxfmt (`.oxfmtrc.json`):
  - No semicolons and single quotes.
  - Imports are sorted automatically.
  - Tailwind classes are sorted, including inside `cn(...)` calls; the stylesheet entry for sorting is `src/styles.css`.
  - Never hand-format against it; run `pnpm format`.
- **Lint** is oxlint (`.oxlintrc.json`):
  - Plugins: eslint, typescript, unicorn, oxc, react, import, jsx-a11y.
  - `correctness` is set to error and `suspicious` to warn.
  - `react/react-in-jsx-scope` is off.
- **TypeScript** (`tsconfig.json`) is strict, with `noUnusedLocals`, `noUnusedParameters`, `noUncheckedSideEffectImports`, and `verbatimModuleSyntax`. Because of `verbatimModuleSyntax`, type-only imports need `import type`.
- **Path aliases:** `#/*` → `./src/*` works in both TypeScript and at runtime through `package.json` `imports`; prefer it. `@/*` is TypeScript-only. Existing code still uses relative imports.
- **Route file pattern:**
  ```tsx
  // src/routes/about.tsx
  import { createFileRoute } from '@tanstack/react-router'

  export const Route = createFileRoute('/about')({ component: About })

  function About() {
    return <main>…</main>
  }
  ```
  - Always export `Route`.
  - The path string must match the file location.
  - Define the component as a local function declaration.
- **Class merging:** use the `cn` package for conditional classes.
- **Fonts** come from `@fontsource` packages imported in `src/styles.css`, mapped to theme tokens:
  - `--font-title` (Shippori Mincho; applied to `h1`–`h6` in `@layer base`) → `font-title`.
  - `--font-sans` (Zen Kaku Gothic New).
  - `--font-mono` (JetBrains Mono Variable).
- **Known gap:** `src/routes/index.tsx` uses `text-title`, but no `--color-title` or `--text-title` token exists, so the class has no effect.
- **Cloudflare runtime:** `nodejs_compat`, `compatibility_date` 2025-09-02. No bindings or env vars are configured; add them in `wrangler.jsonc`. The worker name `tanstack-start-app` is still the scaffold default.

## Important Files

- `src/router.tsx`: router factory and type registration.
- `src/routes/__root.tsx`: HTML shell, head, devtools.
- `src/routeTree.gen.ts`: **generated; do not edit.** It is regenerated by dev/build or `pnpm generate-routes`, and lint, format, and the VS Code config all ignore it.
- `src/styles.css`: Tailwind entry, theme tokens, fonts.
- `vite.config.ts`, `wrangler.jsonc`, `tsconfig.json`, `tsr.config.json` (`target: react`).
- `.oxfmtrc.json`, `.oxlintrc.json`; `.zed/settings.json` (format-on-save with oxfmt plus `source.fixAll.oxc`).

## Runtime/Tooling Preferences

- **Package manager:** pnpm only (v11; `pnpm-lock.yaml`). There is no `packageManager` or `engines` field. `pnpm-workspace.yaml` is a single package that only sets `allowBuilds` (esbuild, lightningcss, sharp, workerd).
- **Runtime:** Node for tooling; Cloudflare `workerd` for the server. There is no Bun.
- **Pinned versions:** `@tanstack/react-start` 1.169.4, `@tanstack/react-router` 1.170.46, and the devtools packages are pinned exactly. Upgrade them together.
- **Core versions:** Vite 8, TypeScript 6, Tailwind 4, React 19, Wrangler 4.
- **Formatting and linting tools:** use oxfmt and oxlint; do not add Prettier or ESLint. Zed explicitly disallows Prettier.

## Testing & QA

- There is no test framework, there are no test files, there is no coverage setup, and there is no CI (no `.github/`).
- Before finishing a change, run:
  ```bash
  pnpm exec tsc --noEmit && pnpm exec oxlint && pnpm format:check && pnpm build
  ```
- For UI changes, run `pnpm dev` and check http://localhost:3000.
- If you add tests, Vitest fits the Vite toolchain. Add a `test` script and update this section.

<!-- intent-skills:start -->

## Skill Loading

Use the repository’s installed Intent. If it is unavailable, report the missing dependency instead of downloading a replacement.
Before editing files for a substantial task:

- Run `pnpm exec intent list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm exec intent load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

Current state: Intent is not installed (`pnpm exec intent list` → `Command "intent" not found`); report this rather than installing it. The local Motion skill lives at `.agents/skills/motion/SKILL.md`.

<!-- intent-skills:end -->
