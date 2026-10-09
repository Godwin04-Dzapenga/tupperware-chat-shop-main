import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Cable,
  Camera,
  CheckCircle2,
  Cpu,
  Gamepad2,
  Headphones,
  Laptop,
  PackageSearch,
  Smartphone,
  Tv,
} from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useCatalog";
import { ProductCard } from "@/components/ProductCard";
import { useStoreUI } from "@/hooks/useStoreUI";
import { useStoreActions } from "@/hooks/useStoreActions";

const CATEGORY_ICONS: Record<string, typeof Laptop> = {
  "computers-laptops": Laptop,
  "phones-tablets": Smartphone,
  "tv-home-theatre": Tv,
  "audio-headphones": Headphones,
  gaming: Gamepad2,
  "cameras-printers": Camera,
  accessories: Cable,
  "smart-home": Cpu,
  "electronics-gadgets": PackageSearch,
};

const Home = () => {
  const { data: products = [], isLoading: productsLoading, isError: productsError } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { compareProducts, toggleCompare, setQuickViewProduct } = useStoreUI();
  const { addProduct, orderViaWhatsApp } = useStoreActions();

  const featured = useMemo(() => {
    const marked = products.filter((product) => product.is_featured);
    return (marked.length ? marked : products).slice(0, 8);
  }, [products]);

  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      if (product.brand && product.brand !== "Other") counts.set(product.brand, (counts.get(product.brand) || 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8);
  }, [products]);

  return (
    <main className="min-h-screen bg-slate-50 pb-12">
      <section className="bg-bb-blue text-white">
        <div className="store-shell grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4 text-bb-yellow" />
              Tech Innovation online store
            </div>
            <h1 className="max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              The tech you need. <span className="text-bb-yellow">All in one place.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
              Explore laptops, phones, smart devices and accessories from the products currently available in our catalogue.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/search" className="inline-flex items-center gap-2 rounded-md bg-bb-yellow px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-yellow-300">
                Shop all products <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/search?q=laptop" className="inline-flex items-center gap-2 rounded-md border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                Explore laptops
              </Link>
            </div>
          </div>
          <div className="hidden grid-cols-2 gap-3 sm:grid lg:grid">
            <div className="rounded-xl border border-white/15 bg-white/10 p-5">
              <Laptop className="mb-5 h-8 w-8 text-bb-yellow" />
              <p className="text-lg font-extrabold">Computers</p>
              <p className="mt-1 text-xs text-white/70">Laptops and everyday essentials</p>
            </div>
            <div className="mt-7 rounded-xl border border-white/15 bg-white/10 p-5">
              <Smartphone className="mb-5 h-8 w-8 text-bb-yellow" />
              <p className="text-lg font-extrabold">Smart devices</p>
              <p className="mt-1 text-xs text-white/70">Devices for work and life</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 p-5">
              <Headphones className="mb-5 h-8 w-8 text-bb-yellow" />
              <p className="text-lg font-extrabold">Audio</p>
              <p className="mt-1 text-xs text-white/70">Sound and accessories</p>
            </div>
            <div className="mt-7 rounded-xl border border-white/15 bg-white/10 p-5">
              <Cpu className="mb-5 h-8 w-8 text-bb-yellow" />
              <p className="text-lg font-extrabold">Electronics</p>
              <p className="mt-1 text-xs text-white/70">Useful tech for every day</p>
            </div>
          </div>
        </div>
      </section>

      <section className="store-shell pt-8 sm:pt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-bb-blue">Shop by department</p>
            <h2 className="mt-1 text-xl font-black text-bb-ink sm:text-2xl">Find what you need</h2>
          </div>
          <Link to="/search" className="hidden items-center gap-1 text-sm font-bold text-bb-blue hover:underline sm:inline-flex">
            All products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {categoriesLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl border bg-white" />)}
          </div>
        ) : categories.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => {
              const Icon = CATEGORY_ICONS[category.slug] || Cpu;
              const count = products.filter((product) => product.category_id === category.id).length;
              return (
                <Link key={category.id} to={`/c/${category.slug}`} className="group flex min-h-28 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-bb-blue/40 hover:shadow-md">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-bb-blue transition group-hover:bg-bb-blue group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-extrabold text-bb-ink">{category.name}</span>
                    <span className="mt-1 block text-xs text-slate-500">{count} {count === 1 ? "product" : "products"}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <PackageSearch className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 font-bold text-bb-ink">Your departments will appear here</p>
            <p className="mt-1 text-sm text-slate-500">Add products in Medusa and they will be grouped automatically.</p>
          </div>
        )}
      </section>

      {brands.length > 0 && (
        <section id="brands" className="store-shell pt-9">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-bb-blue">Shop by brand</p>
            <h2 className="mt-1 text-xl font-black text-bb-ink sm:text-2xl">Brands in our catalogue</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {brands.map(([brand, count]) => (
              <Link key={brand} to={`/search?q=${encodeURIComponent(brand)}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-bb-blue hover:text-bb-blue">
                {brand}<span className="text-xs font-medium text-slate-400">{count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="products" className="store-shell pt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-bb-blue">From our live catalogue</p>
            <h2 className="mt-1 text-xl font-black text-bb-ink sm:text-2xl">Featured products</h2>
            <p className="mt-1 text-sm text-slate-500">Products and prices are loaded from Medusa.</p>
          </div>
          <Link to="/search" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-bb-blue hover:underline">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {productsError ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <p className="font-bold text-bb-ink">We couldn't load the catalogue.</p>
            <p className="mt-1 text-sm text-slate-500">Check that Medusa is running and the storefront publishable key is configured.</p>
          </div>
        ) : productsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-3"><div className="aspect-square rounded-lg bg-slate-100" /><div className="mt-3 h-4 rounded bg-slate-100" /><div className="mt-2 h-5 w-1/3 rounded bg-slate-100" /></div>)}
          </div>
        ) : featured.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOrder={orderViaWhatsApp}
                onQuickView={setQuickViewProduct}
                onAddToCart={addProduct}
                isCompared={compareProducts.some((item) => item.id === product.id)}
                onToggleCompare={toggleCompare}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <PackageSearch className="mx-auto h-9 w-9 text-slate-400" />
            <p className="mt-3 font-bold text-bb-ink">No products are available yet</p>
            <p className="mt-1 text-sm text-slate-500">Publish your products in Medusa and they will appear here automatically.</p>
          </div>
        )}
      </section>

      <section className="store-shell pt-10">
        <div className="flex flex-col gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <h2 className="text-lg font-black text-bb-ink">Looking for a specific model?</h2>
            <p className="mt-1 text-sm text-slate-500">Search by brand, model name or product type.</p>
          </div>
          <Link to="/search" className="inline-flex items-center justify-center gap-2 rounded-md bg-bb-blue px-5 py-3 text-sm font-black text-white transition hover:bg-bb-blue-deep">
            Browse catalogue <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Home;
