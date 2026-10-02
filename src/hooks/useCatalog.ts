import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getProductMedia } from "@/data/solarProducts";

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
  variant_names: string[];
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
  products: ["catalog", "products"] as const,
  categories: ["catalog", "categories"] as const,
};

async function fetchCategories(): Promise<StoreCategory[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) throw error;
  return (data || []).filter((c) => !isLegacyCategory(c));
}

async function fetchProducts(): Promise<StoreProduct[]> {
  const [productsResult, variantsResult] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("product_variants")
      .select("id,product_id,name,price,stock_quantity")
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
      savings: originalPrice - price,
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
      variant_names: productVariants.map((v) => v.name),
    };
  });
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
