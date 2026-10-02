# Tech Innovation — Solar & Electronics Storefront

A Best Buy-inspired e-commerce storefront for solar panels, hybrid inverters, LiFePO4 batteries, complete solar kits, and backup electronics in Zimbabwe. Harare showroom pickup, nationwide delivery, and WhatsApp ordering built in.

## Stack

- **React 18 + Vite 5 + TypeScript** — SPA storefront
- **Tailwind CSS 3.4** with `bb-*` design tokens (Best Buy palette) defined in `tailwind.config.ts`
- **shadcn/ui (Radix)** component primitives
- **Supabase** — Postgres database, auth, realtime, edge functions
- **@tanstack/react-query v5** — catalog data layer (`src/hooks/useCatalog.ts`)
- **Vitest** — unit tests

## Getting started

```sh
npm i
cp .env.example .env   # or create .env with the vars below
npm run dev
```

Required environment variables (Vite only exposes `VITE_*` vars to the client):

```
VITE_SUPABASE_URL=<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-anon-key>
VITE_SUPABASE_PROJECT_ID=<project-id>
```

These are publishable values — safe for the browser, but never commit `.env`.

## Scripts

| Command           | Purpose                    |
| ----------------- | -------------------------- |
| `npm run dev`     | Local dev server           |
| `npm run build`   | Production build           |
| `npm run preview` | Serve the production build |
| `npm run lint`    | ESLint                     |
| `npx tsc -b`      | Typecheck                  |
| `npm test`        | Vitest suite               |

## Architecture

```
src/
  components/store/   Shared shell: StoreHeader, StoreFooter, StoreLayout (Outlet),
                      ProductListing (shared filter/sort grid)
  components/         Catalog components: ProductCard, Cart, ProductQuickView,
                      ProductCompareModal, StoreModal, DealOfTheDay, SystemSizer, Chatbot
  pages/              SolarHome, CategoryPage (/c/:slug), SearchPage (/search),
                      ProductDetail (/product/:id), Checkout, Orders, Account, Auth,
                      About, Admin, ProductVariantsAdmin
  hooks/              useCatalog (react-query), useCart, useWishlist, useAuth,
                      useStoreUI (compare/quickview/store-modal context),
                      useStoreActions (cart + WhatsApp actions)
  data/solarProducts  Curated media/spec fallbacks, getProductMedia,
                      resolveProductImage (placeholder-image fallback), sizer presets
  integrations/       Supabase client + generated DB types
supabase/
  migrations/         SQL schema (products, variants, orders, reviews, ...)
  functions/checkout  Edge function: server-side price/stock validation + order creation
```

Key conventions:

- Pages render **content only** — `StoreLayout` provides the header, footer, cart drawer, compare dock, quick view, store modal, WhatsApp FAB, and chatbot. Checkout is intentionally outside the shell and renders its own minimal secure-checkout header.
- Category and search pages are **URL-driven** (`/c/:slug`, `/search?q=...&deals=1`) — no client-side filter state.
- Use the `bb-*` Tailwind tokens (`bb-blue`, `bb-yellow`, `bb-ink`, ...) instead of hardcoded hexes.
- Product imagery: DB `image_url` values that point at known placeholder images are replaced by curated presets in `getProductMedia` / `resolveProductImage` — never inline that check.

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel: **Add New → Project → Import** the repo. The `vercel.json` in the repo root configures the Vite framework preset and the SPA rewrite (all routes serve `index.html`).
3. Add the three `VITE_*` environment variables under **Project → Settings → Environment Variables** (Production + Preview).
4. Deploy. Subsequent pushes to `main` auto-deploy.

Custom domains: **Project → Settings → Domains**. Update `og:image`/`twitter:image` in `index.html` to absolute URLs once the domain is live.

## Supabase setup

1. Create a Supabase project and run the migrations in `supabase/migrations/` in order.
2. Deploy the `checkout` edge function: `supabase functions deploy checkout`.
3. Copy the project URL and publishable key into `.env` / Vercel env vars.

## CI

`.github/workflows/ci.yml` runs `npm ci → lint → tsc -b → vitest → build` on every push. Lint warnings are tolerated; errors fail the build.
