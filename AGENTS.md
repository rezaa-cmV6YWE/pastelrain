# Repository Guidelines

## Project Overview

`pastelrain` is a TanStack Start app (React 19, SSR) deployed to Cloudflare Workers. It was scaffolded with create-tanstack-app (`.cta.json`: file-router, Tailwind, `cloudflare` add-on, no examples). It is a scroll-driven storytelling portfolio. The single `/` route renders `<SceneDefs />` once, then two scenes, each pinned in its own scroll track:

1. `CrossingScene`: a paper-cut SVG seaside railway crossing with pointer parallax, in a 500svh track. The title fades, narration captions play, a local train sweeps in from the right and brakes to a stop with a window in front of the camera, which zooms in until the train fills the screen. Reaching the end plays (not scrubbed) a rush zoom into that window: its glass clears to show the train interior, and once it covers the screen only the train scene remains. Scrolling back up plays it in reverse.
2. `TrainScene`: a first-person view inside the train, facing the windows on the sea side, in a track whose height follows from its timeline. It is pinned beneath the crossing's end, so it shows through the window during the rush and the switch has no cut. A book, held up close (its bottom quarter runs past the screen's bottom edge), rises and tells who Rezaa is, page by page; it closes, the camera zooms into the centre window, and the train passes two stations whose signs show his work history. The light moves from noon to golden hour throughout.

`README.md` is empty, and there are no server functions, loaders, data fetching, or app state yet.

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
  - `lenis.stop()` holds scrolling (the crossing's opening move and the rush into the train window). Lenis does it with `overflow: clip` on `<html>`, which removes a classic scrollbar and changes the page width mid-motion; `src/styles.css` overrides it on `(pointer: fine)` devices with `overflow: hidden` in a `scrollbar-gutter: stable` gutter, so the width stays put. Its selector must out-rank Lenis's `.lenis:not(.lenis-autoToggle).lenis-stopped`.
  - It turns itself off for `prefers-reduced-motion` (`respectReducedMotion`, on by default).
  - Motion's `useScroll` reads the window scroll, so scroll-driven scenes follow the eased scroll automatically. Don't add a second scroll container.
- **GPU memory:** each `ParallaxLayer` (and any other animated full-screen element) is its own composited layer, about 24 MB of tiles at 2× DPR. When too many draw at once, Chromium browsers run out of tile memory and show rectangles of the scene missing or stale, which can persist after the busy moment. So scenes don't draw what can't be seen: the train scene's view is `visibility: hidden` until the hand-off starts, the crossing's view is hidden once it ends, and during the rush the crossing's planes behind the stopped train (`covered`) are hidden. Never put `will-change: transform` on anything inside a zooming camera: Chromium keeps a will-change layer drawn at the largest scale it has been zoomed to and never lowers it, so after the zooms and the rush the planes stayed drawn at ~3× (255 MB of tiles at the top of the page instead of 40 MB; past the budget the gates and signals went undrawn and flickered, and scrolling up ran at half speed). The planes get their own layers anyway. To reproduce, launch Chromium with `--force-gpu-mem-available-mb=192`, scroll with the wheel through the rush and back up to the top, and compare with a fresh load; the compositor's `LayerTreeHostImpl:snapshot` trace event (`disabled-by-default-cc.debug`) gives each layer's `gpu_memory_usage`.
- **Frame rate:** SVG and CSS filters re-run whenever their layer repaints or is drawn at a new zoom, which made every zoom and the moving train stutter. So scene art gets its rough paper edge from geometry (`scene-kit/rough.tsx`), not the `#pr-cut` filter, which is left to HTML text (`.pr-cut-text`). Don't read layout (`getBoundingClientRect`) every frame of an animation: the scenes' CSS animations dirty style each frame, so each read forces a full style and layout pass (measure once, as the rush does). SVG `<text>` needs `textRendering="geometricPrecision"` (see `stations.tsx`). To measure, use a production build (`pnpm build && pnpm preview`) in a visible GPU browser at 2× DPR; a headless one misses GPU costs.
- **Hidden scenes do no work:** each scene's view sets `--pr-play` from `handoff` (`paused` while it is hidden), which every `pr-*` animation in `src/styles.css` uses as its `animation-play-state`, and the train's cruise loop skips frames while `handoff` is 0. Give any new looping scene animation `animation-play-state: var(--pr-play, running)`.
- **Safari stale text:** Safari kept drawing faded HTML text that carries the `#pr-cut` filter (`.pr-cut-text`) and per-letter animations as a stale layer, even under a hidden ancestor (the title's "Re:" blinked over the scene, inside the train too). So faded text is not rendered at all: the title's wrapper gets `display: none` once `titleOpacity` reaches 0, and each caption once its exit animation finishes. Reproduce with Playwright's WebKit, headed, with video recording.

## Key Directories

- `src/routes/`: file-based routes. `__root.tsx` is the document shell and `index.tsx` is `/`.
- `src/components/scene-kit/`: shared by both scenes; import with `#/components/scene-kit/<file>`.
  - `palette.ts` holds every scene color; SVG fills reference `palette.*` rather than Tailwind tokens.
  - `scene-svg.tsx`: `SceneSvg` (shared `viewBox="0 0 1600 900"`, `xMidYMax slice`), `SceneDefs` (the `#pr-cut`, `#pr-glow`, `#pr-stripe`, `#pr-grain` defs that every layer references by URL; rendered exactly once, in `src/routes/index.tsx`, so ids never repeat), and `PaperGrain` (the paper texture: one fixed multiply overlay above both scenes, also rendered once in `src/routes/index.tsx`, so no grain swaps at the hand-off).
  - `rough.tsx`: `Rect`, `Circle` and `Path` draw their shape as a `<path>` with rough paper-cut edges baked in: each segment is sampled every 7 units (densely enough on curves) and nudged by smooth 2D noise with the `#pr-cut` filter's strength. Use them for every static shape that should look cut from paper; plain `rect`/`path` stay smooth. The noise depends on position, so touching shapes wobble together and identical input gives identical output (a clip path matches the shape it cuts); it uses integer hashing and plain arithmetic only, so SSR and the browser write the same path data. Outlines are cached by input, so don't feed it geometry that changes every render. `Shift` is a `translate` group that also moves the noise, so repeated art (the train's two cars) doesn't share edges. `roughVertices(d)` reads a drawn outline's vertices back (the rush cuts the panes' exact shapes with it). The baked paths add about 60 KB (brotli) to the HTML.
  - `ease.ts`: `cinematic`, the long soft ease-out shared by the title and narration.
  - `handoff.ts`: the crossing → train hand-off's timing, shared by both scenes: `rush` (the transition `handoff` animates with), `glareFade` and `glassFade`, in units of `handoff` (0 → 1). `handoff` itself is one motion value created in `src/routes/index.tsx` and passed to both scenes: the crossing plays it, the train scene's glass veil follows it.
  - `color.ts`: `mixOklab(stops)` returns a `t → rgb()` blend through evenly spaced hex stops, each step a straight line in OKLab. Use it for scroll-driven colour changes between distant hues: Motion's own colour mixing is RGB, which turns grey halfway between blue and gold. Route such blends through a bright, pale stop (near-white reads as haze, not grey) rather than round the hue wheel, which goes pink or green.
  - `parallax.tsx`: the parallax Motion hooks (`usePointerParallax`, `ParallaxLayer`). A mouse or pen moves the scene while hovering. A finger moves it while touching and springs back on release. Touch listeners are passive and use touch events rather than pointer events, so they never block scrolling. `ParallaxLayer`'s optional `intro` (1 → 0) pushes the layer down by 25%–100% of its height depending on `depth`, which drives the crossing's opening crane shot.
  - `camera.tsx`: `useSceneCamera(progress, view, shot)` zooms a scene's camera exponentially, panning the focus from `shot.from` to `shot.to`. The final zoom is measured so a `shot.cover` box covers the viewport (times `shot.margin`); an optional `shot.keep` box caps it so that box stays fully in frame on screens shaped very differently from `cover`. Positions come from invisible `CameraMarks` circles, so the camera follows whatever framing CSS gives the scene, including the crossing's portrait box. `view` is the camera element's parent; measurements use its layout size and undo any outer translate/scale on it (the crossing passes the rush camera, `rushView`), so a resize mid-rush still frames correctly. `frame()` must read every motion value before its early return: function-form `useTransform` only tracks values it saw being read.
- `src/components/crossing-scene/`: the first scene.
  - `title.tsx`: the visible `h1`, revealed like a film title card. Letters fade up out of a blur, starting from the centre, while the word's letter-spacing closes in. The Motion variants take a `calm` (prefers reduced motion) `custom` value. `hidden` is identical either way, which keeps SSR hydration-safe. With calm, the letters only fade.
  - The layer components (`sky`, `clouds`, `sea`, `land`, `crossing`, `foreground`) use the `pr-*` animation classes from `src/styles.css` and draw with the `scene-kit/rough` shapes (the lamps' glows and lit faces stay smooth `circle`s). Never use `Math.random` in scene art, because it breaks SSR hydration.
  - `index.tsx` owns the scroll timeline (`useScroll` over the 500svh `<section>`, with a full-screen view). Both scenes' views are `position: fixed`, not sticky: inside each scroll track that looks the same, but a sticky view slides with the page as soon as the scroll passes its section's edge, and at the hand-off the two views must stay exactly on top of each other whatever the scroll position (a sticky train view flashed a strip of blank page as the rush back out began). `handoff` alone decides which one shows. On load, `intro` animates 1 → 0 (`introDescent`: 0.3s delay, 3.2s): the camera lowers from the sky onto the crossing with per-layer parallax, then `Title` gets `show` and plays its reveal. User scrolling is held (`useLenis()` → `lenis.stop()`) until the camera lands; programmatic scroll restoration still works. Reduced motion skips the descent, and a position past `titleFadeEnd` (a reload partway down; checked on mount as well as on change, since restoration can land first) cuts it short. Cloud undersides are rounded puffs, not a flat cut, because the descent shows them above the sea. Pointer parallax stays live for the whole scene: the pointer values are divided by both cameras' zoom, so the on-screen sway stays the same size. The title fades out first. The train sweeps in from the right at 20%, cruises, then brakes (`brakeAt` → `trainStop`; an ease-out-quad, with `trainBrake` placed so the speed doesn't jump) to a stop with `train.focusWindowX` in front of the camera. The camera zooms from 65% to 100% (`crossingShot`). Every scene layer sits inside the scroll camera, which sits inside the rush camera (`useWindowRush`). While the rush plays (0 < `handoff` < 1) the planes around the stopped train are hidden (`covered`), and the view's sky background moves into the train's plane (`trainPlane`, the depth-28 layer's content, with a sky backdrop shown while `rushing`), which the rush clips. Once `handoff` reaches 1 the view gets `visibility: hidden`. The section is `relative z-10` so it stays above the train scene.
  - `window-rush.ts`: `useWindowRush` plays the hand-off. When the scroll reaches the end it snaps to the exact end, holds scrolling (`lenis.stop()`), aims at the `[data-glass]` pane nearest the screen centre and animates `handoff` 0 → 1 (`rush`); scrolling back above the end plays it 1 → 0. A jump of more than half a screen past the end or back, and the position on mount (a restored scroll), set the state without playing. It returns the rush camera: an exponential zoom about the target window until it covers the screen (`coverMargin`), panning it to the centre. It also returns `clip`: once `handoff` is past `glareFade`, every pane is cut out of `plane` (the train's plane) with an evenodd `clip-path: path()`, so the train scene pinned beneath shows through. Each hole is the pane's exact rough outline (`roughVertices`, mapped into the plane by the pane's `getCTM()`), so the switch from navy glass to the navy veil behind it changes nothing on screen; holes cut as bounding boxes made the window's outline jump at that moment, a flicker on the way in and out. The stopped train doesn't move within its plane, so the holes are measured once per rush (and on resize) in the plane's own px; the zoom and the parallax carry them along. Measuring every frame instead cost the rush a third of its frames.
  - `train.tsx`: the two-car local train, drawn facing left, in the same paper-cut style as the rest of the scene. It uses the `pr-paper` drop shadow, rough shapes, solid-tone fills (no transparency) and a back sheet in a second tone. Each car is a `Shift`, so the edge noise is fixed to the train and differs between the cars. It renders between the far and near crossing fixtures through `Crossing`'s `track` slot. Window and door panes carry `data-glass` (the rush's target and openings); the reflection sweeps fade with the `glare` value. `focusWindowX` is the centre of the window the train stops in front of.
  - `narration.tsx`: the captions. Edit the `lines` array to change the story or each line's scroll window. They have no backing: they use the same paper-cut text look as the title, in navy. They are pinned to the sky: `Narration` renders inside the camera (with a box carrying the same 3rem overscan as a parallax layer), so at 1× it sits exactly in the title's spot and then zooms away with the world. Every line's window therefore ends by about 68%, just after the zoom starts. A line plays the title's reveal when its window is entered: it is time-based (not scrubbed by scroll), the letters come out of a blur from the centre, and per-letter `x` offsets imitate the title's letter-spacing closing in. A caption is only rendered while shown or leaving (`present`; see "Safari stale text"), so its screen-reader copy sits outside it. It reuses `titleSpot` and `titleLine` from `title.tsx` and `cinematic` from `scene-kit/ease.ts`.
- `src/components/train-scene/`: the second scene, inside the train.
  - `index.tsx` (`TrainScene`): the section is `-mt-[100svh]`, so its scroll range starts at the crossing's end; its fixed view sits beneath the crossing's and shows through the window during the rush, and its navy glass veil clears with `handoff` (`glassFade`). The cruise is time-based (`useAnimationFrame` advances `cruise`, frozen under reduced motion) and slows to a stop as the zoom ends; after that, scroll drives `run`, which slides the stations past at a steady speed with no stops, ending with the last sign centred. Scenery strips wrap a 1600-wide tile (`tile()`). Layers: outside far (depth 4), outside near plus stations (10), then a `pr-rattle` wrapper holding the carriage and sun patches (22), stanchions (32) and straps (40), all inside the camera; the book sits outside the camera with the raw pointer. A warm multiply tint and the glass veil sit on top. The screen-reader copy (`h2`, the book's pages, the stops as a list) is built from the same `pages`, `skills` and `stops` arrays.
  - `timeline.ts`: every scroll range of the scene (book rise/open/pages/close/lower, zoom, cruise stop, station run, golden hour). Moments are laid out in screens of scroll (1 = 100svh) and exported as fractions; `trackScreens` sets the section's height, so changing one length (e.g. `pageScreens`, the scroll spent on each spread, `turnScreens`, the scroll a page turn takes, or `runPerScreen`, the station run's speed) or adding a page or stop keeps every other part's pace. `index.tsx` and `book.tsx` share it.
  - `story.ts`: `skills` (append to add one) and `pages` (the story text), shared by the book, the timeline and the screen-reader copy.
  - `book.tsx`: the book rises, its cover turns open in 3D, one spread per `pageSpan` of scroll, then closes and lowers. At rest it sits on the screen's bottom edge pushed down 25% of its height, so only its top three quarters show; page content (`pageText`) and the cover title keep to that top `h-3/4`. Page numbers (`PageNumber`) sit in the top margin at each page's outer corner. Scroll picks a single page (`place()`: each spread's chapter page, then its prose page, half a `pageSpan` each). Landscape shows the spread holding it, its left page on the cover's back; portrait is too narrow for two pages, so it shows the single pages one at a time (both orientations are rendered and toggled with `portrait:`/`landscape:` classes, so SSR stays hydration-safe). Page text sits above a separately filtered paper background, so text is never filtered. The cover and the turning pages are `Leaf`s hinged on the left (`preserve-3d`; no CSS filter on the hinged element, since filters flatten 3D); each face is also hidden by angle, not just `backface-visibility`, which WebKit ignores for faces with filtered children. Page turns are scrubbed by scroll, not timed: each page holds, then turns over the last `turnSpan` of its scroll, and scrolling back turns it back. Portrait turns after every page, landscape only after a prose page (front: the spread's right page, back: the next spread's left page). The page leaves always render (at rest they lie on the current page), so the cover stacks above them (`coverLayer`) until it is fully open; pages only turn while it is. The current page is React state that changes only at page edges; leaf angles are motion values that update the same frame, so `angleAt` works them out against the rendered page (a finished turn holds at -180° until the next page renders; otherwise the old page flashes flat for a frame). Reduced motion keeps the leaves flat and swaps pages at their edges.
  - `stations.tsx`: `stops` (work history); each sign mimics a Japanese station board (katakana, English, line band with the role, previous/next stops, dates) and fits inside the centre window's opening. A stop's `run` is the `run` value at which its sign is centred in the middle window. The zoom (`windowShot` in `index.tsx`) ends with half of each neighbouring window still in frame (`keep`: x 350–1250); portrait phones show less than that at 1×, so they don't zoom. The signs' text uses `textRendering="geometricPrecision"`: without it Chrome laid it out again every scrolled frame, which held the book section under 20 fps.
  - `carriage.tsx` (`Carriage`, `SunPatches`, `Stanchions`, `Straps`), `outside.tsx` (`OutsideFar`, `OutsideNear`), `daylight.ts` (`useDaylight`: noon → golden-hour colours, blended with `mixOklab`; the sky, haze and bright sea band pass through the pale `palette.afternoon*` stops). Art that moves every frame (outside strips, stations, straps) gets no `pr-paper` shadow, because a filter on moving art is redrawn every frame, and keeps smooth shapes; an offset back sheet in a darker tone gives it the paper look. Static interior art (`Carriage`, `Stanchions`) has rough shapes and the shadow. The carriage gets its depth from flat cast shadows under the overhead light (one navy group at 24% opacity, so overlaps don't darken twice) below every ledge, behind the poles (`poles` must match `Stanchions`) and under the sills, plus window reveals clipped to the openings (`#train-window-holes`, the same rough outlines as the wall's holes): the top underside, the sill and the side facing the viewer. The benches have a lit cushion top (`seatLight`) and seams between seats.
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
