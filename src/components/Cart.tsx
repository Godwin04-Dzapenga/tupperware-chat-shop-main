import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, ShieldCheck, MapPin } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Badge } from "@/components/ui/badge";
import { resolveProductImage } from "@/data/solarProducts";

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
        <button
          className="relative flex items-center gap-2 h-10 px-3 rounded-md bg-bb-blue-darker hover:bg-bb-blue-night text-white transition-colors"
          title="Shopping Cart"
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5 text-white" />
            {totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 h-4 min-w-4 flex items-center justify-center p-0.5 bg-bb-yellow text-black font-black text-[10px] rounded-full border-0">
                {totalItems}
              </Badge>
            )}
          </div>
          <div className="hidden xl:flex flex-col text-left leading-none text-xs">
            <span className="text-[10px] text-white/70">Cart</span>
            <span className="font-extrabold text-bb-yellow">${totalPrice.toFixed(2)}</span>
          </div>
        </button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md flex flex-col p-6">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-lg font-black text-slate-900 flex items-center justify-between">
            <span>Your Cart ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
            {totalItems > 0 && (
              <span className="text-xs font-bold text-bb-blue">${totalPrice.toFixed(2)} USD</span>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                <ShoppingCart className="h-8 w-8 text-slate-400" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Your cart is empty</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Explore solar panels, hybrid inverters, batteries, and backup power equipment.
              </p>
              <Button
                variant="outline"
                className="mt-2 text-xs font-bold border-slate-300"
                onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
              >
                Browse Solar Catalogue
              </Button>
            </div>
          ) : (
            items.map((item) => {
              const img = resolveProductImage(item);

              return (
                <div key={item.id} className="flex gap-3 p-3 border border-slate-200 rounded-xl bg-white shadow-xs">
                  <img
                    src={img}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-lg shrink-0 bg-slate-50 border"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">{item.name}</h4>
                    {item.variant_name && (
                      <p className="text-[10px] font-semibold text-bb-blue">{item.variant_name}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-0.5">${item.price.toFixed(2)} each</p>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-slate-300 rounded-md bg-slate-50">
                        <button
                          className="h-6 w-6 flex items-center justify-center text-slate-600 hover:text-black font-bold"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                        <button
                          className="h-6 w-6 flex items-center justify-center text-slate-600 hover:text-black font-bold"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        className="h-6 w-6 ml-auto flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors"
                        onClick={() => removeFromCart(item.id)}
                        title="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer and checkout button */}
        {items.length > 0 && (
          <div className="border-t pt-4 space-y-3 mt-4">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Delivery</span>
                <span>
                  {shippingFee === 0 ? (
                    <span className="text-emerald-700 font-bold">FREE (Over $50)</span>
                  ) : (
                    `$${shippingFee.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between font-black text-base text-slate-900 border-t pt-2">
                <span>Total</span>
                <span className="text-bb-blue">${(totalPrice + shippingFee).toFixed(2)} USD</span>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
              <p className="text-[11px] font-black text-bb-ink">What happens at checkout?</p>
              <p className="mt-1 text-[11px] leading-4 text-slate-600">
                Review your items → enter delivery details → choose payment → confirm your order.
              </p>
            </div>

            <Button
              className="w-full bg-bb-yellow hover:bg-bb-yellow-dark text-black font-extrabold text-sm h-12 rounded-lg shadow-sm"
              onClick={() => navigate("/checkout")}
            >
              Continue to Checkout <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Official Warranty
              </span>
              <button onClick={clearCart} className="hover:text-red-600 underline">
                Clear cart
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
