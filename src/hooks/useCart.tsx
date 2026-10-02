import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Json } from "@/integrations/supabase/types";
import { commerceProvider } from "@/lib/commerce";
import { medusa, medusaConfigured, type MedusaCart } from "@/lib/medusa";

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
  /** Medusa line-item id. Kept separate from the stable product/variant cart key. */
  line_item_id?: string;
}

type CartProduct = {
  id: string;
  product_id?: string;
  variant_id?: string | null;
  variant_name?: string | null;
  name: string;
  price: number;
  image_url?: string | null;
  stock_quantity?: number;
};

interface CartContextType {
  items: CartItem[];
  addToCart: (product: CartProduct) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const LS_KEY = "tuppafrica_cart";
const MEDUSA_CART_KEY = "techinnovation_medusa_cart_id";

function readLocalCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
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
    ...(typeof item.line_item_id === "string" ? { line_item_id: item.line_item_id } : {}),
  };
}

function cartItemKey(productId: string, variantId?: string | null) {
  return variantId ? `${productId}::${variantId}` : productId;
}

function majorAmount(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return value / 100;
}

function mapMedusaCart(cart: MedusaCart): CartItem[] {
  return (cart.items || []).map((item) => {
    const productId = item.product?.id;
    const variantId = item.variant?.id;
    const productName = item.product?.title || item.variant?.title || "Product";

    return {
      id: productId ? cartItemKey(productId, variantId) : item.id,
      product_id: productId,
      variant_id: variantId,
      variant_name: item.variant?.title || null,
      name: productName,
      price: majorAmount(item.unit_price),
      quantity: item.quantity,
      image_url: item.product?.thumbnail || item.product?.images?.[0]?.url || null,
      stock_quantity: item.variant?.inventory_quantity,
      line_item_id: item.id,
    };
  });
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const useMedusaCart = commerceProvider === "medusa" && medusaConfigured;
  const [items, setItemsRaw] = useState<CartItem[]>(readLocalCart);
  const [medusaCartId, setMedusaCartId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(MEDUSA_CART_KEY);
    } catch {
      return null;
    }
  });

  const setItems = useCallback((updater: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    setItemsRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      writeLocalCart(next);
      return next;
    });
  }, []);

  const saveMedusaCartId = useCallback((id: string | null) => {
    setMedusaCartId(id);
    try {
      if (id) localStorage.setItem(MEDUSA_CART_KEY, id);
      else localStorage.removeItem(MEDUSA_CART_KEY);
    } catch {
      // localStorage can be unavailable in privacy-restricted browsers.
    }
  }, []);

  const refreshMedusaCart = useCallback(async (id: string) => {
    const { cart } = await medusa.cart.retrieve(id);
    setItems(mapMedusaCart(cart));
    return cart;
  }, [setItems]);

  const createMedusaCart = useCallback(async () => {
    const regionId = import.meta.env.VITE_MEDUSA_REGION_ID;
    if (!regionId) {
      throw new Error("VITE_MEDUSA_REGION_ID is required for the Medusa cart.");
    }

    const { cart } = await medusa.cart.create({ region_id: regionId });
    saveMedusaCartId(cart.id);
    setItems(mapMedusaCart(cart));
    return cart;
  }, [saveMedusaCartId, setItems]);

  const ensureMedusaCart = useCallback(async () => {
    if (medusaCartId) {
      try {
        return await medusa.cart.retrieve(medusaCartId).then((result) => result.cart);
      } catch {
        saveMedusaCartId(null);
      }
    }
    return createMedusaCart();
  }, [medusaCartId, createMedusaCart, saveMedusaCartId]);

  // Medusa becomes the authoritative cart when the Medusa commerce provider is configured.
  // The local cart is retained only as a migration/optimistic cache so the existing UI stays fast.
  useEffect(() => {
    if (!useMedusaCart) return;

    let cancelled = false;
    (async () => {
      try {
        if (medusaCartId) {
          const { cart } = await medusa.cart.retrieve(medusaCartId);
          if (!cancelled) setItems(mapMedusaCart(cart));
          return;
        }

        // Create the Medusa cart on first storefront access, as recommended by Medusa.
        const cart = await createMedusaCart();

        // Migrate any pre-existing local cart items into the new authoritative Medusa cart.
        const localItems = readLocalCart();
        for (const item of localItems) {
          if (!item.variant_id) continue;
          await medusa.cart.addLineItem(cart.id, {
            variant_id: item.variant_id,
            quantity: item.quantity,
          });
        }

        if (!cancelled) await refreshMedusaCart(cart.id);
      } catch (error) {
        console.error("Unable to initialize Medusa cart; retaining local cart.", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [useMedusaCart, medusaCartId, createMedusaCart, refreshMedusaCart]);

  const syncToCloud = useCallback(async (cartItems: CartItem[]) => {
    if (!user || useMedusaCart) return;
    await supabase.from("carts").upsert(
      { user_id: user.id, items: cartItems as unknown as Json, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  }, [user, useMedusaCart]);

  useEffect(() => {
    if (!user || useMedusaCart) return;
    (async () => {
      const { data } = await supabase
        .from("carts")
        .select("items")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.items && Array.isArray(data.items)) {
        const cloudItems: CartItem[] = data.items
          .map(parseCartItem)
          .filter((item): item is CartItem => item !== null);

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
  }, [user, useMedusaCart, setItems]);

  useEffect(() => {
    if (!user || useMedusaCart) return;
    const t = setTimeout(() => syncToCloud(items), 1000);
    return () => clearTimeout(t);
  }, [items, user, useMedusaCart, syncToCloud]);

  const addToCart = useCallback((product: CartProduct) => {
    // Keep the existing UI responsive while Medusa is updated in the background.
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      const maxQty = product.stock_quantity ?? 999;

      if (existing) {
        if (existing.quantity >= maxQty) return prev;
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }

      return [...prev, { ...product, quantity: 1 }];
    });

    if (!useMedusaCart) return;

    void (async () => {
      try {
        const cart = await ensureMedusaCart();
        let variantId = product.variant_id || undefined;

        // Product cards may not carry the variant id. Resolve the first active Medusa
        // variant instead of silently writing a non-authoritative local-only cart.
        if (!variantId && product.product_id) {
          const result = await medusa.product.retrieve(product.product_id, {
            fields: "*variants,*variants.calculated_price",
          });
          variantId = result.product.variants?.[0]?.id;
        }

        if (!variantId) throw new Error("This Medusa product has no purchasable variant.");

        await medusa.cart.addLineItem(cart.id, {
          variant_id: variantId,
          quantity: 1,
        });
        await refreshMedusaCart(cart.id);
      } catch (error) {
        console.error("Medusa add-to-cart failed; local cart retained.", error);
      }
    })();
  }, [ensureMedusaCart, refreshMedusaCart, setItems, useMedusaCart]);

  const removeFromCart = useCallback((id: string) => {
    const item = items.find((cartItem) => cartItem.id === id);
    setItems((p) => p.filter((i) => i.id !== id));

    if (useMedusaCart && medusaCartId && item?.line_item_id) {
      void medusa.cart.deleteLineItem(medusaCartId, item.line_item_id)
        .then(() => refreshMedusaCart(medusaCartId))
        .catch((error) => console.error("Medusa remove-from-cart failed.", error));
    }
  }, [items, medusaCartId, refreshMedusaCart, setItems, useMedusaCart]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    const item = items.find((cartItem) => cartItem.id === id);
    const maxQty = item?.stock_quantity ?? 999;
    const nextQuantity = Math.min(quantity, maxQty);

    setItems((p) => p.map((i) => (i.id === id ? { ...i, quantity: nextQuantity } : i)));

    if (useMedusaCart && medusaCartId && item?.line_item_id) {
      void medusa.cart.updateLineItem(medusaCartId, item.line_item_id, { quantity: nextQuantity })
        .then(() => refreshMedusaCart(medusaCartId))
        .catch((error) => console.error("Medusa quantity update failed.", error));
    }
  }, [items, medusaCartId, refreshMedusaCart, removeFromCart, setItems, useMedusaCart]);

  const clearCart = useCallback(() => {
    setItems([]);

    if (useMedusaCart) {
      // Completed carts must not be reused. Drop the local cart id so the next add
      // creates a fresh Medusa cart.
      saveMedusaCartId(null);
    } else if (user) {
      void supabase.from("carts").update({ items: [] }).eq("user_id", user.id);
    }
  }, [saveMedusaCartId, setItems, useMedusaCart, user]);

  const isInCart = useCallback((id: string) => items.some((i) => i.id === id), [items]);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
