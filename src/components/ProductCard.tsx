import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye } from "lucide-react";

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
    <Card className="group overflow-hidden hover:shadow-[var(--shadow-hover)] transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card to-muted/30">
      <div className="relative aspect-square overflow-hidden">
        {product.video_url ? (
          <video
            src={product.video_url}
            poster={product.image_url || "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=500&h=500&fit=crop"}
            className="w-full h-full object-cover"
            controls
            preload="metadata"
          />
        ) : (
          <img
            src={product.image_url || "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=500&h=500&fit=crop"}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        )}
        {onQuickView && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onQuickView(product)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>
      <CardContent className="p-5">
        <h3 className="font-semibold text-lg mb-2 text-foreground group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {product.description || "Premium TuppAfrica product"}
        </p>
        <p className="text-2xl font-bold text-primary">
          ${product.price.toFixed(2)}
        </p>
      </CardContent>
      <CardFooter className="p-5 pt-0 flex gap-2">
        {onAddToCart && (
          <Button 
            onClick={() => onAddToCart(product)}
            variant="outline"
            className="flex-1"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        )}
        <Button 
          onClick={() => onOrder(product)}
          className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Order Now
        </Button>
      </CardFooter>
    </Card>
  );
};
