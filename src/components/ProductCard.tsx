import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye, Star, Heart, CheckCircle2, AlertTriangle } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";

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
}

interface ProductCardProps {
  product: Product;
  onOrder: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard = ({ product, onOrder, onQuickView, onAddToCart }: ProductCardProps) => {
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();
  const { isInCart } = useCart();
  const wishlisted = isWishlisted(product.id);
  const inCart = isInCart(product.id);
  const stock = product.stock_quantity ?? 999;
  const outOfStock = stock === 0;
  const lowStock = stock > 0 && stock <= 5;
  const rating = product.avg_rating ?? 0;
  const reviewCount = product.review_count ?? 0;

  return (
    <article className="product-card group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_24px_-6px_hsl(180_65%_45%/0.25)]">
      <div className="relative h-32 overflow-hidden bg-muted/30 sm:h-36">
        <span className="absolute left-0 top-2 z-10 rounded-r-full bg-primary px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary-foreground shadow">
          Tupperware
        </span>

        {outOfStock && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">Out of Stock</span>
          </div>
        )}
        {lowStock && !outOfStock && (
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white shadow">
            <AlertTriangle className="h-2.5 w-2.5" /> Only {stock} left
          </div>
        )}

        <button
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id, product.name); }}
          className={`absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full shadow transition-all duration-200 ${
            wishlisted ? "bg-red-50 text-red-500 opacity-100" : "bg-white/90 text-muted-foreground opacity-0 group-hover:opacity-100"
          } hover:scale-110`}
        >
          <Heart className={`h-3.5 w-3.5 ${wishlisted ? "fill-red-500" : ""}`} />
        </button>

        {onQuickView && (
          <button
            aria-label="Quick view"
            onClick={() => onQuickView(product)}
            className="absolute right-10 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow transition-all duration-200 group-hover:opacity-100 hover:bg-primary hover:text-white"
          >
            <Eye className="h-3 w-3" />
          </button>
        )}

        {product.video_url ? (
          <video
            src={product.video_url}
            poster={product.image_url || "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=400&h=300&fit=crop"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            controls preload="metadata"
          />
        ) : (
          <img
            src={product.image_url || "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=400&h=300&fit=crop"}
            alt={product.name} loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`h-2.5 w-2.5 ${s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/20"}`} />
            ))}
          </div>
          {reviewCount > 0 && <span className="text-[9px] text-muted-foreground">({reviewCount})</span>}
        </div>

        <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
          {product.name}
        </h3>

        <div className="mt-auto flex items-center justify-between gap-1.5 pt-1.5">
          <p className="text-sm font-bold text-primary">${product.price.toFixed(2)}</p>
          <div className="flex items-center gap-1">
            {onAddToCart && !outOfStock && (
              <button
                onClick={() => onAddToCart(product)}
                aria-label="Add to cart"
                className={`flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                  inCart ? "border-emerald-500 bg-emerald-50 text-emerald-600" : "border-border/80 bg-background text-muted-foreground hover:border-primary hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {inCart ? <CheckCircle2 className="h-3 w-3" /> : <ShoppingCart className="h-3 w-3" />}
              </button>
            )}
            <Button
              onClick={() => !outOfStock && onOrder(product)}
              size="sm" disabled={outOfStock}
              className={`h-6 rounded-full px-2.5 text-[10px] font-bold ${outOfStock ? "opacity-50 cursor-not-allowed" : "bg-accent text-accent-foreground hover:bg-accent/90"}`}
            >
              {outOfStock ? "Sold out" : "Order"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};
