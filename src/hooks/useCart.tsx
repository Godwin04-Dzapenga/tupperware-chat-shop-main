import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { isMedusaCommerce } from "@/lib/commerce";
import { medusa, MedusaCart } from "@/lib/medusa";
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
  addToCart: (product: Omit<CartItem, "quantity">) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isInCart: (id: string) => boolean;
  medusaCartId: string | null;
  syncWithBackend: () => Promise<MedusaCart | null>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const LS_KEY = "tuppafrica_cart";
const MEDUSA_CART_KEY = "medusa_cart_id";

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
  if (typeof item.id !== "string" || typeof item.name !== "string" ||
      typeof item.price !== "number" || typeof item.quantity !== "number") return null;
  return {
    id: item.id,
    ...(typeof item.product_id === "string" ? { product_id: item.product_id } : {}),
    ...(typeof item.variant_id === "string" ? { variant_id: item.variant_id } : {}),
    ...(typeof item.variant_name === "string" ? { variant_name: item.variant_name } : {}),
    name: item.name, price: item.price, quantity: item.quantity,
    ...(typeof item.image_url === "string" ? { image_url: item.image_url } : {}),
    ...(typeof item.stock_quantity === "number" ? { stock_quantity: item.stock_quantity } : {}),
  };
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItemsRaw] = useState<CartItem[]>(readLocalCart);
  const [medusaCartId, setMedusaCartId] = useState<string | null>(() => localStorage.getItem(MEDUSA_CART_KEY));
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncing = useRef(false);

  const setItems = useCallback((updater: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    setItemsRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writeLocalCart(next);
      return next;
    });
  }, []);

  const syncSupabase = useCallback(async (cartItems: CartItem[]) => {
    if (!user) return;
    await supabase.from("carts").upsert(
      { user_id: user.id, items: cartItems as unknown as Json, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  }, [user]);

  const syncWithBackend = useCallback(async (): Promise<MedusaCart | null> => {
    if (!isMedusaCommerce || items.length === 0) return null;
    if (syncing.current) return null;
    syncing.current = true;
    try {
      let cart: MedusaCart | null = null;
      const regionId = import.meta.env.VITE_MEDUSA_REGION_ID;
      const salesChannelId = import.meta.env.VITE_MEDUSA_SALES_CHANNEL_ID;
      let cartId = medusaCartId;

      if (cartId) {
        try {
          cart = (await medusa.cart.retrieve(cartId)).cart;
        } catch {
          cartId = null;
          setMedusaCartId(null);
          localStorage.removeItem(MEDUSA_CART_KEY);
        }
      }

      if (!cartId) {
        cart = (await medusa.cart.create({
          region_id: regionId,
          ...(salesChannelId ? { sales_channel_id: salesChannelId } : {}),
        })).cart;
        cartId = cart.id;
        setMedusaCartId(cartId);
        localStorage.setItem(MEDUSA_CART_KEY, cartId);
      }

      const remoteItems = cart?.items || [];
      const desired = items.filter((item) => item.variant_id);
      const desiredVariantIds = new Set(desired.map((item) => item.variant_id));

      for (const remote of remoteItems) {
        const variantId = remote.variant_id || remote.variant?.id;
        if (!variantId || !desiredVariantIds.has(variantId)) {
          await medusa.cart.deleteLineItem(cartId, remote.id);
        }
      }

      const refreshed = (await medusa.cart.retrieve(cartId)).cart;
      const remoteByVariant = new Map(
        (refreshed.items || []).map((item) => [item.variant_id || item.variant?.id || "", item]),
      );

      for (const desiredItem of desired) {
        const remote = remoteByVariant.get(desiredItem.variant_id!);
        if (remote) {
          if (remote.quantity !== desiredItem.quantity) {
            await medusa.cart.updateLineItem(cartId, remote.id, { quantity: desiredItem.quantity });
          }
        } else {
          await medusa.cart.addLineItem(cartId, {
            variant_id: desiredItem.variant_id!,
            quantity: desiredItem.quantity,
          });
        }
      }

      const finalCart = (await medusa.cart.retrieve(cartId)).cart;
      return finalCart;
    } finally {
      syncing.current = false;
    }
  }, [items, medusaCartId]);

  useEffect(() => {
    if (!isMedusaCommerce) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    if (!items.length) return;
    syncTimer.current = setTimeout(() => {
      void syncWithBackend().catch((error) => console.error("Medusa cart sync failed:", error));
    }, 350);
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [items, syncWithBackend]);

  useEffect(() => {
    if (isMedusaCommerce || !user) return;
    (async () => {
      const { data } = await supabase.from("carts").select("items").eq("user_id", user.id).maybeSingle();
      if (data?.items && Array.isArray(data.items)) {
        const cloudItems = data.items.map(parseCartItem).filter((x): x is CartItem => x !== null);
        setItems((local) => {
          const merged = [...cloudItems];
          for (const localItem of local) {
            const existing = merged.find((i) => i.id === localItem.id);
            if (existing) existing.quantity = Math.max(existing.quantity, localItem.quantity);
            else merged.push(localItem);
          }
          return merged;
        });
      }
    })();
  }, [user, setItems]);

  useEffect(() => {
    if (isMedusaCommerce || !user) return;
    const t = setTimeout(() => void syncSupabase(items), 1000);
    return () => clearTimeout(t);
  }, [items, user, syncSupabase]);

  const addToCart = useCallback((product: Omit<CartItem, "quantity">) => {
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
    setItems((p) => p.map((i) => i.id === id ? { ...i, quantity: Math.min(quantity, i.stock_quantity ?? 999) } : i));
  }, [setItems, removeFromCart]);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(MEDUSA_CART_KEY);
    setMedusaCartId(null);
    if (user && !isMedusaCommerce) void supabase.from("carts").update({ items: [] }).eq("user_id", user.id);
  }, [setItems, user]);

  const isInCart = useCallback((id: string) => items.some((i) => i.id === id), [items]);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isInCart, medusaCartId, syncWithBackend }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
