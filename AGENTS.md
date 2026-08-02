<!-- intent-skills:start -->

## Skill Loading

Before editing files for a substantial task:

- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.

<!-- intent-skills:end -->

# Project Context

## Scaffolding

Generated with:

```bash
npx @tanstack/cli@latest create my-tanstack-app \
  --agent \
  --package-manager pnpm \
  --tailwind \
  --deployment cloudflare \
  --toolchain eslint \
  --add-ons tanstack-query
```

> Note: `--tailwind` is deprecated in current TanStack CLI; Tailwind is enabled by default for TanStack Start scaffolds.
>
> The project directory was later renamed from `my-tanstack-app` to `pastelrain` and the `package.json`, `.cta.json`, and `wrangler.jsonc` names were updated to match.

## TanStack Intent

Follow-up commands run from the project root:

```bash
npx @tanstack/intent@latest install
npx @tanstack/intent@latest list
```

Skill loading during development:

```bash
pnpm dlx @tanstack/intent@latest list
pnpm dlx @tanstack/intent@latest load <package>#<skill>
```

Key installed skill sources:

- `@tanstack/react-start#react-start`
- `@tanstack/router-core#router-core`
- `@tanstack/start-client-core#start-core`
- `@tanstack/start-client-core#start-core/deployment`
- `@tanstack/start-client-core#start-core/server-functions`

## Stack & Integrations

| Layer              | Choice                                                      |
| ------------------ | ----------------------------------------------------------- |
| Framework          | React 19 + TanStack Start                                   |
| Router             | TanStack Router (file-based)                                |
| Data fetching      | TanStack Query + `@tanstack/react-router-ssr-query`         |
| Styling            | Tailwind CSS v4 (`@tailwindcss/vite`)                       |
| Toolchain          | ESLint via `@tanstack/eslint-config`                        |
| Formatting         | Prettier                                                    |
| Build tool         | Vite 8                                                      |
| Deployment/Hosting | Cloudflare Workers via `@cloudflare/vite-plugin` + Wrangler |

Partner integrations represented:

- **Cloudflare**: `@cloudflare/vite-plugin` in `vite.config.ts`, `wrangler.jsonc`, `pnpm deploy` script, Workers-compatible entry (`@tanstack/react-start/server-entry`).
- **TanStack Query**: provider/context in `src/integrations/tanstack-query/`, SSR integration in `src/router.tsx`, demo route at `src/routes/demo/tanstack-query.tsx`.
- **ESLint**: `eslint.config.js` extending `@tanstack/eslint-config`, `pnpm lint` script.

## Project Structure

```text
pastelrain/
├── src/
│   ├── components/          # Header, Footer, ThemeToggle
│   ├── integrations/
│   │   └── tanstack-query/  # Provider, devtools, router context
│   ├── routes/              # File-based routes
│   │   ├── __root.tsx       # Root layout/document shell
│   │   ├── index.tsx        # Home
│   │   ├── about.tsx        # About
│   │   └── demo/
│   │       └── tanstack-query.tsx
│   ├── router.tsx           # Router factory + QueryClient context
│   ├── styles.css           # Tailwind import + design tokens
│   ├── app.tsx / client.tsx # Start entry points
│   └── routeTree.gen.ts     # Generated route tree
├── vite.config.ts           # Vite + Cloudflare + Tailwind + Start plugins
├── wrangler.jsonc           # Cloudflare Workers config
├── eslint.config.js         # ESLint config
├── tsr.config.json          # TanStack Router generator config
└── package.json             # pnpm scripts & deps
```

## Environment Variables

No environment variables are required by default.

For Cloudflare Workers:

- **Public (non-secret) vars**: add them to `wrangler.jsonc` under `vars`.
- **Secrets**: use `wrangler secret put <NAME>` for each production secret.
- **Local env overrides**: create a `.dev.vars` file for local development with Wrangler.

See the Cloudflare docs for binding configuration (KV, D1, R2, Durable Objects) in `wrangler.jsonc`.

## Deployment Notes

1. Authenticate Wrangler: `wrangler login`
2. Build: `pnpm build`
3. Deploy: `pnpm deploy` (runs `pnpm run build && wrangler deploy`)

`wrangler.jsonc`:

- `compatibility_date`: `2025-09-02`
- `compatibility_flags`: `["nodejs_compat"]`
- `main`: `@tanstack/react-start/server-entry`

## Key Architectural Decisions

- File-based routing with auto-generated `routeTree.gen.ts`.
- `QueryClient` is created per request via `getContext()` and injected into router context for SSR/data reuse.
- `setupRouterSsrQueryIntegration` wires TanStack Query hydration for server/client handoff.
- Devtools are stripped from production builds by `@tanstack/devtools-vite`.
- Cloudflare Vite plugin uses `viteEnvironment: { name: 'ssr' }` so the SSR environment runs on the Workers runtime during dev.

## Known Gotchas

- `--tailwind` CLI flag is deprecated and ignored; Tailwind v4 is already enabled.
- The scaffold does not generate a `.env.example`; there are no default env vars, but Cloudflare secrets/vars must be configured before deploying anything that uses them.
- Wrangler must be authenticated before `pnpm deploy` will succeed.
- Local dev runs `vite dev --port 3000` with the Cloudflare plugin active.

## Next Steps

- Customize `src/routes/index.tsx`, `src/components/Header.tsx`, and `src/components/Footer.tsx`.
- Add routes under `src/routes/` (route tree regenerates automatically or via `pnpm generate-routes`).
- Add Cloudflare bindings in `wrangler.jsonc` when needed.
- For TanStack Query patterns, load the relevant Intent skill before making substantial changes.
