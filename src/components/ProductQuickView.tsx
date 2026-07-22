import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductReviews } from "@/components/ProductReviews";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  X, ShoppingCart, MessageCircle, Heart, Star, CheckCircle2,
  Minus, Plus, Truck, RotateCcw, Shield, ArrowRight,
  AlertTriangle, ChevronLeft, ChevronRight
} from "lucide-react";

interface Product {
  id: string; name: string; description: string | null; price: number;
  category_id: string | null; image_url: string | null; video_url?: string | null;
  stock_quantity?: number; avg_rating?: number; review_count?: number;
}
interface Category { id: string; name: string; slug: string; }

interface Props {
  product: Product | null;
  category?: Category;
  isOpen: boolean;
  onClose: () => void;
  onOrder: (product: Product) => void;
}

export const ProductQuickView = ({ product, category, isOpen, onClose, onOrder }: Props) => {
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<"details"|"reviews">("details");

  if (!product) return null;

  const stock      = product.stock_quantity ?? 999;
  const outOfStock = stock === 0;
  const lowStock   = stock > 0 && stock <= 5;
  const inCart     = isInCart(product.id);
  const wishlisted = isWishlisted(product.id);
  const rating     = product.avg_rating ?? 0;
  const reviews    = product.review_count ?? 0;

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) addToCart(product);
    toast.success(`${qty > 1 ? qty + "× " : ""}${product.name} added to cart!`);
  };

  const handleOrder = () => {
    onOrder(product);
    onClose();
  };

  const goToDetail = () => {
    onClose();
    navigate(`/product/${product.id}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl max-h-[95vh]">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md text-foreground hover:bg-[#1c1c1c] hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid md:grid-cols-2 overflow-y-auto max-h-[95vh]">

          {/* ── LEFT: IMAGE ── */}
          <div className="relative bg-[#f6f6f6] aspect-square md:aspect-auto md:min-h-[480px] overflow-hidden">
            {product.video_url ? (
              <video
                src={product.video_url}
                poster={product.image_url || undefined}
                className="h-full w-full object-cover"
                controls preload="metadata"
              />
            ) : (
              <img
                src={product.image_url || "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=800&h=800&fit=crop&q=80"}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {outOfStock && <Badge className="bg-[#1c1c1c] text-white border-0 rounded-sm text-[10px] uppercase tracking-wider">Sold out</Badge>}
              {lowStock && !outOfStock && (
                <Badge className="bg-amber-500 text-white border-0 rounded-sm text-[10px] uppercase tracking-wider">
                  <AlertTriangle className="h-2.5 w-2.5 mr-1" />{stock} left
                </Badge>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={() => toggleWishlist(product.id, product.name)}
              className={`absolute top-4 right-12 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md transition-all ${wishlisted ? "text-red-500" : "text-[#1c1c1c]"}`}
            >
              <Heart className={`h-4.5 w-4.5 ${wishlisted ? "fill-red-500" : ""}`} />
            </button>

            {/* View full page */}
            <button
              onClick={goToDetail}
              className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-sm bg-white/95 px-3 py-2 text-xs font-semibold text-[#1c1c1c] shadow hover:bg-[#1c1c1c] hover:text-white transition-colors"
            >
              Full details <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ── RIGHT: INFO ── */}
          <div className="flex flex-col bg-white p-7 overflow-y-auto">

            {/* Vendor + category */}
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Tupperware{category ? ` · ${category.name}` : ""}
            </p>

            {/* Name */}
            <h2 className="text-2xl font-bold leading-tight text-[#1c1c1c] mb-2">{product.name}</h2>

            {/* Stars */}
            {reviews > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-none text-gray-200"}`} />
                  ))}
                </div>
                <button onClick={() => setActiveTab("reviews")} className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline">
                  {rating.toFixed(1)} ({reviews} review{reviews !== 1 ? "s" : ""})
                </button>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className={`text-3xl font-bold ${outOfStock ? "text-muted-foreground" : "text-[#1c1c1c]"}`}>
                ${product.price.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">USD</span>
            </div>

            {/* Stock status */}
            <p className={`text-sm font-semibold mb-4 flex items-center gap-1.5 ${outOfStock ? "text-red-500" : lowStock ? "text-amber-600" : "text-emerald-600"}`}>
              {outOfStock
                ? <><AlertTriangle className="h-4 w-4"/>Out of stock</>
                : <><CheckCircle2 className="h-4 w-4"/>{lowStock ? `Only ${stock} in stock` : "In stock"}</>
              }
            </p>

            {/* Description snippet */}
            {product.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-3">
                {product.description}
              </p>
            )}

            {/* Quantity */}
            {!outOfStock && (
              <div className="flex items-center gap-4 mb-5">
                <span className="text-sm font-medium text-muted-foreground">Qty</span>
                <div className="flex items-center border rounded-sm overflow-hidden">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:bg-muted transition-colors border-r">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{qty}</span>
                  <button onClick={() => setQty(Math.min(stock, qty + 1))} className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:bg-muted transition-colors border-l">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                {qty > 1 && <span className="text-sm font-bold text-primary">= ${(product.price * qty).toFixed(2)}</span>}
              </div>
            )}

            {/* CTAs */}
            <div className="space-y-2.5 mb-5">
              {!outOfStock && (
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  className={`w-full h-12 rounded-sm text-sm font-semibold tracking-wide transition-all ${inCart ? "bg-emerald-600 hover:bg-emerald-700" : "bg-[#1c1c1c] hover:bg-[#333] text-white"}`}
                >
                  {inCart
                    ? <><CheckCircle2 className="h-4.5 w-4.5 mr-2"/>Added to Cart</>
                    : <><ShoppingCart className="h-4.5 w-4.5 mr-2"/>Add to Cart — ${(product.price * qty).toFixed(2)}</>
                  }
                </Button>
              )}

              <Button
                size="lg"
                onClick={handleOrder}
                disabled={outOfStock}
                className="w-full h-12 rounded-sm text-sm font-semibold tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <MessageCircle className="h-4.5 w-4.5 mr-2"/>
                {outOfStock ? "Out of Stock" : "Order via WhatsApp"}
              </Button>
            </div>

            {/* Trust icons */}
            <div className="border-t pt-4 grid grid-cols-3 gap-3">
              {[
                { icon: Truck, text: "Free delivery over $50" },
                { icon: RotateCcw, text: "Lifetime warranty" },
                { icon: Shield, text: "100% genuine" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-1.5 text-center">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground leading-tight">{text}</span>
                </div>
              ))}
            </div>

            {/* Tabs: Details / Reviews */}
            <div className="mt-5 border-t pt-4">
              <div className="flex gap-0 border-b mb-4">
                {(["details","reviews"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-xs font-semibold capitalize border-b-2 transition-colors ${activeTab === tab ? "border-[#1c1c1c] text-[#1c1c1c]" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                    {tab}{tab === "reviews" && reviews > 0 ? ` (${reviews})` : ""}
                  </button>
                ))}
              </div>

              {activeTab === "details" && (
                <div className="space-y-2">
                  {[
                    { label: "Material", value: "BPA-free, food-safe plastic" },
                    { label: "Brand", value: "Tupperware" },
                    { label: "Warranty", value: "Lifetime guarantee" },
                    { label: "Origin", value: "Official distributor — Zimbabwe" },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between text-xs py-1.5 border-b border-dashed border-border/50">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="max-h-64 overflow-y-auto">
                  <ProductReviews productId={product.id} avgRating={rating} reviewCount={reviews} />
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
