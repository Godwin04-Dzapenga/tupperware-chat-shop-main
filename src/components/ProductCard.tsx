import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye, Star } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  video_url?: string | null;
}

interface ProductCardProps {
  product: Product;
  onOrder: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard = ({ product, onOrder, onQuickView, onAddToCart }: ProductCardProps) => {
  return (
    <article className="product-card group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm [perspective:1200px] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_24px_-6px_hsl(180_65%_45%/0.25)] group-hover:[transform:rotateX(2deg)_rotateY(-2deg)_translateY(-4px)]">
      {/* Image — short height */}
      <div className="relative h-32 overflow-hidden bg-muted/30 [transform-style:preserve-3d] sm:h-36">
        {/* Category ribbon */}
        <span className="absolute left-0 top-2 z-10 rounded-r-full bg-primary px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-primary-foreground shadow">
          Tupperware
        </span>

        {/* Quick-view button */}
        {onQuickView && (
          <button
            aria-label="Quick view"
            onClick={() => onQuickView(product)}
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow transition-all duration-200 group-hover:opacity-100 hover:bg-primary hover:text-white"
          >
            <Eye className="h-3 w-3" />
          </button>
        )}

        {product.video_url ? (
          <video
            src={product.video_url}
            poster={product.image_url || "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=400&h=300&fit=crop"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
            controls
            preload="metadata"
          />
        ) : (
          <img
            src={product.image_url || "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=400&h=300&fit=crop"}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
          />
        )}

        {/* Subtle hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      {/* Card body — very compact */}
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        {/* Stars */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
          ))}
        </div>

        {/* Product name */}
        <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
          {product.name}
        </h3>

        {/* Price + actions — pinned to bottom */}
        <div className="mt-auto flex items-center justify-between gap-1.5 pt-1.5">
          <p className="text-sm font-bold text-primary">${product.price.toFixed(2)}</p>

          <div className="flex items-center gap-1">
            {onAddToCart && (
              <button
                onClick={() => onAddToCart(product)}
                aria-label="Add to cart"
                className="flex h-6 w-6 items-center justify-center rounded-full border border-border/80 bg-background text-muted-foreground transition-all hover:border-primary hover:bg-primary/10 hover:text-primary"
              >
                <ShoppingCart className="h-3 w-3" />
              </button>
            )}
            <Button
              onClick={() => onOrder(product)}
              size="sm"
              className="h-6 rounded-full bg-accent px-2.5 text-[10px] font-bold text-accent-foreground hover:bg-accent/90"
            >
              Order
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};
