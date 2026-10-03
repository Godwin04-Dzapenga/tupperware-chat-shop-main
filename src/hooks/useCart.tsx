import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { medusa, medusaConfigured, MEDUSA_REGION_ID, MEDUSA_SALES_CHANNEL_ID } from "@/lib/medusa";
import { toast } from "sonner";

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
  medusa_line_item_id?: string;
}

interface AddToCartProduct {
  id: string;
  product_id?: string;
  variant_id?: string | null;
  variant_name?: string | null;
  name: string;
  price: number;
  quantity?: number;
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
  refreshing: boolean;
  cartId: string | null;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const MEDUSA_CART_ID_KEY = "medusa_cart_id";

function readCartId() {
  try {
    return localStorage.getItem(MEDUSA_CART_ID_KEY);
  } catch {
    return null;
  }
}

function writeCartId(id: string | null) {
  try {
    if (id) localStorage.setItem(MEDUSA_CART_ID_KEY, id);
    else localStorage.removeItem(MEDUSA_CART_ID_KEY);
  } catch {
    // Ignore localStorage failures; Medusa remains the source of truth.
  }
}

function mapMedusaCartItems(cartItems: NonNullable<import("@/lib/medusa").MedusaCart["items"]>): CartItem[] {
  return cartItems.map((line) => {
    const variantId = line.variant_id ?? line.variant?.id ?? null;
    const productId = line.product_id ?? line.variant?.product_id ?? line.product?.id;
    const productTitle = line.product?.title ?? line.title ?? "Product";
    const variantTitle = line.variant_title ?? line.variant?.title ?? null;

    return {
      id: productId && variantId ? `${productId}::${variantId}` : line.id,
      product_id: productId,
      variant_id: variantId,
      variant_name: variantTitle,
      name: variantTitle && variantTitle !== "Default" ? `${productTitle} — ${variantTitle}` : productTitle,
      price: Number(line.unit_price ?? 0) / 100,
      quantity: Number(line.quantity ?? 0),
      image_url: line.thumbnail ?? line.product?.thumbnail ?? null,
      medusa_line_item_id: line.id,
    };
  });
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartId, setCartId] = useState<string | null>(cartIdRef.current);
  const [refreshing, setRefreshing] = useState(false);
  const cartIdRef = useRef<string | null>(readCartId());
  const cartPromiseRef = useRef<Promise<string> | null>(null);

  const ensureMedusaCart = useCallback(async (): Promise<string> => {
    if (!medusaConfigured) {
      throw new Error("Medusa is not configured. Set VITE_MEDUSA_BACKEND_URL and VITE_MEDUSA_PUBLISHABLE_KEY.");
    }

    if (!MEDUSA_REGION_ID) {
      throw new Error("VITE_MEDUSA_REGION_ID is required for checkout.");
    }

    if (cartIdRef.current) {
      try {
        await medusa.cart.retrieve(cartIdRef.current);
        return cartIdRef.current;
      } catch {
        cartIdRef.current = null;
        writeCartId(null);
      }
    }

    if (!cartPromiseRef.current) {
      cartPromiseRef.current = (async () => {
        const { cart } = await medusa.cart.create({
          region_id: MEDUSA_REGION_ID,
          ...(MEDUSA_SALES_CHANNEL_ID ? { sales_channel_id: MEDUSA_SALES_CHANNEL_ID } : {}),
        });
        cartIdRef.current = cart.id;
        setCartId(cart.id);
        writeCartId(cart.id);
        return cart.id;
      })().finally(() => {
        cartPromiseRef.current = null;
      });
    }

    return cartPromiseRef.current;
  }, []);

  const refreshCart = useCallback(async () => {
    if (!medusaConfigured) return;
    setRefreshing(true);
    try {
      const cartId = cartIdRef.current;
      if (!cartId) {
        setItems([]);
        return;
      }

      const { cart } = await medusa.cart.retrieve(cartId);
      setItems(mapMedusaCartItems(cart.items || []));
    } catch (error: any) {
      cartIdRef.current = null;
      writeCartId(null);
      setItems([]);
      console.warn("Medusa cart could not be retrieved:", error?.message || error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  const resolveVariantId = useCallback(async (product: AddToCartProduct) => {
    if (product.variant_id) return product.variant_id;

    const productId = product.product_id || product.id;
    const { product: remoteProduct } = await medusa.product.retrieve(productId, {
      ...(MEDUSA_REGION_ID ? { region_id: MEDUSA_REGION_ID } : {}),
      fields: "*variants,*variants.calculated_price,+variants.inventory_quantity,*images,*categories",
    });

    const availableVariant =
      remoteProduct.variants?.find(
        (variant) =>
          variant.manage_inventory === false ||
          variant.allow_backorder === true ||
          Number(variant.inventory_quantity ?? 0) > 0
      ) ?? remoteProduct.variants?.[0];

    if (!availableVariant) {
      throw new Error("This product has no purchasable variant.");
    }

    return availableVariant.id;
  }, []);

  const addToCart = useCallback(async (product: AddToCartProduct) => {
    try {
      const variantId = await resolveVariantId(product);
      const cartId = await ensureMedusaCart();
      const quantity = Math.max(1, Math.floor(product.quantity ?? 1));

      const { cart } = await medusa.cart.addLineItem(cartId, {
        variant_id: variantId,
        quantity,
      });

      setItems(mapMedusaCartItems(cart.items || []));
    } catch (error: any) {
      toast.error(error?.message || "Could not add this product to your cart.");
      throw error;
    }
  }, [ensureMedusaCart, resolveVariantId]);

  const removeFromCart = useCallback(async (id: string) => {
    const item = items.find((entry) => entry.id === id || entry.variant_id === id || entry.product_id === id);
    if (!item?.medusa_line_item_id || !cartIdRef.current) {
      setItems((prev) => prev.filter((entry) => entry.id !== id));
      return;
    }

    try {
      const { parent } = await medusa.cart.deleteLineItem(cartIdRef.current, item.medusa_line_item_id);
      setItems(mapMedusaCartItems(parent.items || []));
    } catch (error: any) {
      toast.error(error?.message || "Could not remove the item.");
      throw error;
    }
  }, [items]);

  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(id);
      return;
    }

    const item = items.find((entry) => entry.id === id || entry.variant_id === id || entry.product_id === id);
    if (!item?.medusa_line_item_id || !cartIdRef.current) return;

    try {
      const { cart } = await medusa.cart.updateLineItem(cartIdRef.current, item.medusa_line_item_id, {
        quantity: Math.floor(quantity),
      });
      setItems(mapMedusaCartItems(cart.items || []));
    } catch (error: any) {
      toast.error(error?.message || "Could not update the quantity.");
      throw error;
    }
  }, [items, removeFromCart]);

  const clearCart = useCallback(async () => {
    // Clear the client reference. The old Medusa cart can remain abandoned.
    cartIdRef.current = null;
    setCartId(null);
    writeCartId(null);
    setItems([]);
  }, []);

  const isInCart = useCallback(
    (id: string) =>
      items.some(
        (item) =>
          item.id === id ||
          item.variant_id === id ||
          item.product_id === id
      ),
    [items]
  );

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
        refreshing,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};
