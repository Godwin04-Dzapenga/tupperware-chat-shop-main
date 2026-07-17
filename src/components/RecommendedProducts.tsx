import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductCard } from "@/components/ProductCard";
import { Sparkles } from "lucide-react";
import { useRecommendations, Product } from "@/hooks/useRecommendations";
import { toast } from "sonner";

interface Props {
  allProducts: Product[];
  onOrder: (product: any) => void;
  onQuickView: (product: any) => void;
}

export function RecommendedProducts({ allProducts, onOrder, onQuickView }: Props) {
  const { addToCart } = useCart();
  const { recommendations } = useRecommendations(allProducts, 6);

  if (recommendations.length < 2) return null;

  return (
    <section className="mt-16">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-foreground">Recommended for You</h2>
          <p className="text-xs text-muted-foreground">Personalised picks based on your browsing</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        {recommendations.map((product) => (
          <ProductCard
            key={product.id}
            product={product as any}
            onOrder={onOrder}
            onQuickView={onQuickView}
            onAddToCart={(p) => {
              addToCart(p);
              toast.success(`${p.name} added to cart!`);
            }}
          />
        ))}
      </div>
    </section>
  );
}
