export const MEDUSA_BACKEND_URL = (import.meta.env.VITE_MEDUSA_BACKEND_URL || "").replace(/\/$/, "");
export const MEDUSA_PUBLISHABLE_KEY = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "";

export const MEDUSA_REGION_ID = import.meta.env.VITE_MEDUSA_REGION_ID || "";
export const MEDUSA_SALES_CHANNEL_ID = import.meta.env.VITE_MEDUSA_SALES_CHANNEL_ID || "";

export const medusaConfigured = Boolean(MEDUSA_BACKEND_URL && MEDUSA_PUBLISHABLE_KEY);

export class MedusaApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "MedusaApiError";
    this.status = status;
    this.details = details;
  }
}

type QueryValue = string | number | boolean | undefined | null;

function buildQuery(query?: Record<string, QueryValue>) {
  if (!query) return "";
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

async function medusaRequest<T>(
  path: string,
  options: RequestInit & { query?: Record<string, QueryValue> } = {},
): Promise<T> {
  if (!medusaConfigured) {
    throw new Error("Medusa is not configured. Set VITE_MEDUSA_BACKEND_URL and VITE_MEDUSA_PUBLISHABLE_KEY.");
  }

  const { query, headers, ...request } = options;
  const response = await fetch(`${MEDUSA_BACKEND_URL}${path}${buildQuery(query)}`, {
    ...request,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-publishable-api-key": MEDUSA_PUBLISHABLE_KEY,
      ...headers,
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body
        ? String((body as { message: unknown }).message)
        : `Medusa request failed with HTTP ${response.status}`;
    throw new MedusaApiError(message, response.status, body);
  }

  return body as T;
}

export interface MedusaProduct {
  id: string;
  title: string;
  handle?: string;
  description?: string | null;
  thumbnail?: string | null;
  images?: Array<{ id: string; url: string }>;
  variants?: MedusaVariant[];
  categories?: Array<{ id: string; name: string; handle: string }>;
  metadata?: Record<string, unknown> | null;
}

export interface MedusaVariant {
  id: string;
  title: string;
  sku?: string | null;
  manage_inventory?: boolean;
  allow_backorder?: boolean;
  inventory_quantity?: number;
  calculated_price?: { calculated_amount?: number; currency_code?: string };
  prices?: Array<{ amount: number; currency_code: string }>;
  metadata?: Record<string, unknown> | null;
}

export interface MedusaCategory {
  id: string;
  name: string;
  handle: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface MedusaPaymentSession {
  id: string;
  provider_id: string;
  status?: string;
  amount?: number;
  data?: Record<string, unknown>;
}

export interface MedusaPaymentCollection {
  id: string;
  payment_sessions?: MedusaPaymentSession[];
}

export interface MedusaCart {
  id: string;
  region_id?: string | null;
  sales_channel_id?: string | null;
  currency_code: string;
  email?: string | null;
  items?: Array<{
    id: string;
    title?: string;
    variant_id?: string | null;
    product_id?: string | null;
    variant_title?: string | null;
    thumbnail?: string | null;
    quantity: number;
    unit_price: number;
    subtotal?: number;
    total?: number;
    variant?: MedusaVariant;
    product?: MedusaProduct;
  }>;
  shipping_address?: Record<string, unknown> | null;
  billing_address?: Record<string, unknown> | null;
  shipping_methods?: Array<Record<string, unknown>>;
  payment_collection?: MedusaPaymentCollection | null;
  subtotal?: number;
  total?: number;
  shipping_total?: number;
  discount_total?: number;
  metadata?: Record<string, unknown> | null;
}

export interface MedusaOrder {
  id: string;
  display_id?: number;
  status?: string;
  fulfillment_status?: string;
  payment_status?: string;
  total?: number;
  currency_code?: string;
  items?: MedusaCart["items"];
  metadata?: Record<string, unknown> | null;
}

export const medusa = {
  product: {
    async list(query?: Record<string, QueryValue>) {
      return medusaRequest<{ products: MedusaProduct[]; count: number }>("/store/products", { query });
    },
    async retrieve(id: string, query?: Record<string, QueryValue>) {
      return medusaRequest<{ product: MedusaProduct }>(`/store/products/${encodeURIComponent(id)}`, { query });
    },
  },

  category: {
    async list(query?: Record<string, QueryValue>) {
      return medusaRequest<{ product_categories: MedusaCategory[]; count: number }>(
        "/store/product-categories",
        { query },
      );
    },
  },

  cart: {
    async create(payload: Record<string, unknown>) {
      return medusaRequest<{ cart: MedusaCart }>("/store/carts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    async retrieve(id: string, query?: Record<string, QueryValue>) {
      return medusaRequest<{ cart: MedusaCart }>(`/store/carts/${encodeURIComponent(id)}`, { query });
    },
    async update(id: string, payload: Record<string, unknown>) {
      return medusaRequest<{ cart: MedusaCart }>(`/store/carts/${encodeURIComponent(id)}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    async addLineItem(id: string, payload: { variant_id: string; quantity: number }) {
      return medusaRequest<{ cart: MedusaCart }>(`/store/carts/${encodeURIComponent(id)}/line-items`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    async updateLineItem(id: string, lineItemId: string, payload: { quantity: number }) {
      return medusaRequest<{ cart: MedusaCart }>(
        `/store/carts/${encodeURIComponent(id)}/line-items/${encodeURIComponent(lineItemId)}`,
        { method: "POST", body: JSON.stringify(payload) },
      );
    },
    async deleteLineItem(id: string, lineItemId: string) {
      return medusaRequest<{ parent: MedusaCart }>(
        `/store/carts/${encodeURIComponent(id)}/line-items/${encodeURIComponent(lineItemId)}`,
        { method: "DELETE" },
      );
    },
    async addShippingMethod(id: string, payload: { option_id: string; data?: Record<string, unknown> }) {
      return medusaRequest<{ cart: MedusaCart }>(
        `/store/carts/${encodeURIComponent(id)}/shipping-methods`,
        { method: "POST", body: JSON.stringify(payload) },
      );
    },
    async addPromotion(id: string, promoCode: string) {
      return medusaRequest<{ cart: MedusaCart }>(
        `/store/carts/${encodeURIComponent(id)}/promotions`,
        {
          method: "POST",
          body: JSON.stringify({ promo_codes: [promoCode] }),
        },
      );
    },
    async removePromotion(id: string, promoCode: string) {
      return medusaRequest<{ cart: MedusaCart }>(
        `/store/carts/${encodeURIComponent(id)}/promotions`,
        {
          method: "DELETE",
          body: JSON.stringify({ promo_codes: [promoCode] }),
        },
      );
    },
    async complete(id: string) {
      return medusaRequest<{ type: string; order?: MedusaOrder; cart?: MedusaCart; error?: { message?: string } }>(
        `/store/carts/${encodeURIComponent(id)}/complete`,
        { method: "POST" },
      );
    },
  },

  shipping: {
    async listOptions(cartId: string) {
      return medusaRequest<{ shipping_options: Array<{
        id: string;
        name?: string;
        price_type?: string;
        amount?: number;
      }> }>("/store/shipping-options", {
        query: { cart_id: cartId },
      });
    },
    async calculateOption(id: string, cartId: string, data?: Record<string, unknown>) {
      return medusaRequest<{ shipping_option: {
        id: string;
        amount?: number;
        price_type?: string;
      } }>(
        `/store/shipping-options/${encodeURIComponent(id)}/calculate`,
        {
          method: "POST",
          body: JSON.stringify({ cart_id: cartId, data: data || {} }),
        },
      );
    },
  },

  payment: {
    async listProviders(regionId: string) {
      return medusaRequest<{ payment_providers: Array<{ id: string; is_enabled?: boolean }> }>(
        "/store/payment-providers",
        { query: { region_id: regionId } },
      );
    },

    async createCollection(cartId: string) {
      return medusaRequest<{ payment_collection: MedusaPaymentCollection }>(
        "/store/payment-collections",
        {
          method: "POST",
          body: JSON.stringify({ cart_id: cartId }),
        },
      );
    },

    async initiatePaymentSession(
      paymentCollectionId: string,
      providerId: string,
      data?: Record<string, unknown>,
    ) {
      return medusaRequest<{ payment_collection: MedusaPaymentCollection }>(
        `/store/payment-collections/${encodeURIComponent(paymentCollectionId)}/payment-sessions`,
        {
          method: "POST",
          body: JSON.stringify({
            provider_id: providerId,
            ...(data ? { data } : {}),
          }),
        },
      );
    },
  },

  health: async () => {
    if (!medusaConfigured) return { configured: false, reachable: false };
    try {
      await medusaRequest("/store/products", { query: { limit: 1 } });
      return { configured: true, reachable: true };
    } catch {
      return { configured: true, reachable: false };
    }
  },
};
