# Tech Innovation Medusa Backend

This directory contains the Medusa commerce engine and its built-in Admin dashboard for Tech Innovation.

## Ownership

Medusa is the system of record for:

- Products and variants
- SKUs and pricing
- Inventory
- Categories
- Carts and checkout
- Promotions
- Orders
- Fulfillment
- Payment sessions and payment providers

Supabase remains the application platform for authentication, customer profiles, reviews, wishlists, support, realtime features, analytics/read models, storage, and integration events.

## Requirements

- Node.js 20.19+ or 22.12+
- PostgreSQL
- Redis for production-style deployments

## Local setup

1. Copy `.env.template` to `.env`.
2. Set `DATABASE_URL` to a PostgreSQL database dedicated to Medusa commerce.
3. Install dependencies from this directory:

```bash
npm install
```

4. Run migrations:

```npx medusa db:migrate
```

5. Create the first Admin user:

```npx medusa user -e admin@techinnovation.co.zw -p CHANGE_THIS_PASSWORD
```

6. Start the backend:

```npm run dev
```

The Medusa API and Admin dashboard run on port 9000. The Admin dashboard is available at `/app`.

## Frontend connection

The existing React storefront should use:

- `VITE_MEDUSA_BACKEND_URL=http://localhost:9000`
- The publishable API key generated from Medusa Admin
- A Medusa region ID for the storefront currency/region

Do not put the Medusa secret key or database credentials in the React application's environment variables.

## Production

Build with:

```bash
npm run build
npm start
```

Run database migrations before starting a new deployment.

## Architecture

The parent repository intentionally keeps the existing React/Vite storefront separate from this backend. We are not installing the deprecated standalone Medusa storefront; Medusa's current project generator supports a backend/admin application while the storefront can use any frontend stack.
