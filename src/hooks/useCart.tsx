import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { medusa, medusaConfigured, type MedusaCart } from "@/lib/medusa";
import { commerceProvider } from "@/lib/commerce";

export interface CartItem {
  /** Medusa line-item id when the cart is Medusa-backed. */
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

interface AddToCartProduct {
  id: string;
  product_id?: string;
  variant_id?: string | null;
  variant_name?: string | null;
  name: string;
  price?: number;
  image_url?: string | null;
  stock_quantity?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: AddToCartProduct) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  isInCart: (id: string) => boolean;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const LS_KEY = "techinnovation_medusa_cart_id";

const isMedusaCart = commerceProvider === "medusa" && medusaConfigured;

function getStoredCartId() {
  try {
    return localStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
}

function setStoredCartId(id: string | null) {
  try {
    if (id) localStorage.setItem(LS_KEY, id);
    else localStorage.removeItem(LS_KEY);
  } catch {
    // Ignore storage failures; Medusa remains the source of truth for this session.
  }
}

function mapMedusaCart(cart: MedusaCart): CartItem[] {
  return (cart.items || []).map((item) => {
    const variant = item.variant;
    const product = variant?.product || item.product;
    const productId = product?.id;
    const variantName = variant?.title;
    const imageUrl = product?.thumbnail || product?.images?.[0]?.url || null;

    return {
      id: item.id,
      ...(productId ? { product_id: productId } : {}),
      ...(variant?.id ? { variant_id: variant.id } : {}),
      ...(variantName ? { variant_name: variantName } : {}),
      name: product?.title
        ? variantName && variantName !== "Default variant"
          ? `${product.title} — ${variantName}`
          : product.title
        : variantName || "Product",
      price: Number(item.unit_price || 0) / 100,
      quantity: item.quantity,
      ...(imageUrl ? { image_url: imageUrl } : {}),
      ...(typeof variant?.inventory_quantity === "number"
        ? { stock_quantity: variant.inventory_quantity }
        : {}),
    };
  });
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(getStoredCartId);
  const [loading, setLoading] = useState(isMedusaCart);

  const loadCart = useCallback(async (id: string) => {
    const { cart } = await medusa.cart.retrieve(id, {
      fields: "*items,*items.variant,*items.variant.product,*items.product",
    });
    setCartId(cart.id);
    setStoredCartId(cart.id);
    setItems(mapMedusaCart(cart));
    return cart;
  }, []);

  useEffect(() => {
    if (!isMedusaCart) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      const storedId = getStoredCartId();
      if (!storedId) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        await loadCart(storedId);
      } catch {
        // A stale/expired Medusa cart should not block the storefront.
        setStoredCartId(null);
        setCartId(null);
        setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadCart]);

  const ensureCart = useCallback(async () => {
    if (cartId) {
      try {
        return await loadCart(cartId);
      } catch {
        setStoredCartId(null);
        setCartId(null);
        setItems([]);
      }
    }

    const regionId = import.meta.env.VITE_MEDUSA_REGION_ID;
    const salesChannelId = import.meta.env.VITE_MEDUSA_SALES_CHANNEL_ID;
    const currencyCode = import.meta.env.VITE_MEDUSA_CURRENCY_CODE || "usd";

    if (!regionId) {
      throw new Error("VITE_MEDUSA_REGION_ID is missing.");
    }

    const payload: Record<string, unknown> = {
      region_id: regionId,
      currency_code: currencyCode,
    };

    if (salesChannelId) payload.sales_channel_id = salesChannelId;

    const { cart } = await medusa.cart.create(payload);
    setCartId(cart.id);
    setStoredCartId(cart.id);
    setItems(mapMedusaCart(cart));
    return cart;
  }, [cartId, loadCart]);

  const addToCart = useCallback(async (product: AddToCartProduct) => {
    if (!isMedusaCart) {
      throw new Error("The cart is configured for Medusa, but Medusa is unavailable.");
    }

    setLoading(true);
    try {
      let variantId = product.variant_id || null;

      // Product cards only know the product id. Resolve their first active
      // variant before creating the Medusa line item.
      if (!variantId) {
        const regionId = import.meta.env.VITE_MEDUSA_REGION_ID || undefined;
        const { product: medusaProduct } = await medusa.product.retrieve(product.product_id || product.id, {
          ...(regionId ? { region_id: regionId } : {}),
          fields: "*variants,*variants.calculated_price,*images",
        });
        variantId = medusaProduct.variants?.[0]?.id || null;
      }

      if (!variantId) throw new Error("This product has no purchasable variant.");

      const cart = await ensureCart();
      const { cart: updated } = await medusa.cart.addLineItem(cart.id, {
        variant_id: variantId,
        quantity: Math.max(1, product.quantity ?? 1),
      });

      setItems(mapMedusaCart(updated));
      setCartId(updated.id);
      setStoredCartId(updated.id);
    } finally {
      setLoading(false);
    }
  }, [ensureCart]);

  const removeFromCart = useCallback(async (lineItemId: string) => {
    if (!isMedusaCart) return;

    setLoading(true);
    try {
      if (!cartId) return;
      const { parent } = await medusa.cart.deleteLineItem(cartId, lineItemId);
      setItems(mapMedusaCart(parent));
    } finally {
      setLoading(false);
    }
  }, [cartId]);

  const updateQuantity = useCallback(async (lineItemId: string, quantity: number) => {
    if (!isMedusaCart) return;

    if (quantity <= 0) {
      await removeFromCart(lineItemId);
      return;
    }

    setLoading(true);
    try {
      if (!cartId) return;
      const { cart } = await medusa.cart.updateLineItem(cartId, lineItemId, { quantity });
      setItems(mapMedusaCart(cart));
    } finally {
      setLoading(false);
    }
  }, [cartId, removeFromCart]);

  const clearCart = useCallback(async () => {
    if (!isMedusaCart) return;

    setLoading(true);
    try {
      if (!cartId) {
        setItems([]);
        return;
      }

      const current = await loadCart(cartId);
      for (const item of current.items || []) {
        await medusa.cart.deleteLineItem(cartId, item.id);
      }

      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [cartId, loadCart]);

  const isInCart = useCallback((id: string) => {
    return items.some((item) => item.id === id || item.product_id === id || item.variant_id === id);
  }, [items]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        isInCart,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
