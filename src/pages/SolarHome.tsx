import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Cable,
  Camera,
  Cpu,
  Gamepad2,
  Headphones,
  Heart,
  Home as HomeIcon,
  Laptop,
  Monitor,
  PackageSearch,
  ShieldCheck,
  Smartphone,
  Star,
  Tablet,
  Tag,
  Truck,
  Tv,
} from "lucide-react";
import { useProducts, useCategories } from "@/hooks/useCatalog";
import { useWishlist } from "@/hooks/useWishlist";
import { resolveProductImage } from "@/data/solarProducts";

const SHOP_SHORTCUTS: Array<{
  label: string;
  slug: string;
  query: string;
  icon: typeof Laptop;
  highlight?: boolean;
}> = [
  { label: "Laptops", slug: "computers-laptops", query: "laptop", icon: Laptop },
  { label: "Desktops", slug: "computers-laptops", query: "desktop", icon: Monitor },
  { label: "Tablets", slug: "phones-tablets", query: "tablet", icon: Tablet },
  { label: "Phones", slug: "phones-tablets", query: "phone", icon: Smartphone },
  { label: "Gaming", slug: "gaming", query: "gaming", icon: Gamepad2 },
  { label: "Accessories", slug: "accessories", query: "accessories", icon: Headphones },
  { label: "Monitors", slug: "computers-laptops", query: "monitor", icon: Monitor },
  { label: "TV & Home Theater", slug: "tv-home-theatre", query: "television", icon: Tv },
  { label: "Smart Home", slug: "smart-home", query: "smart home", icon: HomeIcon },
  { label: "Deals", slug: "", query: "", icon: Tag, highlight: true },
];

const BrandMark = ({ brand }: { brand: string }) => {
  const normalized = brand.toLowerCase();
  if (normalized === "hp") {
    return <span className="flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#0096d6] text-2xl font-black italic tracking-tighter text-[#0096d6]">hp</span>;
  }
  if (normalized === "lenovo") {
    return <span className="rounded-sm bg-[#e2231a] px-3 py-1.5 text-lg font-black tracking-tight text-white">Lenovo</span>;
  }
  if (normalized === "dell") {
    return <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#007db8] text-sm font-black text-[#007db8]">DELL</span>;
  }
  if (normalized === "microsoft") {
    return (
      <span className="flex items-center gap-1.5">
        <span className="grid grid-cols-2 gap-0.5">
          <span className="h-2.5 w-2.5 bg-[#f25022]" />
          <span className="h-2.5 w-2.5 bg-[#7fba00]" />
          <span className="h-2.5 w-2.5 bg-[#00a4ef]" />
          <span className="h-2.5 w-2.5 bg-[#ffb900]" />
        </span>
        <span className="text-sm font-semibold text-slate-600">Microsoft</span>
      </span>
    );
  }
  if (normalized === "apple") {
    return <span className="text-xl font-semibold tracking-tight text-slate-900">Apple</span>;
  }
  if (normalized === "acer") {
    return <span className="text-xl font-black italic tracking-tight text-[#72a900]">acer</span>;
  }
  if (normalized === "asus") {
    return <span className="text-lg font-black italic tracking-tight text-slate-900">ASUS</span>;
  }
  if (normalized === "samsung") {
    return <span className="text-sm font-black tracking-[0.12em] text-[#1428a0]">SAMSUNG</span>;
  }
  return <span className="text-base font-black tracking-tight text-slate-700">{brand}</span>;
};

const Home = () => {
  const { data: products = [], isLoading: productsLoading, isError: productsError } = useProducts();
  const { data: categories = [] } = useCategories();
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();

  const featured = useMemo(() => {
    const marked = products.filter((product) => product.is_featured);
    return (marked.length ? marked : products).slice(0, 6);
  }, [products]);

  const brands = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((product) => {
      if (product.brand && product.brand !== "Other") {
        counts.set(product.brand, (counts.get(product.brand) || 0) + 1);
      }
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 9);
  }, [products]);

  return (
    <main className="min-h-screen bg-white pb-12">
      <section className="bg-white pt-3 sm:pt-4">
        <div className="store-shell">
          <div className="relative isolate grid min-h-[360px] overflow-hidden rounded-xl bg-[#06182c] shadow-sm sm:min-h-[340px] lg:min-h-[300px] lg:grid-cols-[0.88fr_1.42fr]">
            <div className="relative z-20 flex flex-col items-start justify-center bg-gradient-to-r from-[#06182c] via-[#06182c] to-[#06182c]/90 p-6 sm:p-9 lg:pr-3">
              <span className="inline-flex items-center gap-2 rounded-sm bg-[#087ef5] px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white">
                Featured
              </span>
              <h1 className="mt-4 max-w-xl text-3xl font-black leading-[1.08] tracking-tight text-white sm:text-4xl xl:text-[42px]">
                Power Your Ideas
                <span className="mt-1 block text-[#ffe000]">With the Right Laptop</span>
              </h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/85 sm:text-base">
                Work, create, and play with laptops and smart devices from the brands you trust.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/search?q=laptop"
                  className="inline-flex items-center gap-2 rounded-md bg-[#ffe000] px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-yellow-300"
                >
                  Shop Laptops <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 rounded-md border border-white/35 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Explore Deals
                </Link>
              </div>
            </div>

            <div className="relative min-h-[230px] overflow-hidden lg:min-h-0">
              <img
                src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1600&q=90"
                alt="Laptop on a modern desk"
                className="absolute inset-0 h-full w-full object-cover object-center"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#06182c]/45 via-transparent to-[#06182c]/65" />
              <div className="absolute bottom-4 right-4 w-36 overflow-hidden rounded-lg border-2 border-white bg-white shadow-xl sm:bottom-5 sm:right-5 sm:w-44">
                <img
                  src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=700&q=85"
                  alt="Slim laptop viewed on a desk"
                  className="h-20 w-full object-cover sm:h-24"
                  loading="lazy"
                />
                <div className="px-3 py-2 text-[11px] font-extrabold text-slate-900">Laptops for every day</div>
              </div>
              <div className="absolute right-4 top-4 hidden flex-col gap-3 text-white drop-shadow sm:flex lg:right-5 lg:top-1/2 lg:-translate-y-1/2">
                <div className="flex items-center gap-2 rounded-md bg-[#06182c]/75 px-3 py-2 backdrop-blur-sm">
                  <Truck className="h-5 w-5 shrink-0 text-[#1687ff]" />
                  <span className="text-[11px] font-bold leading-4">Fast, reliable<br />delivery</span>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-[#06182c]/75 px-3 py-2 backdrop-blur-sm">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-[#1687ff]" />
                  <span className="text-[11px] font-bold leading-4">Trusted products<br />and support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Shop departments" className="border-b border-slate-100 bg-white">
        <div className="store-shell py-5 sm:py-6">
          <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1 sm:gap-4 lg:justify-between">
            {SHOP_SHORTCUTS.map((shortcut) => {
              const Icon = shortcut.icon;
              const matchingCategory = shortcut.slug
                ? categories.find((category) => category.slug === shortcut.slug)
                : undefined;
              const destination = shortcut.label === "Deals"
                ? "/search"
                : matchingCategory
                  ? "/c/" + matchingCategory.slug
                  : "/search?q=" + encodeURIComponent(shortcut.query);

              return (
                <Link
                  key={shortcut.label}
                  to={destination}
                  className="group flex min-w-[82px] flex-1 flex-col items-center gap-2 rounded-lg px-1 py-1 text-center transition hover:bg-slate-50"
                >
                  <span className={"flex h-14 w-14 items-center justify-center rounded-full transition group-hover:-translate-y-0.5 " + (shortcut.highlight ? "bg-[#fff2a8] text-slate-950" : "bg-[#eaf3ff] text-[#0069c7] group-hover:bg-[#d7eaff]")}>
                    <Icon className="h-7 w-7 stroke-[1.8]" />
                  </span>
                  <span className="whitespace-nowrap text-[11px] font-bold text-slate-800 sm:text-xs">{shortcut.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {brands.length > 0 && (
        <section id="brands" className="store-shell pt-5 sm:pt-7">
          <div className="rounded-xl bg-[#f2f5f9] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black tracking-tight text-[#091b32] sm:text-xl">Shop by Brand</h2>
              <Link to="/search" className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#0069c7] hover:underline sm:text-sm">
                View All Brands <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-10">
              {brands.map(([brand]) => (
                <Link
                  key={brand}
                  to={"/search?q=" + encodeURIComponent(brand)}
                  aria-label={"Shop " + brand}
                  className="flex h-[70px] min-w-0 items-center justify-center rounded-lg border border-slate-100 bg-white px-2 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm sm:h-[76px]"
                >
                  <BrandMark brand={brand} />
                </Link>
              ))}
              <Link
                to="/search"
                className="flex h-[70px] flex-col items-center justify-center rounded-lg border border-slate-100 bg-white px-2 text-slate-500 transition hover:border-blue-200 hover:shadow-sm sm:h-[76px]"
              >
                <span className="text-xl font-black tracking-[0.16em]">•••</span>
                <span className="text-[10px] font-bold text-slate-700">Others</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      <section id="products" className="store-shell pt-6 sm:pt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-black tracking-tight text-[#091b32] sm:text-xl">Featured Products</h2>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">Explore the latest products in our live catalogue.</p>
          </div>
          <Link to="/search" className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-[#0069c7] hover:underline sm:text-sm">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {productsError ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <PackageSearch className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-3 font-bold text-slate-900">We couldn't load the catalogue.</p>
            <p className="mt-1 text-sm text-slate-500">Check that Medusa is running and the storefront publishable key is configured.</p>
          </div>
        ) : productsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-lg border border-slate-200 bg-white p-3">
                <div className="aspect-[4/3] rounded-md bg-slate-100" />
                <div className="mt-3 h-3 rounded bg-slate-100" />
                <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {featured.map((product) => {
              const productImage = resolveProductImage(product);
              const wishlisted = isWishlisted(product.id);
              return (
                <article
                  key={product.id}
                  className="group relative flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-2.5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg sm:p-3"
                >
                  <button
                    type="button"
                    aria-label={wishlisted ? "Remove from wishlist" : "Save product"}
                    onClick={() => toggleWishlist(product.id, product.name)}
                    className={"absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-sm transition hover:text-red-500 " + (wishlisted ? "text-red-500" : "text-slate-500")}
                  >
                    <Heart className={"h-4 w-4 " + (wishlisted ? "fill-red-500" : "")} />
                  </button>
                  <Link to={"/product/" + product.id} className="block min-w-0">
                    <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-white p-2">
                      <img
                        src={productImage}
                        alt={product.name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80";
                        }}
                        className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <p className="mt-2 truncate text-[10px] font-black uppercase tracking-wide text-[#0069c7]">
                      {product.brand && product.brand !== "Other" ? product.brand : "Tech Innovation"}
                    </p>
                    <h3 className="mt-1 line-clamp-2 min-h-9 text-xs font-semibold leading-4 text-slate-800 group-hover:text-[#0069c7]">
                      {product.name}
                    </h3>
                  </Link>
                  {product.avg_rating > 0 && product.review_count > 0 && (
                    <div className="mt-1.5 flex items-center gap-1">
                      <span className="flex items-center gap-px">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={"h-3 w-3 " + (star <= Math.round(product.avg_rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200")} />
                        ))}
                      </span>
                      <span className="text-[10px] text-slate-500">({product.review_count})</span>
                    </div>
                  )}
                  <p className="mt-2 text-base font-black tracking-tight text-[#0a376b]">{"$" + product.price.toFixed(2)}</p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <PackageSearch className="mx-auto h-9 w-9 text-slate-400" />
            <p className="mt-3 font-bold text-slate-900">No products are available yet</p>
            <p className="mt-1 text-sm text-slate-500">Publish your products in Medusa and they will appear here automatically.</p>
          </div>
        )}
      </section>

      <section className="store-shell pt-8 sm:pt-10">
        <div className="flex flex-col gap-3 rounded-xl bg-[#f2f5f9] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <h2 className="text-lg font-black text-[#091b32]">Looking for a specific model?</h2>
            <p className="mt-1 text-sm text-slate-500">Search by brand, model name or product type.</p>
          </div>
          <Link to="/search" className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0046be] px-5 py-3 text-sm font-black text-white transition hover:bg-[#003b95]">
            Browse Catalogue <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Home;
