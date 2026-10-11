import { medusaConfigured } from "@/lib/medusa";

export type CommerceProvider = "medusa" | "supabase";

export const commerceProvider: CommerceProvider =
  medusaConfigured && (process.env.NEXT_PUBLIC_COMMERCE_CATALOG_PROVIDER || "medusa") === "medusa"
    ? "medusa"
    : "supabase";

export const isMedusaCommerce = commerceProvider === "medusa";
