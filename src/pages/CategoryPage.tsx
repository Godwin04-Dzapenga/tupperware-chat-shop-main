import { Link, useParams } from "react-router-dom";
import { PackageSearch } from "lucide-react";
import { useCategoryBySlug, useProducts } from "@/hooks/useCatalog";
import { ProductListing } from "@/components/store/ProductListing";

const CategoryPage = () => {
  const { slug } = useParams();
  const { category, isLoading: categoryLoading } = useCategoryBySlug(slug);
  const { data: products = [], isLoading: productsLoading } = useProducts();

  if (!categoryLoading && !category) {
    return (
      <div className="store-shell flex flex-col items-center justify-center py-24 text-center">
        <PackageSearch className="mb-4 h-12 w-12 text-slate-300" />
        <h1 className="text-2xl font-black text-bb-ink">Department not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          The category you're looking for doesn't exist or is no longer available.
        </p>
        <Link
          to="/"
          className="mt-6 rounded-md bg-bb-yellow px-6 py-2.5 text-xs font-black uppercase tracking-wide text-black hover:bg-bb-yellow-dark"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const filtered = category ? products.filter((p) => p.category_id === category.id) : [];

  return (
    <ProductListing
      title={category?.name ?? "Shop"}
      subtitle={category?.description ?? undefined}
      products={filtered}
      loading={categoryLoading || productsLoading}
      crumbs={[{ label: "Home", to: "/" }, { label: category?.name ?? "…" }]}
    />
  );
};

export default CategoryPage;
