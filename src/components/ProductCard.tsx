import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, CheckCircle2, AlertTriangle, Eye, Star, Layers, MessageCircle } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";
import { getProductMedia, resolveProductImage } from "@/data/solarProducts";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price?: number;
  category_id: string | null;
  image_url: string | null;
  video_url?: string | null;
  stock_quantity?: number;
  avg_rating?: number;
  review_count?: number;
  brand?: string | null;
  model_number?: string | null;
  product_type?: string;
  variant_count?: number;
  variant_names?: string[];
}

interface Props {
  product: Product;
  onOrder: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  isCompared?: boolean;
  onToggleCompare?: (product: Product) => void;
}

export const ProductCard = ({
  product,
  onOrder,
  onQuickView,
  onAddToCart,
  isCompared = false,
  onToggleCompare,
}: Props) => {
  const navigate = useNavigate();
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();
  const { isInCart } = useCart();
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);

  const media = getProductMedia(product);
  const wishlisted = isWishlisted(product.id);
  const inCart = isInCart(product.id);
  const stock = product.stock_quantity ?? 999;
  const outOfStock = stock === 0;
  const lowStock = stock > 0 && stock <= 5;
  const rating = product.avg_rating || 4.9;
  const reviewCount = product.review_count || 14;

  const originalPrice = product.original_price ?? product.price;
  const savings = Math.max(0, originalPrice - product.price);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input")) return;
    navigate(`/product/${product.id}`);
  }, [navigate, product.id]);

  const displayImage = !imgError ? resolveProductImage(product) : media.imageUrl;

  return (
    <div
      className="group relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:border-bb-blue/40 hover:shadow-xl sm:p-3.5"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
    >
      {/* ── Image & Top Badges ── */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-50">
        {product.video_url && !imgError ? (
          <video
            src={product.video_url}
            poster={displayImage}
            muted
            loop
            playsInline
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <img
            src={displayImage}
            alt={product.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}

        {/* Badges on Image */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {savings > 0 && !outOfStock && (
            <span className="rounded bg-bb-red px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
              Save ${savings}
            </span>
          )}
          {outOfStock ? (
            <span className="rounded bg-bb-ink px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Sold out
            </span>
          ) : lowStock ? (
            <span className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1">
              <AlertTriangle className="h-2.5 w-2.5" /> Only {stock} left
            </span>
          ) : null}
        </div>

        {/* Wishlist Heart Button */}
        <button
          aria-label={wishlisted ? "Remove from wishlist" : "Save product"}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id, product.name);
          }}
          className={`absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-md transition-all duration-200 ${
            wishlisted ? "text-red-500 scale-100" : "text-slate-600 opacity-80 hover:opacity-100 hover:scale-110"
          }`}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
        </button>

        {/* Quick View Button on Hover */}
        {onQuickView && !outOfStock && (
          <div
            className={`absolute inset-0 z-10 flex items-center justify-center bg-black/15 transition-opacity duration-200 ${
              hovered ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-xs font-bold text-slate-900 shadow-xl hover:bg-bb-blue hover:text-white transition-colors"
            >
              <Eye className="h-3.5 w-3.5" /> Quick View
            </button>
          </div>
        )}
      </div>

      {/* ── Content Details ── */}
      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div>
          {/* Brand & Model */}
          <div className="flex items-center justify-between gap-1 text-[11px]">
            <span className="font-extrabold uppercase tracking-wider text-bb-blue">
              {product.brand || media.brand.split("/")[0]}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {product.model_number || media.modelNumber}
            </span>
          </div>

          {/* Product Title */}
          <h3 className="mt-1 text-sm font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-bb-blue transition-colors">
            {product.name}
          </h3>

          {/* Star Rating */}
          <div className="mt-1.5 flex items-center gap-1 text-xs">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-3 w-3 ${
                    s <= Math.round(rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-slate-200 text-slate-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-700">({reviewCount})</span>
          </div>

          {/* Price Block */}
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-xl font-black tracking-tight text-bb-ink">
              ${product.price.toFixed(2)}
            </span>
            {savings > 0 && (
              <span className="text-xs text-slate-400 line-through">
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Store Pickup & Delivery status pills */}
          <div className="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px]">
            <p className="flex items-center gap-1.5 font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
              <span>Pickup available in Harare</span>
            </p>
            <p className="mt-0.5 pl-4 text-slate-500">Nationwide delivery available</p>
          </div>
        </div>

        {/* ── Yellow Add to Cart & Actions ── */}
        <div className="mt-auto pt-4 border-t border-slate-100 space-y-2.5">
          {!outOfStock ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onAddToCart) onAddToCart(product);
                else onOrder(product);
              }}
              className={`w-full h-10 rounded-md font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all ${
                inCart
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-bb-yellow text-black hover:bg-bb-yellow-dark"
              }`}
            >
              {inCart ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </>
              )}
            </button>
          ) : (
            <button
              disabled
              className="w-full h-10 rounded-md bg-slate-200 text-slate-500 font-bold text-xs uppercase cursor-not-allowed"
            >
              Currently Sold Out
            </button>
          )}

          {/* Secondary actions */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            {onToggleCompare && (
              <label
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-500 hover:text-slate-900 select-none"
              >
                <input
                  type="checkbox"
                  checked={isCompared}
                  onChange={() => onToggleCompare(product)}
                  className="h-3.5 w-3.5 rounded border-slate-300 accent-bb-blue"
                />
                <span>Compare</span>
              </label>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOrder(product);
              }}
              className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              <MessageCircle className="h-3 w-3 text-wa" /> Ask on WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
