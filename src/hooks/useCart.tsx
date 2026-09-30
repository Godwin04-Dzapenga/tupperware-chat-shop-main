import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Json } from "@/integrations/supabase/types";

export interface CartItem {
  id: string;
  product_id?: string;
  variant_id?: string | null;
  variant_name?: string | null;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
  stock_quantity?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: { id: string; product_id?: string; variant_id?: string | null; variant_name?: string | null; name: string; price: number; image_url?: string | null; stock_quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const LS_KEY = "tuppafrica_cart";

function readLocalCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
}

function writeLocalCart(items: CartItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(items));
}

function parseCartItem(value: Json): CartItem | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;

  const item = value as unknown as Record<string, unknown>;

  if (
    typeof item.id !== "string" ||
    typeof item.name !== "string" ||
    typeof item.price !== "number" ||
    typeof item.quantity !== "number"
  ) {
    return null;
  }

  return {
    id: item.id,
    ...(typeof item.product_id === "string" ? { product_id: item.product_id } : {}),
    ...(typeof item.variant_id === "string" ? { variant_id: item.variant_id } : {}),
    ...(typeof item.variant_name === "string" ? { variant_name: item.variant_name } : {}),
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    ...(typeof item.image_url === "string" ? { image_url: item.image_url } : {}),
    ...(typeof item.stock_quantity === "number" ? { stock_quantity: item.stock_quantity } : {}),
  };
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItemsRaw] = useState<CartItem[]>(readLocalCart);

  const setItems = useCallback((updater: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    setItemsRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writeLocalCart(next);
      return next;
    });
  }, []);

  const syncToCloud = useCallback(async (cartItems: CartItem[]) => {
    if (!user) return;
    await supabase.from("carts").upsert(
      { user_id: user.id, items: cartItems as unknown as Json, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  }, [user]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("carts").select("items").eq("user_id", user.id).maybeSingle();
      if (data?.items && Array.isArray(data.items)) {
        const cloudItems: CartItem[] = data.items
          .map(parseCartItem)
          .filter((item): item is CartItem => item !== null);
        setItems((local) => {
          const merged = [...cloudItems];
          for (const localItem of local) {
            const existing = merged.find((i) => i.id === localItem.id);
            if (existing) { existing.quantity = Math.max(existing.quantity, localItem.quantity); }
            else { merged.push(localItem); }
          }
          return merged;
        });
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => syncToCloud(items), 1000);
    return () => clearTimeout(t);
  }, [items, user, syncToCloud]);

  const addToCart = useCallback((product: { id: string; product_id?: string; variant_id?: string | null; variant_name?: string | null; name: string; price: number; image_url?: string | null; stock_quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      const maxQty = product.stock_quantity ?? 999;
      if (existing) {
        if (existing.quantity >= maxQty) return prev;
        return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, [setItems]);

  const removeFromCart = useCallback((id: string) => setItems((p) => p.filter((i) => i.id !== id)), [setItems]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) { removeFromCart(id); return; }
    setItems((p) => p.map((i) => i.id === id ? { ...i, quantity } : i));
  }, [setItems, removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    if (user) supabase.from("carts").update({ items: [] }).eq("user_id", user.id);
  }, [setItems, user]);

  const isInCart = useCallback((id: string) => items.some((i) => i.id === id), [items]);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isInCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
