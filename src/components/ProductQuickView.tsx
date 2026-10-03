import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  X,
  ShoppingCart,
  MessageCircle,
  Heart,
  Star,
  CheckCircle2,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { getProductMedia, resolveProductImage } from "@/data/solarProducts";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  video_url?: string | null;
  stock_quantity?: number;
  avg_rating?: number;
  review_count?: number;
  brand?: string | null;
  model_number?: string | null;
  product_type?: string;
  default_variant_id?: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

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

  if (!product) return null;

  const media = getProductMedia(product);
  const stock = product.stock_quantity ?? 999;
  const outOfStock = stock === 0;
  const lowStock = stock > 0 && stock <= 5;
  const inCart = isInCart(product.id);
  const wishlisted = isWishlisted(product.id);
  const rating = product.avg_rating || 4.9;
  const reviews = product.review_count || 14;

  const originalPrice = media.originalPrice > product.price ? media.originalPrice : Math.round(product.price * 1.18);
  const savings = originalPrice - product.price;

  const handleAddToCart = () => {
    addToCart({
      ...product,
      product_id: product.id,
      variant_id: product.default_variant_id || null,
      quantity: qty,
    } as any);
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

  const displayImage = resolveProductImage(product);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl max-h-[95vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md text-slate-700 hover:bg-slate-900 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid md:grid-cols-2 overflow-y-auto max-h-[95vh]">
          {/* ── LEFT: IMAGE ── */}
          <div className="relative bg-slate-100 aspect-square md:aspect-auto md:min-h-[460px] overflow-hidden flex items-center justify-center">
            {product.video_url ? (
              <video
                src={product.video_url}
                poster={displayImage}
                className="h-full w-full object-cover"
                controls
                preload="metadata"
              />
            ) : (
              <img
                src={displayImage}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            )}

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {savings > 0 && !outOfStock && (
                <Badge className="bg-bb-red text-white border-0 rounded font-black text-xs uppercase tracking-wider">
                  Save ${savings}
                </Badge>
              )}
              {outOfStock && (
                <Badge className="bg-bb-ink text-white border-0 rounded font-bold text-xs uppercase">
                  Sold out
                </Badge>
              )}
              {lowStock && !outOfStock && (
                <Badge className="bg-amber-500 text-white border-0 rounded font-bold text-xs uppercase flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Only {stock} left
                </Badge>
              )}
            </div>

            {/* Wishlist */}
            <button
              onClick={() => toggleWishlist(product.id, product.name)}
              className={`absolute top-4 right-14 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-all ${
                wishlisted ? "text-red-500" : "text-slate-700 hover:scale-105"
              }`}
            >
              <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
            </button>

            {/* View full page button */}
            <button
              onClick={goToDetail}
              className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-md bg-white/95 px-3.5 py-2 text-xs font-bold text-slate-900 shadow hover:bg-bb-blue hover:text-white transition-colors"
            >
              Full Specs & Reviews <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ── RIGHT: INFO ── */}
          <div className="flex flex-col bg-white p-6 sm:p-7 overflow-y-auto">
            {/* Vendor + category */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-bb-blue">
                {product.brand || media.brand}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {product.model_number || media.modelNumber}
              </span>
            </div>

            {/* Name */}
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              {product.name}
            </h2>

            {/* Stars */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-3.5 w-3.5 ${
                      s <= Math.round(rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-slate-200 text-slate-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700">{rating.toFixed(1)}</span>
              <span className="text-xs text-slate-400">({reviews} customer reviews)</span>
            </div>

            {/* Pricing Box */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-bb-ink">
                  ${product.price.toFixed(2)}
                </span>
                {savings > 0 && (
                  <span className="ml-2 text-sm text-slate-400 line-through">
                    ${originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              {savings > 0 && (
                <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Save ${savings}
                </span>
              )}
            </div>

            {/* Key Specs */}
            <div className="mt-4 space-y-1.5 text-xs text-slate-700">
              <p className="font-bold text-[11px] uppercase tracking-wider text-slate-400">Key Features</p>
              {media.keySpecs.slice(0, 3).map((spec, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{spec}</span>
                </div>
              ))}
            </div>

            {/* Pickup & Delivery */}
            <div className="mt-4 rounded-lg border border-slate-200 p-2.5 space-y-1 text-xs">
              <p className="text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {media.pickupStatus}
              </p>
              <p className="text-slate-500 text-[11px] flex items-center gap-1.5">
                <Truck className="h-3 w-3 text-slate-400" />
                {media.deliveryStatus}
              </p>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
              {!outOfStock ? (
                <>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600">Qty:</span>
                    <div className="flex items-center border border-slate-300 rounded-lg">
                      <button
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="px-3 py-1.5 text-slate-600 hover:text-black font-bold"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-3 text-xs font-bold text-slate-900">{qty}</span>
                      <button
                        onClick={() => setQty(qty + 1)}
                        className="px-3 py-1.5 text-slate-600 hover:text-black font-bold"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleAddToCart}
                      className="bg-bb-yellow hover:bg-bb-yellow-dark text-black font-extrabold text-xs h-11 rounded-lg shadow-sm"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1.5" /> Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleOrder}
                      className="border-slate-300 text-slate-800 hover:bg-slate-100 font-bold text-xs h-11 rounded-lg"
                    >
                      <MessageCircle className="h-4 w-4 mr-1.5 text-wa" /> WhatsApp Order
                    </Button>
                  </div>
                </>
              ) : (
                <Button disabled className="w-full bg-slate-200 text-slate-500 font-bold h-11">
                  Sold Out
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
