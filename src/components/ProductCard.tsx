import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, CheckCircle2, AlertTriangle, Eye, Star } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";

interface Product {
  id: string; name: string; description: string | null; price: number;
  category_id: string | null; image_url: string | null; video_url?: string | null;
  stock_quantity?: number; avg_rating?: number; review_count?: number;
}

interface Props {
  product: Product;
  onOrder: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard = ({ product, onOrder, onQuickView, onAddToCart }: Props) => {
  const navigate = useNavigate();
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();
  const { isInCart } = useCart();
  const [imgError, setImgError] = useState(false);
  const [hovered, setHovered] = useState(false);

  const wishlisted  = isWishlisted(product.id);
  const inCart      = isInCart(product.id);
  const stock       = product.stock_quantity ?? 999;
  const outOfStock  = stock === 0;
  const lowStock    = stock > 0 && stock <= 5;
  const rating      = product.avg_rating ?? 0;
  const reviewCount = product.review_count ?? 0;

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    navigate(`/product/${product.id}`);
  }, [navigate, product.id]);

  const imgSrc = (!imgError && product.image_url)
    ? product.image_url
    : "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=600&h=600&fit=crop&q=80";

  return (
    <div
      className="group relative flex flex-col bg-white cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleCardClick}
    >
      {/* ── IMAGE BLOCK ── */}
      <div className="relative overflow-hidden bg-[#f6f6f6] aspect-square w-full">

        {/* Product image */}
        {product.video_url && !imgError ? (
          <video
            src={product.video_url}
            poster={product.image_url || undefined}
            muted loop playsInline
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-[1.04]"
          />
        ) : (
          <img
            src={imgSrc}
            alt={product.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-[1.04]"
          />
        )}

        {/* Out of stock wash */}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/60" />
        )}

        {/* ── BADGES (top-left) ── */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {outOfStock && (
            <span className="inline-block rounded-sm bg-[#1c1c1c] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              Sold out
            </span>
          )}
          {lowStock && !outOfStock && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-amber-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              <AlertTriangle className="h-2.5 w-2.5" /> {stock} left
            </span>
          )}
          {rating >= 4.5 && reviewCount >= 3 && !outOfStock && (
            <span className="inline-block rounded-sm bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              Best seller
            </span>
          )}
        </div>

        {/* ── WISHLIST (top-right) ── */}
        <button
          aria-label={wishlisted ? "Remove from wishlist" : "Save"}
          onClick={e => { e.stopPropagation(); toggleWishlist(product.id, product.name); }}
          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-all duration-200
            ${wishlisted ? "opacity-100 scale-100" : "opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100"}`}
        >
          <Heart className={`h-4 w-4 transition-colors ${wishlisted ? "fill-red-500 text-red-500" : "text-[#1c1c1c]"}`} />
        </button>

        {/* ── QUICK-ADD BUTTON (bottom, slides up on hover) ── */}
        {!outOfStock && (
          <div
            className={`absolute inset-x-0 bottom-0 z-10 px-3 pb-3 transition-all duration-300 ease-in-out
              ${hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
          >
            <button
              onClick={e => { e.stopPropagation(); onAddToCart ? onAddToCart(product) : onOrder(product); }}
              className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold uppercase tracking-widest transition-all duration-150 rounded-sm shadow
                ${inCart
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-[#1c1c1c] hover:bg-[#1c1c1c] hover:text-white"
                }`}
            >
              {inCart
                ? <><CheckCircle2 className="h-3.5 w-3.5" /> Added</>
                : <><ShoppingCart className="h-3.5 w-3.5" /> Add to cart</>
              }
            </button>
          </div>
        )}

        {/* ── QUICK VIEW (center, appears on hover) ── */}
        {onQuickView && (
          <div className={`absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-200 ${hovered && !outOfStock ? "opacity-100" : "opacity-0"}`}>
            <button
              onClick={e => { e.stopPropagation(); onQuickView(product); }}
              className="flex items-center gap-1.5 rounded-sm bg-white/95 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-widest text-[#1c1c1c] shadow-lg hover:bg-[#1c1c1c] hover:text-white transition-colors duration-150"
              style={{ marginBottom: 48 }} // sit above the quick-add button
            >
              <Eye className="h-3.5 w-3.5" /> Quick view
            </button>
          </div>
        )}
      </div>

      {/* ── INFO BLOCK ── */}
      <div className="mt-3 flex flex-col gap-1 px-0.5">

        {/* Vendor line */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Tupperware
        </p>

        {/* Product name */}
        <h3 className="text-sm font-medium leading-snug text-[#1c1c1c] line-clamp-2 group-hover:underline underline-offset-2 decoration-[1px]">
          {product.name}
        </h3>

        {/* Star rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  className={`h-3 w-3 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-none text-gray-200"}`}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground">({reviewCount})</span>
          </div>
        )}

        {/* Price row */}
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className={`text-sm font-semibold ${outOfStock ? "text-muted-foreground" : "text-[#1c1c1c]"}`}>
            ${product.price.toFixed(2)}
          </span>
          {outOfStock && (
            <span className="text-xs text-muted-foreground">Sold out</span>
          )}
        </div>

        {/* WhatsApp order fallback */}
        {!outOfStock && (
          <button
            onClick={e => { e.stopPropagation(); onOrder(product); }}
            className="mt-1 self-start text-[10px] font-semibold text-primary underline underline-offset-2 hover:text-primary/70 transition-colors"
          >
            Order via WhatsApp →
          </button>
        )}
      </div>
    </div>
  );
};
