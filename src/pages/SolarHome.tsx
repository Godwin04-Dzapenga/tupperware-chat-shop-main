import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BatteryCharging, Bolt, CheckCircle2, ChevronDown, Menu, MessageCircle, Phone, Search, ShieldCheck, Sun, Wrench, X } from "lucide-react";
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
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const WHATSAPP = "263778158984";
const PHONE_2 = "0784721912";

const SolarHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [p, c] = await Promise.all([
        supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("categories").select("*").eq("is_active", true).order("sort_order").order("name"),
      ]);
      if (p.error) toast.error("Unable to load products");
      else setProducts(p.data || []);
      if (!c.error) setCategories(c.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filteredProducts = useMemo(() => products.filter((p) => {
    const categoryMatch = activeCategory === "all" || p.category_id === activeCategory;
    const q = search.trim().toLowerCase();
    return categoryMatch && (!q || p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
  }), [products, activeCategory, search]);

  const orderViaWhatsApp = (product: Product) => {
    const text = encodeURIComponent(
      `Hello Tech Innovation, I am interested in:\n\n${product.name}\nPrice: $${product.price.toFixed(2)}\n\nPlease confirm availability and installation/delivery options.`
    );
    window.open(`https://wa.me/${WHATSAPP}?text=${text}`, "_blank");
  };

  const addProduct = (product: Product) => {
    addToCart(product);
    toast.success(`${product.name} added to quote cart`);
  };

  const scrollToProducts = () => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 text-white backdrop-blur-xl">
        <div className="bg-amber-400 px-4 py-1.5 text-center text-[11px] font-bold tracking-wide text-slate-950">
          Solar • Backup Power • Batteries • Inverters • Electronics • Installation
        </div>
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2 font-black tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500 text-slate-950 shadow-lg">
              <Sun className="h-5 w-5" />
            </span>
            <span className="hidden sm:block">TECH <span className="text-amber-300">INNOVATION</span></span>
          </button>

          <nav className="ml-4 hidden items-center gap-1 md:flex">
            <button onClick={scrollToProducts} className="rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">Shop</button>
            <Link to="/about" className="rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">About</Link>
            <button onClick={() => window.open(`https://wa.me/${WHATSAPP}`, "_blank")} className="rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">Get a Quote</button>
          </nav>

          <div className="ml-auto hidden max-w-sm flex-1 md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search solar & electronics..." className="h-9 rounded-full border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/40" />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 md:ml-2">
            <Cart />
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => navigate("/account")} className="hidden text-white sm:flex">Account</Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="hidden text-white sm:flex">Sign in</Button>
            )}
            <button className="rounded-lg p-2 hover:bg-white/5 md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/10 px-4 py-4 md:hidden">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="h-10 rounded-full border-white/10 bg-white/5 pl-9 text-white" />
            </div>
            <div className="grid gap-1">
              <button onClick={() => { scrollToProducts(); setMobileOpen(false); }} className="rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5">Shop</button>
              <Link to="/about" className="rounded-lg px-3 py-2 text-sm hover:bg-white/5">About</Link>
              <button onClick={() => window.open(`https://wa.me/${WHATSAPP}`, "_blank")} className="rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5">WhatsApp / Quote</button>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 75% 30%, rgba(251,191,36,.35), transparent 28%), radial-gradient(circle at 20% 80%, rgba(14,165,233,.2), transparent 30%)" }} />
          <div className="container relative mx-auto grid min-h-[600px] items-center gap-12 px-4 py-20 lg:grid-cols-2">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-amber-200">
                <Sun className="h-4 w-4" /> Power your home. Power your business.
              </div>
              <h1 className="max-w-3xl text-5xl font-black leading-[.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Reliable power for a <span className="text-amber-300">brighter</span> Zimbabwe.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/65 sm:text-lg">
                Shop solar panels, inverters, batteries, backup systems and quality electronics. Get professional advice, supply, installation and after-sales support from one team.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button onClick={scrollToProducts} size="lg" className="rounded-full bg-amber-400 px-7 font-bold text-slate-950 hover:bg-amber-300">Shop products <ArrowRight className="ml-2 h-4 w-4" /></Button>
                <Button onClick={() => window.open(`https://wa.me/${WHATSAPP}`, "_blank")} size="lg" variant="outline" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10"><MessageCircle className="mr-2 h-4 w-4" /> Get a solar quote</Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-5 text-xs font-semibold text-white/60">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-300" /> Quality equipment</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-300" /> Installation support</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-300" /> Harare delivery</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute inset-8 rounded-full bg-amber-400/20 blur-3xl" />
              <div className="relative grid grid-cols-2 gap-3">
                {[
                  { icon: Sun, title: "Solar", text: "Panels & complete systems" },
                  { icon: BatteryCharging, title: "Batteries", text: "Reliable energy storage" },
                  { icon: Bolt, title: "Inverters", text: "Stable backup power" },
                  { icon: Wrench, title: "Installation", text: "Professional setup" },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-3xl border border-white/10 bg-white/[.06] p-6 backdrop-blur-xl">
                    <Icon className="mb-8 h-8 w-8 text-amber-300" />
                    <p className="font-bold text-white">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/50">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-8">
          <div className="container mx-auto grid gap-4 px-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "Quality equipment", text: "Products selected for dependable everyday use" },
              { icon: Wrench, title: "Installation support", text: "From advice to professional setup" },
              { icon: BatteryCharging, title: "Backup power", text: "Keep essential loads running" },
              { icon: MessageCircle, title: "Local support", text: "Fast help through WhatsApp and phone" },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border bg-slate-50 p-5">
                <Icon className="mb-4 h-6 w-6 text-amber-500" />
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="products" className="bg-slate-50 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[.25em] text-amber-600">Online shop</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight">Solar & electronics</h2>
                <p className="mt-2 max-w-xl text-sm text-slate-500">Browse available equipment, compare products and build your backup-power setup.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setActiveCategory("all")} className={`rounded-full border px-4 py-2 text-xs font-bold ${activeCategory === "all" ? "border-slate-950 bg-slate-950 text-white" : "bg-white"}`}>All</button>
                {categories.slice(0, 6).map((c) => (
                  <button key={c.id} onClick={() => setActiveCategory(c.id)} className={`rounded-full border px-4 py-2 text-xs font-bold ${activeCategory === c.id ? "border-slate-950 bg-slate-950 text-white" : "bg-white"}`}>{c.name}</button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-5 md:grid-cols-4"><div className="col-span-full py-20 text-center text-sm text-slate-500">Loading products...</div></div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-3xl border bg-white px-6 py-20 text-center">
                <Sun className="mx-auto h-10 w-10 text-amber-400" />
                <h3 className="mt-4 text-xl font-bold">No products yet</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Add your solar and electronics catalogue from the admin dashboard. Your storefront will update automatically.</p>
                <Button onClick={() => navigate("/admin")} className="mt-5 rounded-full">Open admin</Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onOrder={orderViaWhatsApp} onAddToCart={addProduct} />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {[
                { title: "Solar system design", text: "Tell us your appliances, power requirements and budget. We can help you plan the right system.", action: "Request a quote" },
                { title: "Backup power", text: "Keep lights, Wi-Fi, security, refrigeration and other essential equipment running during outages.", action: "Build my backup system" },
                { title: "Electronics", text: "Shop practical electrical and electronic equipment alongside your energy system.", action: "Browse electronics" },
              ].map((card) => (
                <div key={card.title} className="rounded-3xl border bg-slate-950 p-7 text-white">
                  <h3 className="text-xl font-black">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/60">{card.text}</p>
                  <button onClick={() => window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(card.action)}`, "_blank")} className="mt-6 text-sm font-bold text-amber-300">{card.action} <ArrowRight className="ml-1 inline h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950 py-12 text-white">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 font-black"><Sun className="h-5 w-5 text-amber-300" /> TECH INNOVATION</div>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/50">Solar power, backup systems and electronics for homes and businesses in Zimbabwe.</p>
          </div>
          <div>
            <h4 className="font-bold">Contact</h4>
            <div className="mt-3 space-y-2 text-sm text-white/60">
              <a href="tel:0778158984" className="block hover:text-white"><Phone className="mr-2 inline h-4 w-4" />0778158984</a>
              <a href="tel:0784721912" className="block hover:text-white"><Phone className="mr-2 inline h-4 w-4" />0784721912</a>
              <a href="mailto:infotitechinnovations@gmail.com" className="block hover:text-white">infotitechinnovations@gmail.com</a>
            </div>
          </div>
          <div>
            <h4 className="font-bold">Need help?</h4>
            <p className="mt-3 text-sm text-white/50">Ask about system sizing, product compatibility, installation or availability.</p>
            <Button onClick={() => window.open(`https://wa.me/${WHATSAPP}`, "_blank")} className="mt-4 rounded-full bg-amber-400 font-bold text-slate-950 hover:bg-amber-300"><MessageCircle className="mr-2 h-4 w-4" /> WhatsApp us</Button>
          </div>
        </div>
        <div className="container mx-auto mt-10 border-t border-white/10 px-4 pt-5 text-xs text-white/30">© {new Date().getFullYear()} Tech Innovation. Solar & Electronics.</div>
      </footer>
    </div>
  );
};

export default SolarHome;
