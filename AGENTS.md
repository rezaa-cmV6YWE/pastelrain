# Repository Guidelines

## Project Overview

`pastelrain` is a TanStack Start app (React 19, SSR) deployed to Cloudflare Workers. It was scaffolded with create-tanstack-app (`.cta.json`: file-router, Tailwind, `cloudflare` add-on, no examples). It is planned as a scroll-driven storytelling portfolio. The single `/` route renders the first scene, `CrossingScene`: a paper-cut SVG seaside railway crossing with pointer parallax, pinned in a 500svh scroll track. Scrolling plays the transition toward the next scene, which doesn't exist yet: the title fades, narration captions play, a local train sweeps in from the right, and the camera zooms until the train fills the screen. `README.md` is empty, and there are no server functions, loaders, data fetching, or app state yet.

## Architecture & Data Flow

- **Request path:** Cloudflare Worker (`wrangler.jsonc` → `main: @tanstack/react-start/server-entry`) → TanStack Start SSR → router from `src/router.tsx` → route tree in `src/routeTree.gen.ts` → route components in `src/routes/`.
- **Root shell:** `src/routes/__root.tsx` uses `createRootRoute({ head, shellComponent: RootDocument })`.
  - `head` sets the meta tags and title, and links the CSS via `import appCss from '../styles.css?url'`.
  - `RootDocument` renders `<html>`, `<HeadContent />`, `<ReactLenis root />`, the children, TanStack devtools (rendered unconditionally), and `<Scripts />`.
- **Router:** `src/router.tsx` exports `getRouter()`, which is the Start convention; do not rename it to `createRouter`.
  - Options: `scrollRestoration: true`, `defaultPreload: 'intent'`, `defaultPreloadStaleTime: 0`.
  - The `declare module '@tanstack/react-router' { interface Register { ... } }` block provides type-safe links. Keep it.
- **Vite plugin order** (`vite.config.ts`), which matters: `devtools()` → `cloudflare({ viteEnvironment: { name: 'ssr' } })` → `tailwindcss()` → `tanstackStart()` → `viteReact()`. `resolve.tsconfigPaths: true` is enabled.
- **Styling:** Tailwind v4, CSS-first (`src/styles.css`: `@import 'tailwindcss'` plus an `@theme` block). There is no `tailwind.config.*`.
- **Animation:** the `motion` package (`motion/react`). Follow `.agents/skills/motion/` guidance.
- **Smooth scrolling:** Lenis (`lenis`, `lenis/react`) is mounted once as `<ReactLenis root />` in `__root.tsx`, and its stylesheet is `@import`ed in `src/styles.css`.
  - It smooths wheel and trackpad scrolling on the window. Touch keeps native scrolling.
  - It turns itself off for `prefers-reduced-motion` (`respectReducedMotion`, on by default).
  - Motion's `useScroll` reads the window scroll, so scroll-driven scenes follow the eased scroll automatically. Don't add a second scroll container.

## Key Directories

- `src/routes/`: file-based routes. `__root.tsx` is the document shell and `index.tsx` is `/`.
- `src/components/crossing-scene/`: the first scene.
  - `palette.ts` holds every scene color; SVG fills reference `palette.*` rather than Tailwind tokens.
  - `scene-svg.tsx`: `SceneSvg` (shared `viewBox="0 0 1600 900"`, `xMidYMax slice`), `SceneDefs` (the `#pr-cut`, `#pr-glow`, `#pr-stripe` defs that every layer references by URL), and `PaperGrain`.
  - `parallax.tsx`: the parallax Motion hooks (`usePointerParallax`, `ParallaxLayer`). A mouse or pen moves the scene while hovering. A finger moves it while touching and springs back on release. Touch listeners are passive and use touch events rather than pointer events, so they never block scrolling. `ParallaxLayer`'s optional `intro` (1 → 0) pushes the layer down by 25%–100% of its height depending on `depth`, which drives the opening crane shot.
  - `title.tsx`: the visible `h1`, revealed like a film title card. Letters fade up out of a blur, starting from the centre, while the word's letter-spacing closes in. The Motion variants take a `calm` (prefers reduced motion) `custom` value. `hidden` is identical either way, which keeps SSR hydration-safe. With calm, the letters only fade.
  - The layer components (`sky`, `clouds`, `sea`, `land`, `crossing`, `foreground`) use the `pr-*` animation classes from `src/styles.css`. Never use `Math.random` in scene art, because it breaks SSR hydration.
  - `index.tsx` owns the scroll timeline (`useScroll` over the 500svh `<section>`, with a sticky full-screen view). On load, `intro` animates 1 → 0 (`introDescent`: 0.3s delay, 3.2s): the camera lowers from the sky onto the crossing with per-layer parallax, then `Title` gets `show` and plays its reveal. User scrolling is held (`useLenis()` → `lenis.stop()`) until the camera lands; programmatic scroll restoration still works. Reduced motion skips the descent, and a restored position past `titleFadeEnd` (a reload partway down) cuts it short. Cloud undersides are rounded puffs, not a flat cut, because the descent shows them above the sea. Pointer parallax stays live for the whole scene: the pointer values are divided by the camera zoom, so the on-screen sway stays the same size as the camera zooms in. The title fades out first. The train sweeps in from the right at 20% and keeps a steady speed to the end; it never stops. The camera zooms from 65% to 100% while the train is still moving. Every scene layer sits inside one camera `motion.div`.
  - `camera.tsx`: `useCrossingCamera` zooms the camera exponentially, panning the focus from the crossing to the middle of the train. The final zoom is measured so the train body covers the viewport. Positions come from invisible `CameraMarks` circles, so the camera follows whatever framing CSS gives the scene, including the portrait box.
  - `train.tsx`: the two-car local train, drawn facing left, in the same paper-cut style as the rest of the scene. It uses the `pr-paper` drop shadow, `#pr-cut` rough edges, solid-tone fills (no transparency) and a back sheet in a second tone. The cut filter sits inside the moving group, so the edge noise travels with the train. It renders between the far and near crossing fixtures through `Crossing`'s `track` slot.
  - `narration.tsx`: the captions. Edit the `lines` array to change the story or each line's scroll window. They have no backing: they use the same paper-cut text look as the title, in navy. They are pinned to the sky: `Narration` renders inside the camera (with a box carrying the same 3rem overscan as a parallax layer), so at 1× it sits exactly in the title's spot and then zooms away with the world. Every line's window therefore ends by about 68%, just after the zoom starts. A line plays the title's reveal when its window is entered: it is time-based (not scrubbed by scroll), the letters come out of a blur from the centre, and per-letter `x` offsets imitate the title's letter-spacing closing in. It reuses `titleSpot`, `titleLine` and `cinematic` from `title.tsx`.
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
