import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickView } from "@/components/ProductQuickView";
import { Cart } from "@/components/Cart";
import { SocialLinks } from "@/components/SocialLinks";
import { Chatbot } from "@/components/Chatbot";
import { LocationMap } from "@/components/LocationMap";
import { CartProvider, useCart } from "@/hooks/useCart";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { LogIn, Shield, Search, ShieldCheck, Sparkles, Truck, Droplets, Package2, GlassWater, UtensilsCrossed, MessageCircle, MapPin, Phone } from "lucide-react";
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
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const IndexContent = () => {
  const { addToCart } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  useVisitorTracking();
  const [activeCategory, setActiveCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const scrollTimer = setTimeout(() => {
      // Auto scroll to products catalog
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
    }, 5000);

    return () => clearTimeout(scrollTimer);
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

  const headerCategoryLinks = categories.length
    ? categories.slice(0, 5).map((category) => ({
        id: category.id,
        label: category.name,
      }))
    : [
        { id: "all", label: "Bottles" },
        { id: "all", label: "Pantry Storage" },
        { id: "all", label: "Meal Prep" },
        { id: "all", label: "Free Shipping" },
      ];

  const filteredProducts = products
    .filter((p) => activeCategory === "all" || p.category_id === activeCategory)
    .filter(
      (p) =>
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const handleOrder = (product: Product) => {
    const whatsappNumber = "2630784721912";
    const message = encodeURIComponent(
      `Hi! I'd like to order:\n\n${product.name}\nPrice: $${product.price.toFixed(2)}\n\nThank you!`,
    );
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

    window.open(whatsappUrl, "_blank");
    toast.success("Opening WhatsApp to place your order!");
  };

  const handleCartOrder = (items: Array<{ name: string; quantity: number; price: number }>) => {
    const whatsappNumber = "2630784721912";
    const itemsList = items
      .map((item) => `${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`)
      .join("\n");
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const message = encodeURIComponent(
      `Hi! I'd like to order:\n\n${itemsList}\n\nTotal: $${total.toFixed(2)}\n\nThank you!`,
    );
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappUrl, "_blank");
    toast.success("Order sent! Check WhatsApp.");
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setQuickViewOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="border-b border-white/10 bg-slate-950 text-white">
          <div className="container mx-auto flex items-center justify-between gap-3 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] sm:px-4">
            <span className="text-white/80">Trusted premium kitchen essentials</span>
            <div className="hidden items-center gap-3 text-white/65 md:flex">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Harare, Zimbabwe
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3 w-3" />
                +263 784 721 912
              </span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
                <img src={logoImage} alt="TuppAfrica Logo" className="h-10 w-auto object-contain sm:h-12 md:h-14" />
                <img
                  src={zimbabweFlag}
                  alt="Zimbabwe Flag"
                  className="h-6 w-auto cursor-pointer object-contain transition-transform duration-200 hover:scale-110 sm:h-7"
                />
              </div>

              <div className="flex flex-shrink-0 items-center gap-1 sm:gap-2">
              <Cart onOrder={handleCartOrder} />

              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                size="sm"
                className="hidden rounded-full px-3 text-xs font-semibold text-muted-foreground hover:text-primary sm:inline-flex"
              >
                Shop
              </Button>

              <Button
                onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
                variant="ghost"
                size="sm"
                className="hidden rounded-full px-3 text-xs font-semibold text-muted-foreground hover:text-primary sm:inline-flex"
              >
                Collections
              </Button>

              <Button
                onClick={() => window.open("https://wa.me/2630784721912", "_blank")}
                variant="outline"
                size="sm"
                className="hidden items-center gap-1.5 rounded-full border-primary/30 px-3 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground lg:inline-flex"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                WhatsApp
              </Button>

              <Button
                onClick={() => navigate("/admin")}
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 rounded-full border-primary/40 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground sm:px-3"
              >
                <Shield className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </Button>

              {user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden md:flex flex-col items-end text-[10px]">
                    <span className="font-bold text-foreground">
                      {user.user_metadata?.full_name || user.email?.split("@")[0]}
                    </span>
                    <span className="text-muted-foreground font-medium">Customer</span>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase shadow-sm">
                    {(user.user_metadata?.full_name || user.email || "?")[0]}
                  </div>
                  <Button onClick={signOut} variant="ghost" size="sm" className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => navigate("/auth")}
                  variant="default"
                  size="sm"
                  className="h-8 rounded-full bg-primary text-white text-xs hover:bg-primary/90"
                >
                  <LogIn className="h-3.5 w-3.5 mr-1" />
                  Sign In
                </Button>
              )}
            </div>
            </div>

            <div className="min-w-0 flex-1 px-1 text-center sm:px-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary/80 sm:text-xs">
                TuppAfrica Zimbabwe
              </p>
              <h1 className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-sm font-bold text-transparent sm:text-lg md:text-xl lg:text-2xl">
                Premium Kitchen Solutions
              </h1>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 lg:justify-end">
            {headerCategoryLinks.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setActiveCategory(item.id);
                  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${
                  activeCategory === item.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/70 bg-background text-muted-foreground hover:border-primary/30 hover:text-primary"
                }`}
              >
                {item.label}
              </button>
            ))}
            <a
              href="https://wa.me/2630784721912"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-3 py-1 text-[11px] font-semibold text-muted-foreground transition-all hover:border-primary/30 hover:text-primary"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Contact
            </a>
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-3 py-1 text-[11px] font-semibold text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              +263 784 721 912
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Hero Section */}
        <Hero />

        <section className="mb-8 grid gap-3 md:grid-cols-5">
          {[
            { icon: Droplets, title: "Water Bottles", text: "Insulated hydration for work, gym and travel" },
            { icon: Package2, title: "Pantry Canisters", text: "Keep staples clean, dry and beautifully organized" },
            { icon: UtensilsCrossed, title: "Meal Prep", text: "Smart containers for fast, fresh everyday meals" },
            { icon: GlassWater, title: "Travel Tumblers", text: "Ready for commutes, cafés and on-the-go routines" },
            { icon: ShieldCheck, title: "BPA-Free Care", text: "Food-safe construction with durable premium finishes" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-[1.1rem] border border-border/70 bg-card px-3 py-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">{item.title}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{item.text}</p>
              </div>
            );
          })}
        </section>

        <section className="mb-8 rounded-[1.25rem] border border-border/70 bg-card/80 p-3 shadow-sm sm:p-4">
          <div className="grid gap-2 text-center text-xs font-semibold sm:grid-cols-2 lg:grid-cols-4">
            {[
              "100% BPA-Free & Food-Safe",
              "24hr Cold / 12hr Hot Insulation",
              "100% Leakproof Guarantee",
              "Lifetime Warranty",
            ].map((item) => (
              <div key={item} className="rounded-full border border-primary/10 bg-primary/5 px-3 py-2 text-primary">
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="scroll-mt-20">
          {/* Section heading */}
          <div className="mb-6 text-center sm:mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.35em] text-primary">Featured Collection</p>
            <h2 className="mb-2 px-2 text-2xl font-extrabold text-foreground sm:text-3xl md:text-4xl">
              Our Products
            </h2>
            <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-gradient-to-r from-primary to-accent" />
            <p className="mx-auto max-w-xl px-4 text-sm text-muted-foreground">
              Premium insulated bottles, lunch boxes, pantry-ready storage, and everyday kitchen essentials — all delivered with a premium shopping experience.
            </p>
          </div>

          {/* Search */}
          <div className="mx-auto mb-5 max-w-sm px-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search bottles, lunch boxes…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-full pl-9 text-sm"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="mb-6 flex flex-wrap justify-center gap-2 px-2">
            {categoryOptions.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                onClick={() => setActiveCategory(category.id)}
                size="sm"
                className={`rounded-full px-4 py-1 text-xs font-semibold transition-all hover:scale-105 ${
                  activeCategory === category.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-background/80 hover:bg-primary/10 hover:border-primary hover:text-primary"
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Products Grid — responsive for small screens */}
          <div className="grid grid-cols-1 gap-3.5 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
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
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/60 text-4xl">
                🔍
              </div>
              <p className="text-base font-medium text-muted-foreground">
                {searchQuery ? "No products match your search." : "No products found in this category."}
              </p>
            </div>
          )}
        </section>

        {/* Highlights Section — moved below products section for prioritised visibility */}
        <section className="mt-16 mb-10 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Trusted quality",
              text: "Premium kitchen essentials chosen for durability and everyday convenience.",
              image: "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=500&fit=crop&q=80",
            },
            {
              icon: Sparkles,
              title: "Fresh styles",
              text: "Modern, practical designs that fit beautifully into any home kitchen.",
              image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&fit=crop&q=80",
            },
            {
              icon: Truck,
              title: "Fast local support",
              text: "Quick help and easy ordering for customers across Harare and beyond.",
              image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500&fit=crop&q=80",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.title} 
                className="group overflow-hidden rounded-[1.25rem] border border-border/70 bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                {/* Visual USP Card Header */}
                <div className="relative h-28 w-full overflow-hidden bg-muted">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
                  
                  {/* Badge positioned over image */}
                  <div className="absolute bottom-2.5 left-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="mb-1 text-sm font-bold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              </div>
            );
          })}
        </section>

        {/* Quick View Modal */}
        <ProductQuickView
          product={selectedProduct}
          category={categories.find((c) => c.id === selectedProduct?.category_id)}
          isOpen={quickViewOpen}
          onClose={() => setQuickViewOpen(false)}
          onOrder={handleOrder}
        />
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16 sm:mt-24 text-card-foreground">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            
            {/* Column 1: Company Profile */}
            <div className="flex flex-col gap-4 text-left">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl font-extrabold text-primary">@</span>
                <img
                  src={oasisSalesLogo}
                  alt="Oasis Sales Logo"
                  className="h-16 w-auto object-contain"
                />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Oasis Sales is your trusted local distributor of official TuppAfrica premium kitchen solutions. Bringing lifetime freshness to Harare homes.
              </p>
              <div className="flex items-center gap-1 bg-primary/5 border border-primary/10 rounded-lg p-2.5 w-fit mt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Verified Distributor</span>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="flex flex-col gap-4 text-left">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Quick Links</h3>
              <ul className="space-y-2.5 text-xs text-muted-foreground font-medium">
                <li>
                  <a href="#products" className="hover:text-primary transition-colors flex items-center gap-1">
                    Shop Bottles
                  </a>
                </li>
                <li>
                  <a href="#products" className="hover:text-primary transition-colors flex items-center gap-1">
                    Lunch Boxes
                  </a>
                </li>
                <li>
                  <a href="#products" className="hover:text-primary transition-colors flex items-center gap-1">
                    Containers &amp; Storage
                  </a>
                </li>
                <li>
                  <a href="/admin" className="hover:text-primary transition-colors flex items-center gap-1 font-semibold text-foreground/80">
                    Admin Dashboard
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact & Hours */}
            <div className="flex flex-col gap-4 text-left">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Contact &amp; Hours</h3>
              <ul className="space-y-3 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span>944 New Adylin, Westgate, Harare, Zimbabwe</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <span>+263 784 721 912</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground/80">Mon - Fri</p>
                    <p className="text-[10px]">8:00 AM - 5:00 PM</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Column 4: Interactive Map */}
            <div className="flex flex-col gap-4 text-left">
              <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">Find Our Office</h3>
              <LocationMap />
            </div>

          </div>

          {/* Footer Bottom copyright */}
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-muted-foreground font-medium">
              &copy; {new Date().getFullYear()} TuppAfrica Zimbabwe &amp; Oasis Sales. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <span className="text-border">|</span>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            </div>
          </div>

        </div>
      </footer>

      {/* Social Links & Chatbot */}
      <SocialLinks />
      <Chatbot />
    </div>
  );
};

const Index = () => {
  return (
    <CartProvider>
      <IndexContent />
    </CartProvider>
  );
};

export default Index;
