import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";

interface CartProps {
  onOrder?: (items: Array<{ name: string; quantity: number; price: number }>) => void;
}

export const Cart = ({ onOrder }: CartProps) => {
  const { items, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const shippingFee = totalPrice >= 50 ? 0 : items.length > 0 ? 5 : 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-primary">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Cart ({totalItems} item{totalItems !== 1 ? "s" : ""})</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-6 space-y-3 pr-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <Button variant="outline" className="rounded-full text-xs" onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}>
                Browse Products
              </Button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 border rounded-xl bg-card">
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-lg shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <button
                      className="h-6 w-6 rounded-full border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      className="h-6 w-6 rounded-full border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      className="h-6 w-6 rounded-full ml-auto flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm font-bold text-primary shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t pt-4 space-y-3 mt-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shippingFee === 0 ? <span className="text-emerald-600 font-semibold">FREE</span> : `$${shippingFee.toFixed(2)}`}</span>
              </div>
              {totalPrice < 50 && (
                <p className="text-xs text-muted-foreground bg-muted rounded-lg p-2 text-center">
                  Add ${(50 - totalPrice).toFixed(2)} more for <strong className="text-emerald-600">free shipping</strong>!
                </p>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Total</span><span className="text-primary">${(totalPrice + shippingFee).toFixed(2)}</span>
              </div>
            </div>
            <Button
              className="w-full rounded-full gap-2"
              size="lg"
              onClick={() => navigate("/checkout")}
            >
              Checkout <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={clearCart}>
              Clear cart
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
