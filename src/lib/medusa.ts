const MEDUSA_BACKEND_URL = (import.meta.env.VITE_MEDUSA_BACKEND_URL || "").replace(/\/$/, "");
const MEDUSA_PUBLISHABLE_KEY = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY || "";

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

export interface MedusaCart {
  id: string;
  currency_code: string;
  email?: string | null;
  items?: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    subtotal?: number;
    total?: number;
    variant?: MedusaVariant;
    product?: MedusaProduct;
  }>;
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
    async retrieve(id: string) {
      return medusaRequest<{ cart: MedusaCart }>(`/store/carts/${encodeURIComponent(id)}`);
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
      return medusaRequest<{ parent?: MedusaCart; cart?: MedusaCart }>(
        `/store/carts/${encodeURIComponent(id)}/line-items/${encodeURIComponent(lineItemId)}`,
        { method: "DELETE" },
      );
    },
    async complete(id: string) {
      return medusaRequest<{ type: string; order?: MedusaOrder; cart?: MedusaCart }>(
        `/store/carts/${encodeURIComponent(id)}/complete`,
        { method: "POST" },
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
