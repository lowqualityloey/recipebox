# RecipeBox

A fullstack recipe-sharing web app. Sign up, publish your own recipes, and browse a public feed of everyone else's.

Users can create recipes with a title, description, steps, and ingredients that carry amounts, search and filter the public feed by ingredient with pagination, open a recipe detail page, and edit or delete only the recipes they authored.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | TanStack Start v1 (React 19, TypeScript strict) with TanStack Router v1, file-based routing and route loaders for SSR, built on Vite 8 |
| Database | PostgreSQL with Prisma ORM 7 using the `@prisma/adapter-pg` driver adapter |
| Auth | Better Auth 1.7 (email + password) with the Prisma adapter and the `tanstackStartCookies` plugin, session-based via cookies |
| Validation | Zod for all input validation, both server functions and search params |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, custom CSS variables, hand-built accessible components with no shadcn dependency |
| Testing | Vitest for unit tests |
| Local DB | `embedded-postgres` (dev-only) to run a real PostgreSQL without Docker |

## Prerequisites

- Node.js 20+ (developed on 24) and npm.
- A PostgreSQL database. Pick one:
  1. **Any PostgreSQL you already have.** Set `DATABASE_URL` in `.env.local`.
  2. **Bundled local runner, no Docker or system Postgres needed.** `npm run db:start` boots a real PostgreSQL 17 on `localhost:5432`, keeps a persistent data directory in `.pgdata/` (git-ignored), and creates a `recipebox` database.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file
cp .env.example .env.local

# 3. Generate an auth secret and put it in .env.local as BETTER_AUTH_SECRET
npx -y auth@latest secret

# 4. Start a database: either the bundled runner (keep this terminal open)...
npm run db:start
#    ...or point DATABASE_URL at your own PostgreSQL in .env.local

# 5. Apply the Prisma migration and generate the client
npm run db:migrate

# 6. Optional: seed a demo account (demo@recipebox.dev / password123) and two sample recipes
npm run db:seed

# 7. Run the app
npm run dev
```

The app runs at http://localhost:3000.

> [!NOTE]
> Prisma 7 does **not** auto-generate the client on install. `npm run db:migrate` runs `prisma generate` afterwards, or run `npm run db:generate` yourself. The generated client lives in `src/generated/prisma` (git-ignored).
>
> On npm v12+, dependency install scripts are blocked by default. If native binaries (esbuild, lightningcss, embedded-postgres) fail, reinstall with `npm install --dangerously-allow-all-scripts` or run `npm install-scripts approve`.

## Environment variables

| Variable | Purpose | Example |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/recipebox` |
| `BETTER_AUTH_URL` | Public origin of the app | `http://localhost:3000` |
| `BETTER_AUTH_SECRET` | Secret used to sign sessions | generated via `npx -y auth@latest secret` |

## npm scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` / `npm run test:watch` | Vitest, run once or watch |
| `npm run db:start` | Start the bundled local PostgreSQL |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Create/apply migrations, then generate the client |
| `npm run db:push` | Push the schema without migrations |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |
| `npm run generate-routes` | Regenerate the TanStack Router route tree |

## Architecture

### Routes (`src/routes/`, file-based)

- `/`: public feed with search, ingredient filter, and pagination.
- `/recipes/$recipeId`: public recipe detail.
- `/login`, `/signup`: auth pages.
- A pathless `_protected` layout that guards `/dashboard`, `/recipes/new`, and `/recipes/$recipeId/edit`.
- `/api/auth/$`: mounts the Better Auth handler.

Route loaders call server functions, so data is fetched during SSR.

### Server functions (`src/server/`)

`getRecipes`, `getRecipeById`, `getMyRecipes`, `createRecipe`, `updateRecipe`, `deleteRecipe`.

All are built with `createServerFn` and validate input with Zod via `.validator()`. All database access happens inside them. Mutations require a session, and edit/delete additionally require the caller to be the author.

### Data model (`prisma/schema.prisma`)

- Better Auth tables: `User`, `Session`, `Account`, `Verification`, mapped to lowercase table names with `@@map`.
- `Recipe`, `Ingredient`, and the join table `RecipeIngredient` with `@@unique([recipeId, ingredientId])`.
- `Recipe.title` and `Ingredient.name` are unique.

### Auth (`src/lib/auth.ts`)

Better Auth configured with the Prisma adapter and the `tanstackStartCookies` plugin. Client helpers live in `src/lib/auth-client.ts`.

## Project layout

```
recipebox/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── scripts/
│   └── dev-db.mjs          # bundled embedded-postgres runner
└── src/
    ├── components/         # Header, RecipeCard, RecipeForm, Pagination, ...
    ├── lib/                # auth.ts, auth-client.ts, Zod schemas, format helpers
    ├── routes/             # file-based routes (feed, detail, auth, _protected)
    ├── server/             # createServerFn handlers + session helper
    ├── generated/prisma/   # generated Prisma client (git-ignored)
    ├── router.tsx
    ├── routeTree.gen.ts
    └── styles.css
```

## Testing

`npm run test` runs Vitest unit tests covering the Zod validation schemas and the pure formatting helpers.

Manual and end-to-end verification runs against a real running server with a real PostgreSQL.

## Trade-offs & notes

- **Global uniqueness.** Recipe titles and ingredient names are globally unique per the data model, so two people cannot use the same recipe title, and duplicate ingredient names within one recipe are rejected.
- **Steps are plain text.** Steps are stored newline-separated in a single column and split for display.
- **Case-sensitive ingredients.** Ingredients are deduplicated by exact, trimmed name, so names differing only by case become separate ingredients.
- **Dev-only embedded Postgres.** `embedded-postgres` is a convenience for local development: real PostgreSQL, no Docker. Production should use a managed or real PostgreSQL via `DATABASE_URL`.
- **Prisma 7 behavior.** Prisma 7 uses driver adapters and does not auto-generate the client on migrate or install.
- **Hard deletes.** Soft-delete is not implemented; deleting a recipe cascades to its `RecipeIngredient` rows.
