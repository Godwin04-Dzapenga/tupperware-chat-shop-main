import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  video_url?: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductQuickViewProps {
  product: Product | null;
  category?: Category;
  isOpen: boolean;
  onClose: () => void;
  onOrder: (product: Product) => void;
}

export const ProductQuickView = ({ product, category, isOpen, onClose, onOrder }: ProductQuickViewProps) => {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Product Details</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="aspect-square overflow-hidden rounded-lg bg-muted">
            {product.video_url ? (
              <video
                src={product.video_url}
                poster={product.image_url || "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=600&h=600&fit=crop"}
                className="w-full h-full object-cover"
                controls
                preload="metadata"
              />
            ) : (
              <img
                src={product.image_url || "https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=600&h=600&fit=crop"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          
          <div className="flex flex-col">
            {category && (
              <Badge variant="secondary" className="w-fit mb-3">
                {category.name}
              </Badge>
            )}
            
            <h2 className="text-3xl font-bold mb-3">{product.name}</h2>
            
            <div className="text-4xl font-bold text-primary mb-4">
              ${product.price.toFixed(2)}
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description || "Premium TuppAfrica product designed to keep your food fresh and organized. Made with high-quality materials for long-lasting durability."}
              </p>
            </div>
            
            <div className="mt-6 space-y-3">
              <Button
                onClick={() => {
                  onOrder(product);
                  onClose();
                }}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-full h-12 text-lg"
                size="lg"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Order on WhatsApp
              </Button>
              
              <div className="text-xs text-center text-muted-foreground">
                Click to order via WhatsApp instantly
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
