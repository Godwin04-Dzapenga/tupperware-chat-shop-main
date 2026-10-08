import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getProductMedia } from "@/data/solarProducts";
import { commerceProvider } from "@/lib/commerce";
import { medusa, type MedusaVariant } from "@/lib/medusa";

export interface StoreProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number;
  savings: number;
  category_id: string | null;
  image_url: string | null;
  video_url: string | null;
  stock_quantity: number;
  is_featured: boolean;
  avg_rating: number;
  review_count: number;
  brand: string;
  model_number: string;
  product_type: string;
  variant_count: number;
  default_variant_id: string | null;
  variant_names: string[];
  power_watts: number | null;
  voltage: string | null;
  capacity: string | null;
  warranty_months: number | null;
  installation_required: boolean;
  specifications: Record<string, unknown>;
  variant_attributes: Record<string, string[]>;
}

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

const LEGACY_PRODUCT_PATTERNS = ["eco bottle", "tupperware"];
const LEGACY_CATEGORY_PATTERNS = ["bottle", "container", "lunch", "bowl"];

export const isLegacyCategory = (category: { name: string }) => {
  const name = category.name.toLowerCase();
  return LEGACY_CATEGORY_PATTERNS.some((pattern) => name.includes(pattern));
};

export const catalogKeys = {
  products: ["catalog", "products", commerceProvider] as const,
  categories: ["catalog", "categories", commerceProvider] as const,
};

const metadataString = (metadata: Record<string, unknown> | null | undefined, key: string) => {
  const value = metadata?.[key];
  return value === undefined || value === null ? "" : String(value);
};

const metadataNumber = (metadata: Record<string, unknown> | null | undefined, key: string) => {
  const value = metadata?.[key];
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function toMajorCurrencyAmount(amount: number | undefined) {
  if (amount === undefined || !Number.isFinite(amount)) return 0;
  // Medusa amounts are represented in the currency's smallest unit.
  return amount / 100;
}

function variantPriceInMajorUnits(variant: MedusaVariant) {
  const calculated = variant.calculated_price?.calculated_amount;
  if (calculated !== undefined && Number.isFinite(Number(calculated))) {
    return toMajorCurrencyAmount(Number(calculated));
  }

  const fallback = variant.prices?.[0]?.amount;
  if (fallback !== undefined && Number.isFinite(Number(fallback))) {
    return toMajorCurrencyAmount(Number(fallback));
  }

  return 0;
}

async function fetchSupabaseCategories(): Promise<StoreCategory[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) throw error;
  return (data || []).filter((c) => !isLegacyCategory(c));
}

async function fetchMedusaCategories(): Promise<StoreCategory[]> {
  const { product_categories } = await medusa.category.list({ limit: 100, offset: 0 });
  return (product_categories || [])
    .filter((category) => !isLegacyCategory({ name: category.name }))
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.handle,
      description: category.description ?? null,
      image_url: metadataString(category.metadata, "image_url") || null,
    }));
}

async function fetchSupabaseProducts(): Promise<StoreProduct[]> {
  const [productsResult, variantsResult] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("product_variants")
      .select("id,product_id,name,price,stock_quantity,attributes")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  if (productsResult.error) throw productsResult.error;

  const variants = variantsResult.error ? [] : variantsResult.data || [];
  const products = (productsResult.data || []).filter((p) => {
    const name = p.name.toLowerCase();
    return !LEGACY_PRODUCT_PATTERNS.some((pattern) => name.includes(pattern));
  });

  return products.map((product) => {
    const productVariants = variants.filter((v) => v.product_id === product.id);
    const media = getProductMedia(product);
    const price = productVariants.length
      ? Math.min(...productVariants.map((v) => Number(v.price)))
      : product.price;
    const originalPrice =
      media.originalPrice > price ? media.originalPrice : Math.round(price * 1.18);

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price,
      original_price: originalPrice,
      savings: Math.max(0, originalPrice - price),
      category_id: product.category_id,
      image_url: media.imageUrl,
      video_url: product.video_url,
      stock_quantity: product.stock_quantity ?? 0,
      is_featured: product.is_featured ?? false,
      avg_rating: product.avg_rating || 4.9,
      review_count: product.review_count || 16,
      brand: product.brand || media.brand.split("/")[0],
      model_number: product.model_number || media.modelNumber,
      product_type: product.product_type || "",
      variant_count: productVariants.length,
      default_variant_id: productVariants[0]?.id ?? null,
      variant_names: productVariants.map((v) => v.name),
      power_watts: product.power_watts ?? null,
      voltage: product.voltage ?? null,
      capacity: product.capacity ?? null,
      warranty_months: product.warranty_months ?? null,
      installation_required: Boolean(product.installation_required),
      specifications:
        product.specifications && typeof product.specifications === "object" && !Array.isArray(product.specifications)
          ? (product.specifications as Record<string, unknown>)
          : {},
      variant_attributes: productVariants.reduce<Record<string, string[]>>((acc, variant) => {
        if (!variant.attributes || typeof variant.attributes !== "object" || Array.isArray(variant.attributes)) return acc;
        Object.entries(variant.attributes as Record<string, unknown>).forEach(([key, value]) => {
          const values = Array.isArray(value) ? value.map(String) : [String(value)];
          acc[key] = Array.from(new Set([...(acc[key] || []), ...values]));
        });
        return acc;
      }, {}),
    };
  });
}

async function fetchMedusaProducts(): Promise<StoreProduct[]> {
  const regionId = import.meta.env.VITE_MEDUSA_REGION_ID || undefined;
  const { products } = await medusa.product.list({
    limit: 100,
    offset: 0,
    ...(regionId ? { region_id: regionId } : {}),
    fields: "*variants,*variants.calculated_price,+variants.inventory_quantity,*images,*categories",
  });

  return (products || [])
    .filter((product) => !LEGACY_PRODUCT_PATTERNS.some((pattern) => product.title.toLowerCase().includes(pattern)))
    .map((product) => {
      const metadata = product.metadata || {};
      const variants = product.variants || [];
      const prices = variants
        .map(variantPriceInMajorUnits)
        .filter((value) => value > 0);
      const price = prices.length ? Math.min(...prices) : 0;
      // Only show a comparison price when the catalogue explicitly supplies one.
      // Never invent a discount in the storefront.
      const originalPrice = metadataNumber(metadata, "original_price") ?? price;
      const hasUnlimitedVariant = variants.some((variant) => variant.manage_inventory === false);
      const stockQuantity = hasUnlimitedVariant
        ? 999999
        : variants.reduce(
            (sum, variant) => sum + Math.max(0, Number(variant.inventory_quantity ?? 0)),
            0
          );
      const defaultVariantId =
        variants.find(
          (variant) =>
            variant.manage_inventory === false ||
            variant.allow_backorder === true ||
            Number(variant.inventory_quantity ?? 0) > 0
        )?.id ?? variants[0]?.id ?? null;

      const variantAttributes = variants.reduce<Record<string, string[]>>((acc, variant) => {
        const attributes = variant.metadata?.attributes;
        if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) return acc;
        Object.entries(attributes as Record<string, unknown>).forEach(([key, value]) => {
          const values = Array.isArray(value) ? value.map(String) : [String(value)];
          acc[key] = Array.from(new Set([...(acc[key] || []), ...values]));
        });
        return acc;
      }, {});

      return {
        id: product.id,
        name: product.title,
        description: product.description ?? null,
        price,
        original_price: originalPrice,
        savings: Math.max(0, originalPrice - price),
        category_id: product.categories?.[0]?.id ?? null,
        image_url: product.thumbnail ?? product.images?.[0]?.url ?? null,
        video_url: metadataString(metadata, "video_url") || null,
        stock_quantity: stockQuantity,
        is_featured: metadataString(metadata, "is_featured") === "true",
        avg_rating: metadataNumber(metadata, "avg_rating") ?? 0,
        review_count: metadataNumber(metadata, "review_count") ?? 0,
        brand: metadataString(metadata, "brand"),
        model_number: metadataString(metadata, "model_number"),
        product_type: metadataString(metadata, "product_type"),
        variant_count: variants.length,
        default_variant_id: defaultVariantId,
        variant_names: variants.map((variant) => variant.title),
        power_watts: metadataNumber(metadata, "power_watts"),
        voltage: metadataString(metadata, "voltage") || null,
        capacity: metadataString(metadata, "capacity") || null,
        warranty_months: metadataNumber(metadata, "warranty_months"),
        installation_required: metadataString(metadata, "installation_required") === "true",
        specifications:
          metadata.specifications && typeof metadata.specifications === "object" && !Array.isArray(metadata.specifications)
            ? (metadata.specifications as Record<string, unknown>)
            : {},
        variant_attributes: variantAttributes,
      };
    });
}

async function fetchCategories(): Promise<StoreCategory[]> {
  return commerceProvider === "medusa" ? fetchMedusaCategories() : fetchSupabaseCategories();
}

async function fetchProducts(): Promise<StoreProduct[]> {
  return commerceProvider === "medusa" ? fetchMedusaProducts() : fetchSupabaseProducts();
}

export function useProducts() {
  return useQuery({
    queryKey: catalogKeys.products,
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: catalogKeys.categories,
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryBySlug(slug: string | undefined) {
  const { data: categories, ...rest } = useCategories();
  const category = categories?.find((c) => c.slug === slug);
  return { category, categories, ...rest };
}
