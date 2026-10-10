import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, CheckCircle2, AlertTriangle, Eye, Star, Layers, MessageCircle } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
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
  const rating = product.avg_rating ?? 0;
  const reviewCount = product.review_count ?? 0;
  const originalPrice = product.original_price ?? product.price;
  const savings = Math.max(0, originalPrice - product.price);

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("input")) return;
    navigate(`/product/${product.id}`);
  }, [navigate, product.id]);

  const displayImage = !imgError ? resolveProductImage(product) : media.imageUrl;

  return (
    <article
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0046be]/50 hover:shadow-lg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
    >
      {/* Compact Best Buy-inspired product image area */}
      <div className="relative flex h-40 shrink-0 items-center justify-center overflow-hidden bg-white px-4 py-3 sm:h-44">
        {product.video_url && !imgError ? (
          <video
            src={product.video_url}
            poster={displayImage}
            muted
            loop
            playsInline
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <img
            src={displayImage}
            alt={product.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}

        <div className="absolute left-2 top-2 z-10 flex max-w-[75%] flex-col items-start gap-1">
          {savings > 0 && !outOfStock && (
            <span className="rounded-sm bg-[#bb0628] px-2 py-1 text-[10px] font-bold text-white">Save ${savings.toFixed(0)}</span>
          )}
          {outOfStock ? (
            <span className="rounded-sm bg-slate-800 px-2 py-1 text-[10px] font-bold text-white">Sold out</span>
          ) : lowStock ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-amber-500 px-2 py-1 text-[10px] font-bold text-white">
              <AlertTriangle className="h-3 w-3" /> Only {stock} left
            </span>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={wishlisted ? "Remove from wishlist" : "Save product"}
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id, product.name);
          }}
          className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors hover:border-[#0046be] hover:text-[#0046be] ${wishlisted ? "text-red-600" : "text-slate-600"}`}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-600" : ""}`} />
        </button>

        {onQuickView && !outOfStock && (
          <div className={`absolute inset-0 z-10 flex items-center justify-center bg-slate-900/10 transition-opacity ${hovered ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-md hover:bg-[#0046be] hover:text-white"
            >
              <Eye className="h-4 w-4" /> Quick view
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col border-t border-slate-100 p-3">
        <div className="mb-1 flex min-h-4 items-center justify-between gap-2">
          <span className="truncate text-[11px] font-bold uppercase tracking-wide text-[#0046be]">
            {product.brand || media.brand.split("/")[0]}
          </span>
          <span className="truncate text-[10px] text-slate-400">{product.model_number || media.modelNumber}</span>
        </div>

        <h3 className="min-h-[2.5rem] cursor-pointer text-sm font-semibold leading-5 text-[#0046be] line-clamp-2 hover:underline">
          {product.name}
        </h3>

        <div className="mt-1.5 flex min-h-4 items-center gap-1.5">
          <div className="flex items-center" aria-label={`Rated ${rating} out of 5`}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`h-3 w-3 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`} />
            ))}
          </div>
          <span className="text-[11px] text-[#0046be]">{reviewCount > 0 ? reviewCount : "No"} reviews</span>
        </div>

        <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
          <span className="text-2xl font-extrabold leading-7 tracking-tight text-slate-950">${product.price.toFixed(2)}</span>
          {savings > 0 && <span className="text-xs text-slate-500 line-through">${originalPrice.toFixed(2)}</span>}
        </div>

        {(product.variant_count ?? 0) > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${product.id}`);
            }}
            className="mt-1.5 inline-flex items-center gap-1 text-left text-[11px] font-semibold text-[#0046be] hover:underline"
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            {(product.variant_count ?? 0) === 1 ? "View product option" : `Choose from ${product.variant_count} configurations`}
          </button>
        )}

        <div className="mt-2 space-y-1 text-[11px]">
          <p className="flex items-center gap-1.5 font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>Pickup available in Harare</span>
          </p>
          <p className="pl-5 text-slate-500">Nationwide delivery available</p>
        </div>

        <div className="mt-auto pt-3">
          {!outOfStock ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onAddToCart) onAddToCart(product);
                else onOrder(product);
              }}
              className={`flex h-9 w-full items-center justify-center gap-2 rounded-md px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0046be] focus-visible:ring-offset-2 ${
                inCart
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-[#ffe000] text-slate-950 hover:bg-[#f5d500]"
              }`}
            >
              {inCart ? <><CheckCircle2 className="h-4 w-4" /> Added to cart</> : <><ShoppingCart className="h-4 w-4" /> Add to cart</>}
            </button>
          ) : (
            <button type="button" disabled className="h-9 w-full cursor-not-allowed rounded-md bg-slate-200 text-xs font-bold text-slate-500">
              Currently sold out
            </button>
          )}

          <div className="mt-2 flex min-h-5 items-center justify-between gap-2">
            {onToggleCompare ? (
              <label onClick={(e) => e.stopPropagation()} className="flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  checked={isCompared}
                  onChange={() => onToggleCompare(product)}
                  className="h-3.5 w-3.5 rounded border-slate-300 accent-[#0046be]"
                />
                Compare
              </label>
            ) : <span />}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOrder(product);
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
