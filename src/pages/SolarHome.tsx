import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, BatteryCharging, Bolt, CheckCircle2, ChevronDown, Menu,
  MessageCircle, Phone, Search, ShieldCheck, Sun, Wrench, X, SlidersHorizontal,
  MapPin, UserRound, Heart, PackageCheck
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/hooks/useCart";
import { ProductCard } from "@/components/ProductCard";
import { Cart } from "@/components/Cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  video_url: string | null;
  stock_quantity?: number;
  avg_rating?: number;
  review_count?: number;
  brand?: string | null;
  model_number?: string | null;
  product_type?: string;
  variant_count?: number;
  variant_names?: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const WHATSAPP = "263778158984";

const SolarHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [p, c, v] = await Promise.all([
        supabase.from("products").select("*").eq("is_active", true).order("is_featured", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("categories").select("*").eq("is_active", true).order("sort_order").order("name"),
        supabase.from("product_variants").select("id,product_id,name,price,stock_quantity").eq("is_active", true).order("sort_order"),
      ]);

      if (p.error) toast.error("Unable to load products");
      else {
        const variants = v.error ? [] : (v.data || []);
        const enriched = (p.data || []).map(product => {
          const productVariants = variants.filter(variant => variant.product_id === product.id);
          return {
            ...product,
            variant_count: productVariants.length,
            variant_names: productVariants.map(variant => variant.name),
            price: productVariants.length ? Math.min(...productVariants.map(variant => Number(variant.price))) : product.price,
          } as Product;
        });
        setProducts(enriched);
      }
      if (!c.error) setCategories(c.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const brands = useMemo(
    () => Array.from(new Set(products.map(p => p.brand).filter((b): b is string => Boolean(b)))).sort(),
    [products]
  );

  const types = useMemo(
    () => Array.from(new Set(products.map(p => p.product_type).filter((t): t is string => Boolean(t)))).sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = products.filter((p) => {
      const categoryMatch = activeCategory === "all" || p.category_id === activeCategory;
      const brandMatch = brandFilter === "all" || p.brand === brandFilter;
      const typeMatch = typeFilter === "all" || p.product_type === typeFilter;
      const searchMatch = !q || [p.name, p.description, p.brand, p.model_number, p.product_type]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
      return categoryMatch && brandMatch && typeMatch && searchMatch;
    });

    return [...result].sort((a, b) => {
      if (sort === "price-low") return a.price - b.price;
      if (sort === "price-high") return b.price - a.price;
      if (sort === "name") return a.name.localeCompare(b.name);
      return Number(Boolean(b.variant_count)) - Number(Boolean(a.variant_count));
    });
  }, [products, activeCategory, brandFilter, typeFilter, search, sort]);

  const orderViaWhatsApp = (product: Product) => {
    const text = encodeURIComponent(
      `Hello Tech Innovation, I am interested in:\n\n${product.name}\nStarting price: $${product.price.toFixed(2)}\n${product.variant_count ? "Please show me the available variants.\n" : ""}\nPlease confirm availability and installation/delivery options.`
    );
    window.open(`https://wa.me/${WHATSAPP}?text=${text}`, "_blank");
  };

  const addProduct = (product: Product) => {
    if (product.variant_count) {
      navigate(`/product/${product.id}`);
      return;
    }
    addToCart(product);
    toast.success(`${product.name} added to cart`);
  };

  const scrollToProducts = () => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#111820]">
      {/* Best Buy-inspired utility bar */}
      <div className="bg-[#003b95] text-white">
        <div className="container mx-auto flex min-h-9 items-center justify-between gap-4 px-4 text-xs">
          <p className="hidden sm:block">Solar systems • Backup power • Electronics • Installation</p>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden md:inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Harare & Zimbabwe delivery</span>
            <button onClick={() => window.open(`https://wa.me/${WHATSAPP}`, "_blank")} className="font-bold hover:underline">WhatsApp sales</button>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-[72px] items-center gap-4">
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex shrink-0 items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ffe000] text-[#111820] shadow-sm">
                <Sun className="h-6 w-6" />
              </span>
              <span className="hidden text-left sm:block">
                <span className="block text-base font-black leading-none tracking-tight">TECH INNOVATION</span>
                <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[.2em] text-[#003b95]">Solar & Electronics</span>
              </span>
            </button>

            <button onClick={scrollToProducts} className="hidden h-11 shrink-0 items-center gap-2 rounded-md bg-[#0046be] px-4 text-sm font-bold text-white hover:bg-[#003b95] lg:flex">
              <Menu className="h-4 w-4" /> Departments
            </button>

            <div className="relative hidden flex-1 md:block">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="What can we help you find?"
                className="h-11 rounded-md border-2 border-[#0046be] bg-white pl-11 pr-12 text-sm shadow-none focus-visible:ring-0"
              />
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X className="h-4 w-4" /></button>}
            </div>

            <div className="ml-auto flex items-center gap-1">
              <button className="hidden rounded-md p-2.5 hover:bg-slate-100 sm:block" title="Saved products"><Heart className="h-5 w-5" /></button>
              <button onClick={() => navigate(user ? "/account" : "/auth")} className="hidden rounded-md p-2.5 hover:bg-slate-100 sm:block" title="Account"><UserRound className="h-5 w-5" /></button>
              <Cart />
              <button className="rounded-md p-2.5 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button>
            </div>
          </div>

          <nav className="hidden border-t py-2 lg:flex lg:items-center lg:gap-5">
            {categories.slice(0, 9).map(category => (
              <button
                key={category.id}
                onClick={() => { setActiveCategory(category.id); scrollToProducts(); }}
                className="text-xs font-semibold text-slate-700 hover:text-[#0046be]"
              >
                {category.name}
              </button>
            ))}
            <button onClick={() => { setActiveCategory("all"); scrollToProducts(); }} className="ml-auto text-xs font-bold text-[#0046be]">View all</button>
          </nav>

          {mobileOpen && (
            <div className="border-t py-4 lg:hidden">
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search solar & electronics" className="mb-3 h-10" />
              <div className="grid grid-cols-2 gap-2">
                {categories.map(category => (
                  <button key={category.id} onClick={() => { setActiveCategory(category.id); setMobileOpen(false); scrollToProducts(); }} className="rounded-md border bg-slate-50 px-3 py-2 text-left text-xs font-semibold">{category.name}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main>
        {/* Promotional hero */}
        <section className="bg-[#071c38] text-white">
          <div className="container mx-auto grid min-h-[430px] items-center gap-8 px-4 py-12 lg:grid-cols-[1.1fr_.9fr]">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-sm bg-[#ffe000] px-3 py-1 text-xs font-black uppercase tracking-wide text-[#111820]">Power Week</span>
              <h1 className="mt-5 text-4xl font-black leading-[1.02] sm:text-5xl lg:text-6xl">Build your power system with the right equipment.</h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/70">Shop panels, hybrid inverters, batteries, complete kits and electronics. Compare real variants, technical specifications, stock and prices before you buy.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button onClick={scrollToProducts} className="h-11 rounded-md bg-[#ffe000] px-6 font-black text-[#111820] hover:bg-yellow-300">Shop solar <ArrowRight className="ml-2 h-4 w-4" /></Button>
                <Button onClick={() => window.open(`https://wa.me/${WHATSAPP}`, "_blank")} variant="outline" className="h-11 rounded-md border-white/30 bg-white/5 px-6 font-bold text-white hover:bg-white/10"><MessageCircle className="mr-2 h-4 w-4" /> Talk to an expert</Button>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/70">
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#ffe000]" /> Genuine equipment</span>
                <span className="inline-flex items-center gap-2"><Wrench className="h-4 w-4 text-[#ffe000]" /> Installation available</span>
                <span className="inline-flex items-center gap-2"><PackageCheck className="h-4 w-4 text-[#ffe000]" /> Local support</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Sun, title: "Solar panels", text: "450W • 550W • 600W+" },
                { icon: Bolt, title: "Inverters", text: "3.2kVA • 5kVA • 8kVA" },
                { icon: BatteryCharging, title: "Batteries", text: "100Ah • 200Ah • 5kWh+" },
                { icon: ShieldCheck, title: "Complete kits", text: "Designed & supported" },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-lg border border-white/10 bg-white/[.06] p-5 backdrop-blur">
                  <Icon className="h-7 w-7 text-[#ffe000]" />
                  <p className="mt-8 text-sm font-black">{title}</p>
                  <p className="mt-1 text-xs text-white/50">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Category rail */}
        <section className="border-b bg-white">
          <div className="container mx-auto overflow-x-auto px-4">
            <div className="flex min-w-max gap-1 py-4">
              <button onClick={() => setActiveCategory("all")} className={`rounded-full px-4 py-2 text-xs font-bold ${activeCategory === "all" ? "bg-[#0046be] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>All products</button>
              {categories.map(c => (
                <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`rounded-full px-4 py-2 text-xs font-bold ${activeCategory === c.id ? "bg-[#0046be] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{c.name}</button>
              ))}
            </div>
          </div>
        </section>

        {/* Store */}
        <section id="products" className="container mx-auto px-4 py-8">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#0046be]">Shop Tech Innovation</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">Solar, backup power & electronics</h2>
              <p className="mt-1 text-sm text-slate-500">{filteredProducts.length} products available</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-10 gap-2 rounded-md md:hidden" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal className="h-4 w-4" /> Filters</Button>
              <div className="relative">
                <select value={sort} onChange={e => setSort(e.target.value)} className="h-10 appearance-none rounded-md border bg-white pl-3 pr-9 text-xs font-semibold outline-none">
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[210px_1fr]">
            <aside className={`${showFilters ? "block" : "hidden"} rounded-lg border bg-white p-4 lg:block lg:h-fit`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-black">Filter by</h3>
                {(brandFilter !== "all" || typeFilter !== "all") && <button onClick={() => { setBrandFilter("all"); setTypeFilter("all"); }} className="text-[10px] font-bold text-[#0046be]">Clear</button>}
              </div>
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Brand</p>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2 text-xs"><input type="radio" checked={brandFilter === "all"} onChange={() => setBrandFilter("all")} /> All brands</label>
                    {brands.map(brand => <label key={brand} className="flex cursor-pointer items-center gap-2 text-xs"><input type="radio" checked={brandFilter === brand} onChange={() => setBrandFilter(brand)} /> {brand}</label>)}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Product type</p>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2 text-xs"><input type="radio" checked={typeFilter === "all"} onChange={() => setTypeFilter("all")} /> All types</label>
                    {types.map(type => <label key={type} className="flex cursor-pointer items-center gap-2 text-xs"><input type="radio" checked={typeFilter === type} onChange={() => setTypeFilter(type)} /> {type.replaceAll("_", " ")}</label>)}
                  </div>
                </div>
              </div>
            </aside>

            <div>
              {loading ? (
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="animate-pulse"><div className="aspect-square rounded bg-slate-200" /><div className="mt-3 h-3 w-1/3 rounded bg-slate-200" /><div className="mt-2 h-4 w-4/5 rounded bg-slate-200" /><div className="mt-2 h-5 w-1/3 rounded bg-slate-200" /></div>)}</div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-lg border bg-white px-6 py-20 text-center">
                  <Search className="mx-auto h-10 w-10 text-slate-300" />
                  <h3 className="mt-4 text-lg font-black">No matching products</h3>
                  <p className="mt-1 text-sm text-slate-500">Try another search or clear your filters.</p>
                  <Button onClick={() => { setSearch(""); setActiveCategory("all"); setBrandFilter("all"); setTypeFilter("all"); }} className="mt-5 rounded-md bg-[#0046be]">Clear filters</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map(product => (
                    <ProductCard key={product.id} product={product} onOrder={orderViaWhatsApp} onAddToCart={addProduct} />
                  ))}
                </div>
              )}

              <div className="mt-12 grid gap-3 border-t pt-8 sm:grid-cols-3">
                {[
                  { icon: ShieldCheck, title: "Quality checked", text: "Product information and stock are managed from our catalogue." },
                  { icon: Wrench, title: "Installation support", text: "Ask about system design and professional installation." },
                  { icon: MessageCircle, title: "Zimbabwe support", text: "Talk to our team on WhatsApp before you buy." },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex gap-3 rounded-lg border bg-white p-4">
                    <Icon className="h-5 w-5 shrink-0 text-[#0046be]" />
                    <div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border-y">
          <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-3">
            <div><p className="text-xs font-black uppercase tracking-widest text-[#0046be]">Need help choosing?</p><h3 className="mt-2 text-xl font-black">Build the right solar system.</h3><p className="mt-2 text-sm leading-6 text-slate-500">Send us your appliances and usage requirements and we can help you size your system.</p><button onClick={() => window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("I need help sizing a solar system.")}`, "_blank")} className="mt-4 text-sm font-bold text-[#0046be]">Request a system quote →</button></div>
            <div><p className="text-xs font-black uppercase tracking-widest text-[#0046be]">Compare variants</p><h3 className="mt-2 text-xl font-black">One product. Multiple configurations.</h3><p className="mt-2 text-sm leading-6 text-slate-500">Choose panel wattage, inverter capacity, battery capacity or other technical options from the product page.</p><button onClick={scrollToProducts} className="mt-4 text-sm font-bold text-[#0046be]">Browse products →</button></div>
            <div><p className="text-xs font-black uppercase tracking-widest text-[#0046be]">Contact</p><h3 className="mt-2 text-xl font-black">Tech Innovation Zimbabwe</h3><p className="mt-2 text-sm leading-6 text-slate-500">0778158984 • 0784721912<br />infotitechinnovations@gmail.com</p><button onClick={() => window.open(`https://wa.me/${WHATSAPP}`, "_blank")} className="mt-4 text-sm font-bold text-[#0046be]">Chat on WhatsApp →</button></div>
          </div>
        </section>
      </main>

      <footer className="bg-[#071c38] py-10 text-white">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-4">
          <div className="md:col-span-2"><div className="flex items-center gap-2 font-black"><span className="flex h-8 w-8 items-center justify-center rounded bg-[#ffe000] text-[#111820]"><Sun className="h-4 w-4" /></span> TECH INNOVATION</div><p className="mt-3 max-w-md text-sm leading-6 text-white/55">Solar power, backup systems, batteries, inverters and electronics for homes and businesses in Zimbabwe.</p></div>
          <div><p className="font-bold">Shop</p><div className="mt-3 space-y-2 text-xs text-white/55"><button onClick={() => setActiveCategory("solar-panels")} className="block hover:text-white">Solar panels</button><button onClick={() => setActiveCategory("inverters")} className="block hover:text-white">Inverters</button><button onClick={() => setActiveCategory("batteries")} className="block hover:text-white">Batteries</button><button onClick={() => setActiveCategory("solar-kits")} className="block hover:text-white">Solar kits</button></div></div>
          <div><p className="font-bold">Support</p><div className="mt-3 space-y-2 text-xs text-white/55"><Link to="/about" className="block hover:text-white">About Tech Innovation</Link><a href="tel:0778158984" className="block hover:text-white"><Phone className="mr-1 inline h-3 w-3" />0778158984</a><a href="mailto:infotitechinnovations@gmail.com" className="block hover:text-white">infotitechinnovations@gmail.com</a></div></div>
        </div>
        <div className="container mx-auto mt-8 border-t border-white/10 px-4 pt-5 text-xs text-white/30">© {new Date().getFullYear()} Tech Innovation. Solar & Electronics.</div>
      </footer>
    </div>
  );
};

export default SolarHome;
