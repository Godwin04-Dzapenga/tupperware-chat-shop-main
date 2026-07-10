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
import { LogIn, Shield, Search } from "lucide-react";
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
      <header className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <img src={logoImage} alt="TuppAfrica Logo" className="h-14 sm:h-16 md:h-20 lg:h-24 w-auto object-contain" />
              <img 
                src={zimbabweFlag} 
                alt="Zimbabwe Flag" 
                className="h-7 sm:h-8 md:h-10 lg:h-12 w-auto object-contain transition-transform duration-200 hover:scale-110 cursor-pointer" 
              />
            </div>
            <h1 className="text-base sm:text-xl md:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent flex-1 text-center px-1 sm:px-2 min-w-0">
              TuppAfrica Zimbabwe
            </h1>
            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
              <Cart onOrder={handleCartOrder} />
              {user ? (
                <>
                  {isAdmin && (
                    <Button onClick={() => navigate("/admin")} variant="outline" size="sm" className="hidden sm:flex">
                      <Shield className="sm:mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Admin</span>
                    </Button>
                  )}
                  {isAdmin && (
                    <Button onClick={() => navigate("/admin")} variant="outline" size="sm" className="sm:hidden">
                      <Shield className="h-4 w-4" />
                    </Button>
                  )}
                  <Button onClick={signOut} variant="outline" size="sm">
                    <span className="hidden sm:inline">Sign Out</span>
                    <span className="sm:hidden">Out</span>
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate("/auth")} variant="outline" size="sm">
                  <LogIn className="sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Hero Section */}
        <Hero />

        {/* Products Section */}
        <section id="products" className="scroll-mt-20">
          <div className="text-center mb-6 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-foreground px-2">Our Products</h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Browse our collection of premium TuppAfrica products. Click "Order on WhatsApp" to place your order
              instantly!
            </p>
          </div>

          {/* Search */}
          <div className="max-w-md mx-auto mb-6 sm:mb-8 px-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-10 h-10 sm:h-12 rounded-full text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-8 sm:mb-12 px-2">
            {categoryOptions.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                onClick={() => setActiveCategory(category.id)}
                size="sm"
                className="rounded-full px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm transition-all hover:scale-105"
              >
                {category.name}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                {searchQuery ? "No products match your search." : "No products found in this category."}
              </p>
            </div>
          )}
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
      <footer className="bg-card border-t border-border mt-12 sm:mt-20">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Company Info */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-4xl sm:text-5xl font-bold text-primary">@</span>
                <img
                  src={oasisSalesLogo}
                  alt="Oasis Sales - Where businesses blossom"
                  className="h-20 sm:h-24 w-auto object-contain"
                />
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">Fresh solutions for your kitchen needs</p>
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-semibold text-foreground">Visit Us:</p>
                <p>944 New Adylin, Westgate</p>
                <p>Harare, Zimbabwe</p>
              </div>
            </div>

            {/* Map */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-center lg:text-left">Find Us Here</h3>
              <LocationMap />
            </div>
          </div>

          <div className="text-center pt-6 border-t border-border">
            <p className="text-xs sm:text-sm text-muted-foreground">© 2025 TuppAfrica Zimbabwe All rights reserved.</p>
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
