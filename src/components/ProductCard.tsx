import { useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye, Star, Heart, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);

  const wishlisted = isWishlisted(product.id);
  const inCart = isInCart(product.id);
  const stock = product.stock_quantity ?? 999;
  const outOfStock = stock === 0;
  const lowStock = stock > 0 && stock <= 5;
  const rating = product.avg_rating ?? 0;
  const reviewCount = product.review_count ?? 0;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    setTilt({ x: ((y - cy) / cy) * -10, y: ((x - cx) / cx) * 10 });
    setGlowPos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 });
    setHovered(false);
  }, []);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm cursor-pointer select-none"
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${hovered ? "6px" : "0px"})`,
        transition: hovered ? "transform 0.08s ease-out, box-shadow 0.15s ease" : "transform 0.4s ease, box-shadow 0.4s ease",
        boxShadow: hovered
          ? "0 20px 40px -8px hsl(180 65% 45% / 0.25), 0 0 0 1px hsl(180 65% 45% / 0.1)"
          : "0 2px 8px -2px hsl(0 0% 0% / 0.08)",
        willChange: "transform",
      }}
    >
      {/* Holographic glow */}
      {hovered && (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl" style={{
          background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, hsl(180 65% 55% / 0.15) 0%, transparent 65%)`,
        }}/>
      )}

      {/* ── IMAGE ── */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-muted/60 to-muted/30">
        {/* Tupperware ribbon */}
        <div className="absolute left-0 top-2.5 z-20">
          <span className="rounded-r-full bg-primary px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-white shadow-sm">
            Tupperware
          </span>
        </div>

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow">Out of Stock</span>
          </div>
        )}

        {/* Low stock badge */}
        {lowStock && !outOfStock && (
          <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 shadow">
            <AlertTriangle className="h-2.5 w-2.5 text-white"/>
            <span className="text-[9px] font-bold text-white">Only {stock} left</span>
          </div>
        )}

        {/* Top rated badge */}
        {rating >= 4.5 && reviewCount >= 3 && !outOfStock && (
          <div className="absolute top-2.5 right-9 z-20 flex items-center gap-0.5 rounded-full bg-amber-400 px-1.5 py-0.5 shadow">
            <Zap className="h-2.5 w-2.5 text-amber-900"/>
            <span className="text-[8px] font-extrabold text-amber-900">Top Rated</span>
          </div>
        )}

        {/* Wishlist button */}
        <button
          aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
          onClick={e => { e.stopPropagation(); toggleWishlist(product.id, product.name); }}
          className={`absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full shadow-md transition-all duration-200 ${
            wishlisted
              ? "bg-white text-red-500 scale-110"
              : "bg-white/90 text-muted-foreground opacity-0 group-hover:opacity-100 hover:scale-110"
          }`}
        >
          <Heart className={`h-3.5 w-3.5 transition-all ${wishlisted ? "fill-red-500" : ""}`}/>
        </button>

        {/* Quick view */}
        {onQuickView && (
          <button
            aria-label="Quick view"
            onClick={e => { e.stopPropagation(); onQuickView(product); }}
            className={`absolute right-10 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-foreground shadow-md transition-all duration-200 hover:bg-primary hover:text-white ${
              hovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <Eye className="h-3 w-3"/>
          </button>
        )}

        {/* Product image */}
        {product.video_url ? (
          <video
            src={product.video_url}
            poster={product.image_url || undefined}
            className="h-full w-full object-cover transition-transform duration-700"
            style={{ transform: hovered ? "scale(1.08)" : "scale(1)" }}
            preload="metadata"
          />
        ) : (
          <img
            src={product.image_url || "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=400&h=300&fit=crop&q=80"}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700"
            style={{ transform: hovered ? "scale(1.08)" : "scale(1)" }}
          />
        )}

        {/* Bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"/>
      </div>

      {/* ── BODY ── */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {/* Star rating */}
        <div className="flex items-center gap-1 h-4">
          <div className="flex items-center gap-0.5">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`h-2.5 w-2.5 transition-all duration-200 ${
                s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/20"
              }`}
                style={{ transform: hovered && s <= Math.round(rating) ? "scale(1.15)" : "scale(1)", transitionDelay: `${s * 20}ms` }}
              />
            ))}
          </div>
          {reviewCount > 0 && (
            <span className="text-[9px] text-muted-foreground">({reviewCount})</span>
          )}
        </div>

        {/* Product name */}
        <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-foreground transition-colors duration-200 group-hover:text-primary min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Price + actions */}
        <div className="mt-auto flex items-center justify-between gap-1.5 pt-1">
          <p
            className="text-sm font-extrabold text-primary transition-all duration-200"
            style={{ textShadow: hovered ? "0 0 10px hsl(180 65% 45% / 0.35)" : "none" }}
          >
            ${product.price.toFixed(2)}
          </p>

          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {/* Add to cart */}
            {onAddToCart && !outOfStock && (
              <button
                aria-label="Add to cart"
                onClick={() => onAddToCart(product)}
                className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all duration-200 ${
                  inCart
                    ? "border-emerald-500 bg-emerald-50 text-emerald-600 scale-110 shadow-sm"
                    : "border-border/70 bg-background text-muted-foreground hover:border-primary hover:bg-primary/10 hover:text-primary hover:scale-110"
                }`}
                style={{ boxShadow: inCart ? "0 0 8px hsl(140 60% 45% / 0.35)" : undefined }}
              >
                {inCart ? <CheckCircle2 className="h-3 w-3"/> : <ShoppingCart className="h-3 w-3"/>}
              </button>
            )}

            {/* Order button */}
            <Button
              size="sm"
              disabled={outOfStock}
              onClick={e => { e.stopPropagation(); if (!outOfStock) onOrder(product); }}
              className={`h-6 rounded-full px-2.5 text-[10px] font-bold transition-all duration-200 ${
                outOfStock
                  ? "opacity-40 cursor-not-allowed"
                  : "bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-105"
              }`}
              style={{ boxShadow: hovered && !outOfStock ? "0 3px 10px hsl(15 85% 60% / 0.35)" : undefined }}
            >
              {outOfStock ? "Sold out" : "Order"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
