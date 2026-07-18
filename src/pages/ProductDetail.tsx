import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductReviews } from "@/components/ProductReviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft, ShoppingCart, MessageCircle, Heart, Star,
  Shield, Truck, RotateCcw, CheckCircle2, Share2,
  Minus, Plus, AlertTriangle, Package
} from "lucide-react";
import logoImage from "@/assets/tuppafrica-logo.jpg";

interface Product {
  id: string; name: string; description: string | null; price: number;
  category_id: string | null; image_url: string | null; video_url: string | null;
  stock_quantity: number; avg_rating: number; review_count: number;
  categories?: { name: string };
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">("description");

  useEffect(() => {
    if (id) fetchProduct(id);
  }, [id]);

  // Inject SEO tags dynamically
  useEffect(() => {
    if (!product) return;

    document.title = `${product.name} — TuppAfrica Zimbabwe`;

    const setMeta = (name: string, content: string, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.content = content;
    };

    setMeta("description", product.description?.slice(0, 160) || `Buy ${product.name} from TuppAfrica Zimbabwe — premium Tupperware products in Harare.`);
    setMeta("og:title", `${product.name} — TuppAfrica`, true);
    setMeta("og:description", product.description?.slice(0, 160) || `Shop ${product.name} from TuppAfrica Zimbabwe.`, true);
    setMeta("og:image", product.image_url || "https://tuppafrica.co.zw/og-image.jpg", true);
    setMeta("og:type", "product", true);
    setMeta("og:url", window.location.href, true);
    setMeta("twitter:card", "summary_large_image");

    // JSON-LD structured data
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description || "",
      image: product.image_url || "",
      sku: product.id,
      brand: { "@type": "Brand", name: "Tupperware" },
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "USD",
        availability: product.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        seller: { "@type": "Organization", name: "TuppAfrica Zimbabwe" },
      },
      aggregateRating: product.review_count > 0 ? {
        "@type": "AggregateRating",
        ratingValue: product.avg_rating,
        reviewCount: product.review_count,
      } : undefined,
    };

    let ldEl = document.getElementById("product-ld-json") as HTMLScriptElement;
    if (!ldEl) { ldEl = document.createElement("script"); ldEl.id = "product-ld-json"; ldEl.type = "application/ld+json"; document.head.appendChild(ldEl); }
    ldEl.textContent = JSON.stringify(schema);

    return () => { document.title = "TuppAfrica — Premium Kitchen Storage Solutions"; ldEl?.remove(); };
  }, [product]);

  const fetchProduct = async (productId: string) => {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("id", productId)
      .single();

    if (error || !data) { toast.error("Product not found"); navigate("/"); return; }
    setProduct(data as Product);

    // Fetch related products in same category
    if (data.category_id) {
      const { data: rel } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", data.category_id)
        .neq("id", productId)
        .limit(4);
      setRelated(rel || []);
    }
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) addToCart(product);
    toast.success(`${quantity}× ${product.name} added to cart!`);
  };

  const handleOrder = () => {
    if (!product) return;
    const msg = encodeURIComponent(`Hi! I'd like to order:\n\n*${product.name}*\nQty: ${quantity}\nPrice: $${(product.price * quantity).toFixed(2)}\n\nPlease confirm availability. Thank you!`);
    window.open(`https://wa.me/2630784721912?text=${msg}`, "_blank");
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-primary" />
    </div>
  );

  if (!product) return null;

  const outOfStock = product.stock_quantity === 0;
  const lowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
  const inCart = isInCart(product.id);
  const wishlisted = isWishlisted(product.id);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/98 backdrop-blur-md shadow-sm">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Shop
          </Button>
          <div className="h-4 w-px bg-border" />
          <img src={logoImage} alt="TuppAfrica" className="h-8 w-auto" />
          <nav className="ml-2 hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <button onClick={() => navigate("/")} className="hover:text-primary">Home</button>
            <span>/</span>
            {product.categories?.name && <><button onClick={() => navigate("/")} className="hover:text-primary">{product.categories.name}</button><span>/</span></>}
            <span className="text-foreground font-medium truncate max-w-[180px]">{product.name}</span>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare} className="h-8 w-8">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost" size="icon"
              onClick={() => toggleWishlist(product.id, product.name)}
              className={`h-8 w-8 ${wishlisted ? "text-red-500" : "text-muted-foreground"}`}
            >
              <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-10 lg:grid-cols-2">

          {/* Left — Image */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm aspect-square">
              {outOfStock && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                  <span className="rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white">Out of Stock</span>
                </div>
              )}
              {lowStock && !outOfStock && (
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                  <AlertTriangle className="h-3.5 w-3.5" /> Only {product.stock_quantity} left!
                </div>
              )}
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-7xl bg-muted">📦</div>
              )}
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Shield, label: "100% Genuine" },
                { icon: RotateCcw, label: "Lifetime Warranty" },
                { icon: Truck, label: "Fast Delivery" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1 rounded-xl border bg-card p-3 text-center shadow-sm trust-badge">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Info */}
          <div className="space-y-6">
            {/* Category + name */}
            <div>
              {product.categories?.name && (
                <Badge className="mb-2 bg-primary/10 text-primary border-0 text-xs">{product.categories.name}</Badge>
              )}
              <h1 className="text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">{product.name}</h1>

              {/* Rating row */}
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`h-4 w-4 ${s <= Math.round(product.avg_rating) ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/20"}`} />
                  ))}
                </div>
                {product.review_count > 0
                  ? <button onClick={() => setActiveTab("reviews")} className="text-sm text-primary hover:underline">{product.avg_rating.toFixed(1)} ({product.review_count} review{product.review_count !== 1 ? "s" : ""})</button>
                  : <span className="text-sm text-muted-foreground">No reviews yet</span>
                }
              </div>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-extrabold text-primary">${product.price.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground">USD · per unit</span>
            </div>

            {/* Stock status */}
            <div className={`flex items-center gap-2 text-sm font-semibold ${outOfStock ? "text-red-500" : "text-emerald-600"}`}>
              {outOfStock
                ? <><AlertTriangle className="h-4 w-4" /> Out of Stock</>
                : <><CheckCircle2 className="h-4 w-4" /> In Stock{lowStock ? ` — Only ${product.stock_quantity} remaining` : ""}</>
              }
            </div>

            {/* Quantity */}
            {!outOfStock && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-muted-foreground">Qty:</span>
                <div className="flex items-center gap-0 rounded-full border bg-card shadow-sm">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {quantity > 1 && (
                  <span className="text-sm font-bold text-primary">= ${(product.price * quantity).toFixed(2)}</span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg" onClick={handleAddToCart} disabled={outOfStock}
                className={`flex-1 rounded-full gap-2 h-12 font-bold transition-all ${inCart ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
              >
                {inCart ? <><CheckCircle2 className="h-5 w-5" /> In Cart</> : <><ShoppingCart className="h-5 w-5" /> Add to Cart</>}
              </Button>
              <Button
                size="lg" onClick={handleOrder} disabled={outOfStock}
                className="flex-1 rounded-full gap-2 h-12 font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <MessageCircle className="h-5 w-5" /> Order via WhatsApp
              </Button>
            </div>

            {/* Delivery notice */}
            <div className="rounded-xl bg-muted/40 border p-4 text-sm space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Truck className="h-4 w-4 text-primary shrink-0" />
                <span><strong>Free delivery</strong> on orders over $50 in Harare</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Package className="h-4 w-4 text-primary shrink-0" />
                <span>Same-day delivery available Mon–Fri in Harare</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <RotateCcw className="h-4 w-4 text-primary shrink-0" />
                <span>Lifetime warranty on all Tupperware products</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Description | Reviews */}
        <div className="mt-12">
          <div className="flex gap-0 border-b mb-6">
            {(["description", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-semibold capitalize border-b-2 transition-colors ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {tab}{tab === "reviews" && product.review_count > 0 && ` (${product.review_count})`}
              </button>
            ))}
          </div>

          {activeTab === "description" && (
            <div className="max-w-2xl">
              {product.description
                ? <p className="text-muted-foreground leading-relaxed text-sm">{product.description}</p>
                : <p className="text-muted-foreground text-sm italic">No description available for this product.</p>
              }
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Material", value: "BPA-free, food-safe plastic" },
                  { label: "Brand", value: "Tupperware" },
                  { label: "Origin", value: "Official distributor — Zimbabwe" },
                  { label: "Warranty", value: "Lifetime guarantee" },
                ].map(item => (
                  <div key={item.label} className="flex justify-between rounded-lg border bg-card px-4 py-3 text-sm">
                    <span className="text-muted-foreground font-medium">{item.label}</span>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="max-w-2xl">
              <ProductReviews
                productId={product.id}
                avgRating={product.avg_rating}
                reviewCount={product.review_count}
              />
            </div>
          )}
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-extrabold mb-6">You may also like</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {related.map(rel => (
                <button key={rel.id} onClick={() => { navigate(`/product/${rel.id}`); window.scrollTo(0, 0); }}
                  className="group rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all text-left">
                  <div className="h-32 overflow-hidden bg-muted">
                    {rel.image_url
                      ? <img src={rel.image_url} alt={rel.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      : <div className="h-full w-full flex items-center justify-center text-3xl">📦</div>
                    }
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold line-clamp-2">{rel.name}</p>
                    <p className="text-sm font-extrabold text-primary mt-1">${rel.price.toFixed(2)}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
