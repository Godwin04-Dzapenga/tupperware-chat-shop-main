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
    if (!q) return [];

    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    const matchingCategoryIds = new Set(
      categories
        .filter((c) => terms.some((t) => c.name.toLowerCase().includes(t)))
        .map((c) => c.id)
    );

    return products.filter((p) => {
      if (matchingCategoryIds.has(p.category_id || "")) return true;
      const haystack = `${p.name} ${p.brand} ${p.model_number} ${p.product_type} ${
        p.description || ""
      }`.toLowerCase();
      return terms.every((t) => haystack.includes(t));
    });
  }, [products, categories, q, dealsMode]);

  const title = dealsMode
    ? "Top Deals"
    : q
      ? `Results for "${q}"`
      : "Search";

  return (
    <ProductListing
      title={title}
      products={results}
      loading={isLoading}
      defaultSort={dealsMode ? "savings" : "featured"}
      crumbs={[{ label: "Home", to: "/" }, { label: dealsMode ? "Top Deals" : "Search" }]}
      emptyHint={
        q
          ? `We couldn't find anything matching "${q}". Try a different term like "inverter", "battery" or "panel".`
          : "Enter a search term in the search bar above to find products."
      }
    />
  );
};

export default SearchPage;
