# Tech Innovation — Supabase + Medusa Architecture

## 1. Target architecture

```
                         ┌──────────────────────────────┐
                         │   React / Vite Storefront    │
                         │ Best Buy-style Tech Innovation│
                         └──────────────┬───────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                       │
             Commerce requests                        App-data requests
                    │                                       │
                    ▼                                       ▼
          ┌──────────────────┐                    ┌────────────────────┐
          │     Medusa v2    │                    │     Supabase       │
          │ Commerce Engine  │                    │ Auth + Postgres    │
          ├──────────────────┤                    ├────────────────────┤
          │ Products         │                    │ Supabase Auth      │
          │ Product variants │                    │ Profiles           │
          │ Categories       │                    │ Reviews            │
          │ Inventory        │                    │ Wishlists          │
          │ Carts            │                    │ Coupons*           │
          │ Orders           │                    │ Support/messages   │
          │ Promotions       │                    │ Business analytics │
          │ Regions          │                    │ Audit/extension data│
          │ Fulfillment      │                    │ Storage             │
          │ Payments         │                    │ Realtime            │
          └────────┬─────────┘                    └──────────┬─────────┘
                   │                                         │
                   └──────────────────┬──────────────────────┘
                                      │
                              Integration layer
                         Medusa custom API/workflows
                         + Supabase Edge Functions
                         + signed webhooks
```

## 2. Source-of-truth rules

### Medusa is authoritative for commerce
- Products and product variants
- SKU, price and sale price
- Inventory and stock reservations
- Cart and line items
- Checkout totals
- Orders and order status
- Promotions/discounts that affect the checkout total
- Shipping options and fulfillment
- Payment sessions and payment status

The React application must never calculate or persist an authoritative commerce price or stock value.

### Supabase is authoritative for application data
- Authentication and sessions
- Customer profile extensions
- Reviews and ratings
- Wishlist
- Support/WhatsApp conversation records
- Business analytics/read models
- Application audit records
- Product/media enrichment that is not required by Medusa checkout
- Files in Supabase Storage

A Supabase row must not become a second authoritative inventory or order record.

## 3. Identity

Supabase Auth remains the login system.

After login:
1. React gets the Supabase access token.
2. The integration layer sends the token to a protected Medusa integration endpoint.
3. Medusa verifies the Supabase JWT using the Supabase project's JWKS/issuer configuration.
4. Medusa finds or creates the matching Medusa customer.
5. The mapping is stored using a stable Supabase user ID in Medusa customer metadata and/or an integration mapping table.

This avoids creating a second independent customer password system.

## 4. Frontend responsibilities

Use the Medusa Store API for:
- Catalogue
- Product variants
- Prices
- Availability
- Cart
- Checkout
- Orders
- Promotions
- Shipping
- Payment provider selection

Use the Supabase client for:
- Auth
- Profile
- Reviews
- Wishlist
- Support
- Business/analytics extensions
- Realtime application notifications

The storefront should use a service/adaptor boundary so UI components do not know whether data came from Medusa or Supabase.

## 5. Admin

The admin control center becomes a combined dashboard:

**Commerce operations → Medusa**
- Products
- Variants
- Pricing
- Inventory
- Orders
- Fulfillment
- Promotions
- Payment operations

**Business operations → Supabase**
- Customers/profile extensions
- Reviews
- Support
- Application audit
- Analytics/read models
- Marketing content/media

The existing React admin can become the business control center while Medusa Admin remains the commerce operations interface. A later unified admin tab can aggregate both APIs without duplicating ownership.

## 6. Checkout flow

```
React cart
   ↓
Medusa cart
   ↓
Medusa shipping + promotions + payment session
   ↓
Medusa complete cart
   ↓
Medusa order
   ↓
Verified payment webhook
   ↓
Supabase integration event/read model
   ↓
Realtime customer/admin updates
```

No browser request should directly insert an authoritative order or decrement stock in Supabase.

## 7. Payments

Payment providers are implemented in Medusa's payment architecture. Provider callbacks/webhooks are verified server-side.

Supabase stores a read model/audit trail when useful, but it does not decide that a payment succeeded merely because the browser says so.

For Zimbabwe, Paynow can be integrated as a Medusa payment provider. Stripe can be added as another provider where appropriate.

## 8. Integration reliability

Every cross-system event must be idempotent.

Recommended event fields:
- event ID
- source system
- event type
- entity ID
- occurred-at timestamp
- payload
- processed-at timestamp
- retry count
- processing status

Webhooks should be signed/verified and safe to replay.

## 9. Migration strategy

Phase 1 — foundation
- Add Medusa client/adapters to the storefront.
- Keep Supabase Auth.
- Create Medusa/Supabase identity mapping.
- Configure Medusa publishable API key and sales channel.

Phase 2 — catalogue
- Move product, variant, price and inventory authority to Medusa.
- Map existing Supabase product IDs to Medusa IDs.
- Move storefront catalogue reads to Medusa.
- Keep Supabase product extensions only where needed.

Phase 3 — cart/checkout
- Replace the local/Supabase cart with a Medusa cart.
- Move checkout totals and stock reservation to Medusa.
- Remove duplicate Supabase order creation from the browser checkout path.

Phase 4 — orders/payments
- Read customer commerce orders from Medusa.
- Add verified payment provider webhooks.
- Mirror only the operational read model/events into Supabase.

Phase 5 — admin
- Commerce admin operations call Medusa.
- Business/admin extensions call Supabase.
- Add health checks showing both systems and integration status.

## 10. Non-negotiable rule

**Do not run two competing commerce engines.**

Supabase and Medusa are complementary:
- Medusa = commerce engine
- Supabase = identity + application platform/data extensions

The integration layer connects them; it does not duplicate ownership.
