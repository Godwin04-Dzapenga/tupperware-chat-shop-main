import { useState, useEffect, useRef } from "react";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickView } from "@/components/ProductQuickView";
import { Cart } from "@/components/Cart";
import { SocialLinks } from "@/components/SocialLinks";
import { Chatbot } from "@/components/Chatbot";
import { LocationMap } from "@/components/LocationMap";
import { RecommendedProducts } from "@/components/RecommendedProducts";
import { useCart } from "@/hooks/useCart";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, Link } from "react-router-dom";
import {
  LogIn, Shield, Search, ShieldCheck, Sparkles, Truck,
  Droplets, Package2, GlassWater, UtensilsCrossed,
  MessageCircle, MapPin, Phone, ShoppingBag, ChevronDown,
  Menu, X, Star, Heart, Info
} from "lucide-react";
import logoImage from "@/assets/tuppafrica-logo.jpg";
import oasisSalesLogo from "@/assets/oasis-sales-logo.jpg";
import zimbabweFlag from "@/assets/zimbabwe-flag.gif";

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

const IndexContent = () => {
  const { addToCart } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  useVisitorTracking();

  const [activeCategory, setActiveCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { trackInteraction } = useRecommendations(products);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
      ]);
      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = [
    { id: "all", name: "All Products" },
    ...categories.map((cat) => ({ id: cat.id, name: cat.name })),
  ];

  const filteredProducts = products
    .filter((p) => activeCategory === "all" || p.category_id === activeCategory)
    .filter((p) =>
      searchQuery === "" ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleOrder = (product: Product) => {
    trackInteraction(product, "view");
    const msg = encodeURIComponent(`Hi! I'd like to order:\n\n${product.name}\nPrice: $${product.price.toFixed(2)}\n\nThank you!`);
    window.open(`https://wa.me/2630784721912?text=${msg}`, "_blank");
    toast.success("Opening WhatsApp to place your order!");
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    trackInteraction(product, "cart");
    toast.success(`${product.name} added to cart!`);
  };

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setQuickViewOpen(true);
    trackInteraction(product, "quickview");
  };

  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient 3D orbs */}
      <div className="orb-ambient" style={{ width: 500, height: 500, background: "hsl(180 65% 45%)", top: -100, left: -100 }} />
      <div className="orb-ambient" style={{ width: 400, height: 400, background: "hsl(15 85% 60%)", bottom: 200, right: -80, animationDelay: "3s" }} />
      <div className="orb-ambient" style={{ width: 300, height: 300, background: "hsl(190 70% 55%)", top: "40%", right: "20%", animationDelay: "6s" }} />

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-50 transition-all duration-200 ${scrolled ? "border-b shadow-sm bg-card/98 backdrop-blur-md" : "border-b border-transparent bg-card/95 backdrop-blur-sm"}`}>

        {/* Top announcement bar */}
        <div className="bg-slate-950 text-white text-[10px] font-semibold tracking-widest uppercase">
          <div className="container mx-auto flex items-center justify-between px-4 py-1.5 gap-4">
            <span className="text-white/70">🇿🇼 Official Tupperware Distributor — Harare, Zimbabwe</span>
            <div className="hidden sm:flex items-center gap-4 text-white/60">
              <a href="tel:+2630784721912" className="flex items-center gap-1 hover:text-white transition-colors">
                <Phone className="h-2.5 w-2.5" /> +263 784 721 912
              </a>
              <a href="https://wa.me/2630784721912" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
                <MessageCircle className="h-2.5 w-2.5" /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Main nav row */}
        <div className="container mx-auto px-4 py-2.5">
          <div className="flex items-center gap-4">

            {/* Logo */}
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2 shrink-0">
              <img src={logoImage} alt="TuppAfrica" className="h-10 w-auto" />
              <img src={zimbabweFlag} alt="Zimbabwe" className="h-5 w-auto" />
            </button>

            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-0.5 ml-4">
              {[
                { label: "Shop", action: scrollToProducts },
                { label: "About", action: () => navigate("/about") },
                { label: "Contact", action: () => window.open("https://wa.me/2630784721912", "_blank") },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-all"
                >
                  {item.label}
                </button>
              ))}

              {/* Collections dropdown */}
              <div className="relative group">
                <button className="flex items-center gap-1 px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/5 transition-all">
                  Collections <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <div className="absolute top-full left-0 mt-1 w-48 rounded-xl border bg-card shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                  <div className="p-1.5">
                    <button onClick={() => { setActiveCategory("all"); scrollToProducts(); }} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">All Products</button>
                    {categories.slice(0, 6).map((cat) => (
                      <button key={cat.id} onClick={() => { setActiveCategory(cat.id); scrollToProducts(); }} className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors">{cat.name}</button>
                    ))}
                  </div>
                </div>
              </div>
            </nav>

            {/* Search bar */}
            <div className="flex-1 max-w-sm mx-auto hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 rounded-full bg-muted/60 border-0 text-sm focus-visible:ring-1"
                />
              </div>
            </div>

            {/* Right actions */}
            <div className="ml-auto flex items-center gap-1.5">
              <Cart />

              {user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate("/orders")} className="gap-1.5 text-xs rounded-full">
                    <ShoppingBag className="h-3.5 w-3.5" /> Orders
                  </Button>
                  <div className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 bg-card">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center uppercase">
                      {(user.user_metadata?.full_name || user.email || "?")[0]}
                    </div>
                    <span className="text-xs font-medium hidden md:inline max-w-[80px] truncate">
                      {user.user_metadata?.full_name || user.email?.split("@")[0]}
                    </span>
                    <button onClick={signOut} className="text-[10px] text-muted-foreground hover:text-destructive ml-1">Sign out</button>
                  </div>
                </div>
              ) : (
                <Button onClick={() => navigate("/auth")} size="sm" className="hidden sm:flex rounded-full gap-1.5 h-8 text-xs">
                  <LogIn className="h-3.5 w-3.5" /> Sign In
                </Button>
              )}

              <Button onClick={() => navigate("/admin")} variant="outline" size="sm" className="hidden sm:flex rounded-full gap-1.5 h-8 text-xs border-primary/30 text-primary hover:bg-primary hover:text-white">
                <Shield className="h-3.5 w-3.5" /> Admin
              </Button>

              {/* Mobile hamburger */}
              <button className="lg:hidden ml-1 p-2 rounded-lg hover:bg-muted" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <div className="md:hidden mt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-9 rounded-full bg-muted/60 border-0 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-card shadow-lg">
            <div className="container mx-auto px-4 py-3 space-y-1">
              <button onClick={scrollToProducts} className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted">Shop</button>
              <button onClick={() => { navigate("/about"); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted">About Us</button>
              {user && <button onClick={() => { navigate("/orders"); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted">My Orders</button>}
              <button onClick={() => { navigate("/admin"); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted text-primary">Admin Dashboard</button>
              {user
                ? <button onClick={signOut} className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted text-destructive">Sign Out</button>
                : <button onClick={() => { navigate("/auth"); setMobileMenuOpen(false); }} className="w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted">Sign In</button>
              }
              <div className="border-t pt-2 flex items-center gap-3 px-3 text-xs text-muted-foreground">
                <span><Phone className="h-3 w-3 inline mr-1" />+263 784 721 912</span>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Hero />

        {/* Trust badges */}
        <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "100% BPA-Free", text: "Food-safe materials" },
            { icon: Truck, title: "Fast Delivery", text: "Harare same-day" },
            { icon: Star, title: "Lifetime Warranty", text: "On all products" },
            { icon: Heart, title: "Locally Trusted", text: "500+ happy customers" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="trust-badge flex items-center gap-3 rounded-xl border bg-card p-3 shadow-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">{item.text}</p>
                </div>
              </div>
            );
          })}
        </section>

        {/* Products */}
        <section id="products" className="scroll-mt-24">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Featured Collection</p>
              <h2 className="text-2xl font-extrabold text-foreground">Our Products</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.slice(0, 5).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all ${
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOrder={handleOrder}
                onQuickView={handleQuickView}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">🔍</div>
              <p className="text-base font-medium text-muted-foreground">
                {searchQuery ? "No products match your search." : "No products in this category."}
              </p>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}>
                Clear filters
              </Button>
            </div>
          )}
        </section>

        {/* ML Recommendations */}
        <RecommendedProducts
          allProducts={products}
          onOrder={handleOrder}
          onQuickView={handleQuickView}
        />

        {/* USP Cards */}
        <section className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Trusted quality", text: "Premium kitchen essentials chosen for durability and everyday convenience.", image: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=500&fit=crop&q=80" },
            { icon: Sparkles, title: "Fresh styles", text: "Modern, practical designs that fit beautifully into any home kitchen.", image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&fit=crop&q=80" },
            { icon: Truck, title: "Fast local support", text: "Quick help and easy ordering for customers across Harare and beyond.", image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&fit=crop&q=80" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className="relative h-28 overflow-hidden bg-muted">
                  <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                  <div className="absolute bottom-2.5 left-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="mb-1 text-sm font-bold">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              </div>
            );
          })}
        </section>

        <ProductQuickView
          product={selectedProduct}
          category={categories.find((c) => c.id === selectedProduct?.category_id)}
          isOpen={quickViewOpen}
          onClose={() => setQuickViewOpen(false)}
          onOrder={handleOrder}
        />
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16 text-card-foreground">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <img src={oasisSalesLogo} alt="Oasis Sales" className="h-14 w-auto object-contain" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Oasis Sales is your trusted local distributor of official TuppAfrica premium kitchen solutions. Bringing lifetime freshness to Harare homes.
              </p>
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg p-2 w-fit">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Verified Distributor</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Quick Links</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {[
                  { label: "Shop All Products", action: scrollToProducts },
                  { label: "About Us", action: () => navigate("/about") },
                  { label: "My Orders", action: () => navigate("/orders") },
                  { label: "Admin Dashboard", action: () => navigate("/admin") },
                ].map((item) => (
                  <li key={item.label}>
                    <button onClick={item.action} className="hover:text-primary transition-colors font-medium text-left">
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Contact & Hours</h3>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" /><span>944 New Adylin, Westgate, Harare, Zimbabwe</span></li>
                <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0 text-primary" /><span>+263 784 721 912</span></li>
                <li className="flex items-start gap-2"><MessageCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" /><span>WhatsApp orders 24/7</span></li>
                <li className="text-[11px]"><span className="font-semibold text-foreground/80">Mon–Fri:</span> 8:00 AM – 5:00 PM</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Find Our Office</h3>
              <LocationMap />
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-muted-foreground">
              © {new Date().getFullYear()} TuppAfrica Zimbabwe & Oasis Sales. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <button className="hover:text-primary transition-colors">Privacy Policy</button>
              <span>|</span>
              <button className="hover:text-primary transition-colors">Terms of Service</button>
              <span>|</span>
              <button onClick={() => navigate("/about")} className="hover:text-primary transition-colors">About Us</button>
            </div>
          </div>
        </div>
      </footer>

      <SocialLinks />
      <Chatbot />
    </div>
  );
};

const Index = () => <IndexContent />;
export default Index;
