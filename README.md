# Path of Terraria Website

Frontend website for Path of Terraria, built with SvelteKit 2, Svelte 5, Vite, Tailwind CSS 4, and Flowbite Svelte.

This repository contains the public website and several app-style pages that integrate with the Path of Terraria API, including:

- Marketing and landing pages
- Account and profile flows
- Supporter pack checkout result pages
- Leaderboards and trade pages
- Mod data and localization tools
- A passive tree planner under `/tools/planner`

## Tech Stack

- SvelteKit with `@sveltejs/adapter-node`
- Svelte 5 with runes enabled
- Vite 8
- Tailwind CSS 4
- Flowbite Svelte and Flowbite icons
- Axios for API requests
- pnpm for package management
- Docker for containerized builds

## Prerequisites

- Node.js 24.x
- pnpm 10.x

The repo includes [`.nvmrc`](./.nvmrc), which currently targets Node `24`.

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Start the local development server:

```bash
pnpm dev
```

3. Open the app at `http://localhost:8000`.

The Vite dev server is configured in [`vite.config.ts`](./vite.config.ts) to run on port `8000`.

## Environment Variables

This project relies on public runtime configuration for the API and site URLs.

### Local development

The committed [`.env.development`](./.env.development) uses:

```env
PUBLIC_API_BASE_URL="http://localhost:5000/"
PUBLIC_BASE_URL="https://localhost:8000/"
VITE_DEBUG=true
```

### Other committed environments

- [`.env`](./.env) points at production
- [`.env.staging`](./.env.staging) points at staging

### Variable reference

- `PUBLIC_API_BASE_URL`: Base URL used by frontend API services
- `PUBLIC_BASE_URL`: Public website base URL
- `VITE_DEBUG`: Enables debug-only navigation and pages such as admin and mod-data routes

The API client is initialized in [`src/lib/services/http-service.ts`](./src/lib/services/http-service.ts), and debug navigation is toggled in [`src/lib/components/Header.svelte`](./src/lib/components/Header.svelte).

## Available Scripts

- `pnpm dev`: Start the Vite development server
- `pnpm build`: Build the production bundle
- `pnpm preview`: Preview the production build locally
- `pnpm start`: Start Vite on port `80` with host binding enabled
- `pnpm check`: Run SvelteKit sync plus `svelte-check`
- `pnpm check:watch`: Run type and Svelte checks in watch mode
- `pnpm dependencies:check`: Inspect available dependency updates
- `pnpm dependencies:update`: Update dependencies with `npm-check-updates`
- `pnpm dependencies:update:patch`: Update dependencies to latest patch versions
- `pnpm dependencies:update:minor`: Update dependencies to latest minor versions

## Project Structure

```text
src/
  lib/
    components/     Shared UI components
    data/           Planner and passive data files
    images/         App images and assets imported by Svelte
    models/         Frontend data models
    planner/        Passive tree planner logic and datasets
    services/       API service wrappers and HTTP client setup
    stores/         Shared Svelte stores
  routes/           SvelteKit routes and pages
static/             Static assets served directly
.github/workflows/  CI and image publishing workflow
Dockerfile          Container build definition
nginx.conf          Nginx configuration for deployment environments that need it
```

## Architecture Notes

- The app is configured with `adapter-node` in [`svelte.config.js`](./svelte.config.js).
- Layout-level initialization in [`src/routes/+layout.svelte`](./src/routes/+layout.svelte) boots the user profile in the browser and handles Steam-account linking query parameters.
- The root landing page in [`src/routes/+page.svelte`](./src/routes/+page.svelte) is a static marketing page.
- Some routes are effectively app screens that call the backend API via service classes in [`src/lib/services`](./src/lib/services).
- JWT auth state is stored in `localStorage` via [`src/lib/services/session-service.ts`](./src/lib/services/session-service.ts).
- The passive tree planner is a substantial client-side feature built around [`src/routes/tools/planner/+page.svelte`](./src/routes/tools/planner/+page.svelte) and data under [`src/lib/planner`](./src/lib/planner).

## Development Guidelines

### General expectations

- Keep changes focused. Separate unrelated refactors from feature work.
- Prefer updating existing patterns before introducing new abstractions.
- Use TypeScript types deliberately. Avoid adding `any` unless there is a real boundary reason.
- Preserve the current visual language unless the task is explicitly a redesign.
- Keep browser-only logic guarded appropriately; much of the app relies on client-side behavior.

### UI and routing

- Shared layout and navigation live under [`src/routes/+layout.svelte`](./src/routes/+layout.svelte) and [`src/lib/components/Header.svelte`](./src/lib/components/Header.svelte).
- Reusable UI should go in [`src/lib/components`](./src/lib/components).
- New route-specific logic should stay close to the route unless it is clearly reusable.

### API integration

- Add or extend backend calls in the relevant service under [`src/lib/services`](./src/lib/services).
- Reuse [`HttpService`](./src/lib/services/http-service.ts) instead of creating ad hoc Axios instances.
- Surface request failures in a way consistent with the existing toast-based error handling.

### Styling

- Global styles and Tailwind setup live in [`src/routes/styles.css`](./src/routes/styles.css).
- Prefer utility classes and existing component conventions over one-off global CSS.
- Keep responsive behavior in mind; several pages support both desktop and smaller screens.

## Contribution Workflow

1. Create a feature branch from `main` unless you are working directly on a coordinated release branch.
2. Make the smallest reasonable change that solves the problem.
3. Run validation locally before opening a PR:

```bash
pnpm check
pnpm build
```

4. If your change affects API-driven pages, test against the expected backend environment.
5. Open a PR with a clear summary, screenshots for UI changes, and notes about any env or backend requirements.

## Pull Request Checklist

- The branch is rebased or merged cleanly against the intended target branch
- `pnpm check` passes
- `pnpm build` passes
- UI changes were tested in the browser
- New env or backend assumptions are documented
- Screenshots or short recordings are included for visible UI changes

## Deployment

GitHub Actions publishes Docker images from pushes to `main` and `staging` using [`.github/workflows/publish.yml`](./.github/workflows/publish.yml).

Branch behavior:

- `main` builds with `NODE_ENV=production` and publishes `path-of-terraria/website`
- `staging` builds with `NODE_ENV=staging` and publishes `path-of-terraria/website-qa`

The Docker build is defined in [`Dockerfile`](./Dockerfile). The production image runs the built Node adapter output with:

```bash
node build
```

## Notes and Gaps

- There is currently no dedicated automated test suite in this repository beyond type and Svelte checks.
- The repository contains committed environment files for known deployment targets. Be careful not to introduce secrets into tracked env files.
- If you add new public configuration, document it in this README and update the relevant env files.
