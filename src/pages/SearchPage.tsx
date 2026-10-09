import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useProducts, useCategories } from "@/hooks/useCatalog";
import { ProductListing } from "@/components/store/ProductListing";
import type { StoreProduct } from "@/hooks/useCatalog";

const SearchPage = () => {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const dealsMode = params.get("deals") === "1";
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();

  const results = useMemo<StoreProduct[]>(() => {
    if (dealsMode) return products.filter((p) => p.savings > 0);
    if (!q) return products;

    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const matchingCategoryIds = new Set(
      categories
        .filter((c) => terms.some((t) => c.name.toLowerCase().includes(t)))
        .map((c) => c.id)
    );

    return products.filter((p) => {
      if (matchingCategoryIds.has(p.category_id || "")) return true;
      const haystack = `${p.name} ${p.brand} ${p.model_number} ${p.product_type} ${p.description || ""} ${p.variant_names.join(" ")}`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [products, categories, q, dealsMode]);

  const title = dealsMode ? "Top Deals" : q ? `Results for "${q}"` : "All Products";

  return (
    <ProductListing
      title={title}
      subtitle={dealsMode ? "Current promotions across the Tech Innovation catalogue." : "Browse laptops, phones, smart devices and accessories from our live catalogue."}
      products={results}
      loading={isLoading}
      defaultSort={dealsMode ? "savings" : "featured"}
      crumbs={[{ label: "Home", to: "/" }, { label: dealsMode ? "Top Deals" : q ? "Search" : "All Products" }]}
      emptyHint={
        q
          ? `We couldn't find anything matching "${q}". Try a brand such as HP, Lenovo or Samsung, or search for a model number.`
          : "There are no active products in the catalogue yet."
      }
    />
  );
};

export default SearchPage;
