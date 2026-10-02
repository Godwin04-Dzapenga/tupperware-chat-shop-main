import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BatteryCharging,
  Bolt,
  CheckCircle2,
  ChevronDown,
  Layers,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Sun,
  Wrench,
  SlidersHorizontal,
  MapPin,
  UserRound,
  Heart,
  PackageCheck,
  Star,
  Flame,
  Zap,
  Truck,
  RotateCcw,
  Check,
  Mail,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/hooks/useCart";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickView } from "@/components/ProductQuickView";
import { ProductCompareModal, CompareDock, CompareProduct } from "@/components/ProductCompareModal";
import { DealOfTheDay } from "@/components/DealOfTheDay";
import { SystemSizer } from "@/components/SystemSizer";
import { StoreModal } from "@/components/StoreModal";
import { BestBuyHeader } from "@/components/BestBuyHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Chatbot } from "@/components/Chatbot";
import { SizerPreset, getProductMedia } from "@/data/solarProducts";

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

  // Best Buy Feature Modals & State
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [compareProducts, setCompareProducts] = useState<CompareProduct[]>([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [p, c, v] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("is_featured", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("categories")
          .select("*")
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),
        supabase
          .from("product_variants")
          .select("id,product_id,name,price,stock_quantity")
          .eq("is_active", true)
          .order("sort_order"),
      ]);

      if (p.error) {
        toast.error("Unable to load products");
      } else {
        const variants = v.error ? [] : v.data || [];
        // Filter out any leftover legacy non-solar items (e.g. Tupperware bottles)
        const rawProducts = (p.data || []).filter(
          (prod) =>
            !prod.name.toLowerCase().includes("eco bottle") &&
            !prod.name.toLowerCase().includes("tupperware")
        );

        const enriched = rawProducts.map((product) => {
          const productVariants = variants.filter((variant) => variant.product_id === product.id);
          const media = getProductMedia(product);
          return {
            ...product,
            brand: product.brand || media.brand.split("/")[0],
            model_number: product.model_number || media.modelNumber,
            image_url:
              product.image_url && !product.image_url.includes("0.2930892299948875")
                ? product.image_url
                : media.imageUrl,
            variant_count: productVariants.length,
            variant_names: productVariants.map((variant) => variant.name),
            price: productVariants.length
              ? Math.min(...productVariants.map((variant) => Number(variant.price)))
              : product.price,
            avg_rating: product.avg_rating || 4.9,
            review_count: product.review_count || 16,
          } as Product;
        });

        setProducts(enriched);
      }

      if (!c.error) {
        // Exclude legacy categories
        const cleanCategories = (c.data || []).filter((cat) => {
          const name = cat.name.toLowerCase();
          return (
            !name.includes("bottle") &&
            !name.includes("container") &&
            !name.includes("lunch") &&
            !name.includes("bowl")
          );
        });
        setCategories(cleanCategories);
      }

      setLoading(false);
    };

    load();
  }, []);

  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand).filter((b): b is string => Boolean(b)))).sort(),
    [products]
  );

  const types = useMemo(
    () => Array.from(new Set(products.map((p) => p.product_type).filter((t): t is string => Boolean(t)))).sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = products.filter((p) => {
      const categoryMatch = activeCategory === "all" || p.category_id === activeCategory;
      const brandMatch = brandFilter === "all" || p.brand === brandFilter;
      const typeMatch = typeFilter === "all" || p.product_type === typeFilter;
      const searchMatch =
        !q ||
        [p.name, p.description, p.brand, p.model_number, p.product_type]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
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
      `Hello Tech Innovation, I am interested in ordering:\n\n*${product.name}*\nPrice: $${product.price.toFixed(
        2
      )}\n${product.variant_count ? "Please show me available capacity/wattage options.\n" : ""}Please confirm availability at the Harare Showroom and delivery options.`
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

  // Compare handlers
  const toggleCompare = (product: Product) => {
    setCompareProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        toast.info(`Removed ${product.name} from comparison`);
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 4) {
        toast.error("You can compare up to 4 products at once.");
        return prev;
      }
      toast.success(`Added ${product.name} to comparison list`);
      return [...prev, product as CompareProduct];
    });
  };

  const removeCompare = (id: string) => {
    setCompareProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const clearCompare = () => {
    setCompareProducts([]);
  };

  // Add Sizer preset to cart
  const handleAddSizerPreset = (preset: SizerPreset) => {
    addToCart({
      id: `preset-${preset.id}`,
      name: `${preset.title} Package`,
      price: preset.estimatedPrice,
      image_url:
        preset.id === "family"
          ? "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=800&h=800&fit=crop&q=85"
          : "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&h=800&fit=crop&q=85",
      stock_quantity: 5,
    });
    toast.success(`${preset.title} complete solar kit added to cart!`);
  };

  const handleConsultWhatsApp = (preset: SizerPreset) => {
    const text = encodeURIComponent(
      `Hello Tech Innovation Engineer,\n\nI would like a quotation for the *${preset.title} Package* ($${preset.estimatedPrice.toLocaleString()}).\n\nIncluded Components:\n• Inverter: ${preset.recommendedInverter}\n• Battery: ${preset.recommendedBattery}\n• Solar Panels: ${preset.recommendedPanels}\n\nPlease advise on site inspection and installation schedule.`
    );
    window.open(`https://wa.me/${WHATSAPP}?text=${text}`, "_blank");
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubmitted(true);
    toast.success("Thank you for subscribing! Your $10 coupon code is: POWER10");
  };

  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#111820] flex flex-col font-sans">
      {/* ── Best Buy Header ── */}
      <BestBuyHeader
        categories={categories}
        activeCategory={activeCategory}
        onSelectCategory={(id) => {
          setActiveCategory(id);
          scrollToProducts();
        }}
        search={search}
        onSearchChange={setSearch}
        onOpenStoreModal={() => setStoreModalOpen(true)}
        compareCount={compareProducts.length}
        onOpenCompareModal={() => setCompareModalOpen(true)}
        products={products}
      />

      <main className="flex-1">
        {/* ── 1. Best Buy Hero Promo Banner ── */}
        <section className="bg-gradient-to-r from-[#001e73] via-[#003494] to-[#0046be] text-white overflow-hidden relative">
          <div className="container mx-auto px-4 py-12 lg:py-16 grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-2xl z-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#ffe000] px-3.5 py-1 text-xs font-black uppercase tracking-wider text-[#111820] shadow-sm">
                <Flame className="h-4 w-4 fill-[#111820]" /> Zimbabwe National Power Sale
              </div>

              <h1 className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
                Quality solar systems & electronics designed to last.
              </h1>

              <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-white/85">
                Shop tier-1 monocrystalline panels, Deye & Sunsynk hybrid inverters, long-life LiFePO4 batteries and complete turnkey packages with official warranty and Harare in-store pickup.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  onClick={scrollToProducts}
                  className="h-12 rounded-lg bg-[#ffe000] hover:bg-[#ffd200] px-7 font-black text-black text-sm shadow-xl"
                >
                  Shop All Solar Gear <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setStoreModalOpen(true)}
                  variant="outline"
                  className="h-12 rounded-lg border-white/30 bg-white/10 hover:bg-white/20 px-6 font-bold text-white text-sm"
                >
                  <MapPin className="mr-2 h-4 w-4 text-[#ffe000]" /> Showroom & Pickup
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-white/80">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#ffe000]" /> Genuine Tier-1 Hardware
                </span>
                <span className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-[#ffe000]" /> Professional Installation
                </span>
                <span className="flex items-center gap-2">
                  <PackageCheck className="h-4 w-4 text-[#ffe000]" /> Harare Showroom Pickup
                </span>
              </div>
            </div>

            {/* Hero Quick Category Cards */}
            <div className="grid grid-cols-2 gap-3 z-10">
              {[
                {
                  icon: Sun,
                  title: "Solar Panels",
                  desc: "450W • 550W • 600W Tier-1",
                  img: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&h=300&fit=crop&q=80",
                  catId: "75aaa2f1-99eb-4ec1-8ada-7a8bdf19999a",
                },
                {
                  icon: Bolt,
                  title: "Hybrid Inverters",
                  desc: "3.2kVA • 5kVA • 8kVA 48V",
                  img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop&q=80",
                  catId: "39755c99-54b3-4b0c-b2d0-a0dc01281dd0",
                },
                {
                  icon: BatteryCharging,
                  title: "Lithium LiFePO4",
                  desc: "5.12kWh • 10.24kWh Storage",
                  img: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400&h=300&fit=crop&q=80",
                  catId: "d36b75fa-d7aa-49c6-8791-6f8da23a49f5",
                },
                {
                  icon: ShieldCheck,
                  title: "Complete Kits",
                  desc: "Turnkey home & office kits",
                  img: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=400&h=300&fit=crop&q=80",
                  catId: "d2c49002-0a60-4ff6-84b1-33b2df1824ee",
                },
              ].map(({ icon: Icon, title, desc, img, catId }) => (
                <div
                  key={title}
                  onClick={() => {
                    setActiveCategory(catId);
                    scrollToProducts();
                  }}
                  className="group relative overflow-hidden rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-md hover:bg-white/20 transition-all cursor-pointer shadow-lg"
                >
                  <Icon className="h-6 w-6 text-[#ffe000] mb-2" />
                  <p className="text-sm font-black text-white group-hover:text-[#ffe000] transition-colors">{title}</p>
                  <p className="text-[11px] text-white/70 mt-0.5">{desc}</p>
                  <span className="text-[10px] font-bold text-[#ffe000] mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Explore <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 2. Best Buy Value Props Bar ── */}
        <section className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 text-[#0046be] flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Harare & Nationwide Delivery</p>
                <p className="text-slate-500 text-[11px]">Free delivery on orders over $50</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Showroom Pickup in 2 Hours</p>
                <p className="text-slate-500 text-[11px]">Inspect and test before leaving</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Official 1–5 Year Warranty</p>
                <p className="text-slate-500 text-[11px]">Direct manufacturer backed</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Expert Engineering Support</p>
                <p className="text-slate-500 text-[11px]">WhatsApp & on-site technicians</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Best Buy Deal of the Day ── */}
        <div id="deal-of-the-day" className="container mx-auto px-4">
          <DealOfTheDay
            onAddToCart={addProduct}
            onOrderViaWhatsApp={orderViaWhatsApp}
            onSelectProduct={(id) => navigate(`/product/${id}`)}
          />
        </div>

        {/* ── 4. Interactive Solar System Sizer (Best Buy Solution Finder) ── */}
        <div className="container mx-auto px-4">
          <SystemSizer
            onAddPresetToCart={handleAddSizerPreset}
            onConsultWhatsApp={handleConsultWhatsApp}
          />
        </div>

        {/* ── 5. Main Product Catalogue & Filters ── */}
        <section id="products" className="container mx-auto px-4 py-8">
          {/* Header & Sort Bar */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#0046be]">
                  Featured Catalog
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span className="text-xs font-bold text-slate-500">
                  {filteredProducts.length} Equipment Available
                </span>
              </div>
              <h2 className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Solar, Backup Power & Electronics
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-10 gap-2 rounded-lg md:hidden border-slate-300 text-xs font-bold"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </Button>

              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-10 appearance-none rounded-lg border border-slate-300 bg-white pl-3.5 pr-9 text-xs font-bold text-slate-800 shadow-sm outline-none focus:border-[#0046be]"
                >
                  <option value="featured">Sort by: Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
            {/* ── Left Sidebar Filters ── */}
            <aside
              className={`${
                showFilters ? "block" : "hidden"
              } rounded-xl border border-slate-200 bg-white p-5 lg:block lg:h-fit shadow-sm`}
            >
              <div className="mb-4 flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-black text-slate-900">Refine Results</h3>
                {(brandFilter !== "all" || typeFilter !== "all" || activeCategory !== "all") && (
                  <button
                    onClick={() => {
                      setBrandFilter("all");
                      setTypeFilter("all");
                      setActiveCategory("all");
                      setSearch("");
                    }}
                    className="text-[11px] font-bold text-[#0046be] hover:underline"
                  >
                    Reset all
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Department / Category filter */}
                <div>
                  <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Department</p>
                  <div className="space-y-1 text-xs">
                    <button
                      onClick={() => setActiveCategory("all")}
                      className={`w-full text-left py-1 px-2 rounded font-semibold transition-colors ${
                        activeCategory === "all" ? "bg-[#0046be] text-white" : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      All Departments
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setActiveCategory(c.id)}
                        className={`w-full text-left py-1 px-2 rounded font-semibold transition-colors ${
                          activeCategory === c.id ? "bg-[#0046be] text-white" : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brand Filter */}
                <div className="border-t pt-4">
                  <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Brand</p>
                  <div className="space-y-2 text-xs">
                    <label className="flex cursor-pointer items-center gap-2 font-medium text-slate-700 hover:text-black">
                      <input
                        type="radio"
                        name="brandFilter"
                        checked={brandFilter === "all"}
                        onChange={() => setBrandFilter("all")}
                        className="text-[#0046be]"
                      />
                      <span>All Brands</span>
                    </label>
                    {brands.map((b) => (
                      <label
                        key={b}
                        className="flex cursor-pointer items-center gap-2 font-medium text-slate-700 hover:text-black"
                      >
                        <input
                          type="radio"
                          name="brandFilter"
                          checked={brandFilter === b}
                          onChange={() => setBrandFilter(b)}
                          className="text-[#0046be]"
                        />
                        <span>{b}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Equipment Type Filter */}
                <div className="border-t pt-4">
                  <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">Equipment Type</p>
                  <div className="space-y-2 text-xs">
                    <label className="flex cursor-pointer items-center gap-2 font-medium text-slate-700 hover:text-black">
                      <input
                        type="radio"
                        name="typeFilter"
                        checked={typeFilter === "all"}
                        onChange={() => setTypeFilter("all")}
                        className="text-[#0046be]"
                      />
                      <span>All Types</span>
                    </label>
                    {types.map((t) => (
                      <label
                        key={t}
                        className="flex cursor-pointer items-center gap-2 font-medium text-slate-700 hover:text-black"
                      >
                        <input
                          type="radio"
                          name="typeFilter"
                          checked={typeFilter === t}
                          onChange={() => setTypeFilter(t)}
                          className="text-[#0046be]"
                        />
                        <span className="capitalize">{t.replaceAll("_", " ")}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* ── Product Grid ── */}
            <div>
              {loading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="animate-pulse rounded-xl border bg-white p-4">
                      <div className="aspect-square rounded-lg bg-slate-200" />
                      <div className="mt-3 h-3 w-1/3 rounded bg-slate-200" />
                      <div className="mt-2 h-4 w-4/5 rounded bg-slate-200" />
                      <div className="mt-2 h-6 w-1/2 rounded bg-slate-200" />
                      <div className="mt-4 h-10 w-full rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
                  <Search className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="mt-4 text-xl font-black text-slate-900">No matching solar equipment</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Try searching for another keyword like "inverter", "battery", or reset your filters.
                  </p>
                  <Button
                    onClick={() => {
                      setSearch("");
                      setActiveCategory("all");
                      setBrandFilter("all");
                      setTypeFilter("all");
                    }}
                    className="mt-6 rounded-lg bg-[#0046be] hover:bg-[#003b95] text-white font-bold"
                  >
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onOrder={orderViaWhatsApp}
                      onAddToCart={addProduct}
                      onQuickView={(p) => setQuickViewProduct(p)}
                      isCompared={compareProducts.some((cp) => cp.id === product.id)}
                      onToggleCompare={toggleCompare}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 6. "Why Shop With Tech Innovation" (Best Buy Total Tech section) ── */}
        <section id="why-us" className="bg-white border-t border-slate-200 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#0046be]">
                Total Customer Confidence
              </span>
              <h2 className="text-3xl font-black text-slate-900 mt-1">
                Why Thousands Choose Tech Innovation
              </h2>
              <p className="text-sm text-slate-600 mt-2">
                We combine genuine tier-1 solar products with experienced local technical engineers to deliver reliable, long-term power solutions.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: ShieldCheck,
                  title: "Genuine Manufacturer Warranty",
                  desc: "All panels come with 12–25 year performance warranties, and inverters & batteries come with 3–5 year replacement coverage.",
                },
                {
                  icon: Wrench,
                  title: "Certified Engineering & COC",
                  desc: "Our licensed electrical engineers provide full site surveys, wiring design, surge protection, and compliant commissioning.",
                },
                {
                  icon: MapPin,
                  title: "Harare Showroom & Warehouse",
                  desc: "Visit our physical showroom to inspect, test, and collect your hardware in person with direct engineer assistance.",
                },
                {
                  icon: Truck,
                  title: "Nationwide Zimbabwe Freight",
                  desc: "Fast, insured freight dispatch to Bulawayo, Mutare, Gweru, Masvingo, Victoria Falls and all rural farming districts.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-xl bg-[#0046be]/10 text-[#0046be] flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="text-base font-black text-slate-900">{title}</h4>
                  <p className="text-xs leading-relaxed text-slate-600 mt-2">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. Verified Customer Reviews & Testimonials ── */}
        <section className="bg-slate-50 border-t border-slate-200 py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#0046be]">
                  Real Customer Experiences
                </span>
                <h2 className="text-3xl font-black text-slate-900 mt-1">
                  Trusted Across Homes & Businesses
                </h2>
              </div>
              <div className="mt-3 md:mt-0 flex items-center gap-2 text-sm font-bold text-slate-700">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-amber-400" />
                  ))}
                </div>
                <span>4.9 / 5.0 Average Rating (180+ Zimbabwe Reviews)</span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  name: "Tinashe Moyo",
                  location: "Borrowdale, Harare",
                  system: "5kVA Deye + 5.12kWh Lithium Battery + 6x 550W Panels",
                  comment:
                    "Installed two months ago. We haven't experienced a single second of blackout since. Inverter powers the borehole pump and all household fridges seamlessly.",
                  rating: 5,
                },
                {
                  name: "Dr. Farai Chikwanha",
                  location: "Bulawayo Medical Centre",
                  system: "8kVA Hybrid System + 10.24kWh Battery Bank",
                  comment:
                    "Tech Innovation delivered the hardware promptly to Bulawayo. The build quality and genuine warranty paperwork gave us full confidence for our clinic.",
                  rating: 5,
                },
                {
                  name: "Grace Mutasa",
                  location: "Gweru Commercial Farm",
                  system: "Solar Borehole Pumping Inverter & 3.2kVA Starter Kit",
                  comment:
                    "The solar system sizer tool was spot on. Engineer assisted on WhatsApp and installation was done cleanly. Excellent after-sales service.",
                  rating: 5,
                },
              ].map(({ name, location, system, comment, rating }) => (
                <div key={name} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="mt-4 text-xs font-bold text-[#0046be] uppercase tracking-wide">{system}</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-700 italic">"{comment}"</p>
                  </div>
                  <div className="mt-6 pt-4 border-t flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{name}</p>
                      <p className="text-[11px] text-slate-500">{location}</p>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold border-0">
                      ✓ Verified Buyer
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 8. Best Buy Newsletter Discount Bar ── */}
        <section className="bg-[#002870] text-white py-10">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h3 className="text-2xl font-black">Get $10 Off Your First Solar Purchase</h3>
            <p className="text-xs text-white/80 mt-1 max-w-md mx-auto">
              Join our newsletter for exclusive solar deals, load shedding alerts, and new equipment arrivals in Zimbabwe.
            </p>
            {newsletterSubmitted ? (
              <div className="mt-4 p-3 bg-emerald-600/30 border border-emerald-400/40 rounded-lg text-xs font-bold text-emerald-200 inline-block">
                🎉 Success! Use coupon code <strong className="text-white">POWER10</strong> at checkout for $10 off.
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="mt-5 flex flex-col sm:flex-row gap-2 justify-center max-w-md mx-auto">
                <Input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="h-11 bg-white text-slate-900 text-xs rounded-lg"
                />
                <Button type="submit" className="h-11 bg-[#ffe000] hover:bg-[#ffd200] text-black font-extrabold text-xs px-6 rounded-lg shrink-0">
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Get $10 Voucher
                </Button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* ── 9. Best Buy Signature Multi-Column Mega Footer ── */}
      <footer className="bg-[#040c18] text-white pt-12 pb-8 border-t border-white/10 text-xs">
        <div className="container mx-auto px-4 grid gap-8 md:grid-cols-5">
          {/* Col 1: Brand & Contact */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 font-black text-base">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ffe000] text-[#111820]">
                <Sun className="h-5 w-5 fill-[#111820]" />
              </span>
              <span>TECH INNOVATION</span>
            </div>
            <p className="text-white/60 leading-relaxed max-w-sm">
              Zimbabwe's trusted destination for tier-1 solar panels, hybrid inverters, lithium batteries, backup electrical equipment and certified professional installations.
            </p>
            <div className="space-y-1.5 text-white/80 pt-2">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#ffe000]" /> Harare Showroom & Distribution Hub, Zimbabwe
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#ffe000]" /> 0778158984 / 0784721912
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#ffe000]" /> infotitechinnovations@gmail.com
              </p>
            </div>
          </div>

          {/* Col 2: Shop Departments */}
          <div>
            <h4 className="font-bold text-white text-sm">Shop Solar</h4>
            <ul className="mt-3 space-y-2 text-white/60">
              <li>
                <button onClick={() => { setActiveCategory("75aaa2f1-99eb-4ec1-8ada-7a8bdf19999a"); scrollToProducts(); }} className="hover:text-white">
                  Solar Panels
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveCategory("39755c99-54b3-4b0c-b2d0-a0dc01281dd0"); scrollToProducts(); }} className="hover:text-white">
                  Hybrid Inverters
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveCategory("d36b75fa-d7aa-49c6-8791-6f8da23a49f5"); scrollToProducts(); }} className="hover:text-white">
                  Lithium Batteries
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveCategory("d2c49002-0a60-4ff6-84b1-33b2df1824ee"); scrollToProducts(); }} className="hover:text-white">
                  Complete Solar Kits
                </button>
              </li>
              <li>
                <button onClick={() => { setActiveCategory("5232e9e7-cfb0-43b5-9a6a-4948cbd36ac5"); scrollToProducts(); }} className="hover:text-white">
                  Solar Lighting
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Care & Services */}
          <div>
            <h4 className="font-bold text-white text-sm">Services & Support</h4>
            <ul className="mt-3 space-y-2 text-white/60">
              <li>
                <button onClick={() => setStoreModalOpen(true)} className="hover:text-white">
                  Showroom Pickup & Hours
                </button>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white">
                  Installation & Engineering
                </Link>
              </li>
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("I need warranty support or technical service.")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  Warranty & Returns
                </a>
              </li>
              <li>
                <Link to="/about" className="hover:text-white">
                  About Tech Innovation
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Payment Methods & Store Info */}
          <div>
            <h4 className="font-bold text-white text-sm">Accepted Payments</h4>
            <p className="mt-3 text-white/60 leading-relaxed">
              We accept USD Cash on Delivery, EcoCash via Paynow, Bank Transfer, Zipit, and Card Payments.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold text-white">USD Cash</span>
              <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold text-white">EcoCash</span>
              <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold text-white">Paynow</span>
              <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold text-white">Zipit / Bank</span>
              <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold text-white">Visa / MC</span>
            </div>
            <div className="mt-5 pt-3 border-t border-white/10">
              <button
                onClick={() => window.open(`https://wa.me/${WHATSAPP}`, "_blank")}
                className="w-full h-9 rounded bg-[#25D366] hover:bg-[#128C7E] text-white font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp Support
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-white/40 text-[11px] gap-2">
          <p>© {new Date().getFullYear()} Tech Innovation Zimbabwe. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-white">Privacy Policy</Link>
            <Link to="/about" className="hover:text-white">Terms of Sale</Link>
            <Link to="/about" className="hover:text-white">Warranty Guidelines</Link>
          </div>
        </div>
      </footer>

      {/* ── 10. Sticky Bottom Comparison Dock ── */}
      <CompareDock
        products={compareProducts}
        onOpenModal={() => setCompareModalOpen(true)}
        onRemove={removeCompare}
        onClear={clearCompare}
      />

      {/* ── 11. Modals ── */}
      <StoreModal open={storeModalOpen} onClose={() => setStoreModalOpen(false)} />

      <ProductCompareModal
        open={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        products={compareProducts}
        onRemove={removeCompare}
        onClear={clearCompare}
        onAddToCart={addProduct}
        onOrderViaWhatsApp={orderViaWhatsApp}
      />

      <ProductQuickView
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        product={quickViewProduct}
        onOrder={orderViaWhatsApp}
      />

      {/* Floating WhatsApp Action Button */}
      <a
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-2xl hover:scale-105 hover:bg-[#128C7E] transition-all"
      >
        <MessageCircle className="h-7 w-7 text-white" />
      </a>

      {/* InnoBot AI Shopping Assistant */}
      <Chatbot />
    </div>
  );
};

export default SolarHome;
