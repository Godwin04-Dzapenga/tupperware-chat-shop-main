import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface WishlistContextType {
  items: string[];   // product IDs
  toggle: (productId: string, productName?: string) => void;
  isWishlisted: (productId: string) => boolean;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    supabase
      .from("wishlist_items")
      .select("product_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setItems((data || []).map((d: any) => d.product_id));
        setLoading(false);
      });
  }, [user]);

  const toggle = useCallback(async (productId: string, productName?: string) => {
    if (!user) { toast.error("Sign in to save items to your wishlist"); return; }
    const isIn = items.includes(productId);
    // Optimistic update
    setItems((prev) => isIn ? prev.filter((id) => id !== productId) : [...prev, productId]);
    if (isIn) {
      const { error } = await supabase.from("wishlist_items").delete().eq("user_id", user.id).eq("product_id", productId);
      if (error) { setItems((prev) => [...prev, productId]); toast.error("Failed to remove from wishlist"); }
      else toast.success(`Removed from wishlist`);
    } else {
      const { error } = await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: productId });
      if (error) { setItems((prev) => prev.filter((id) => id !== productId)); toast.error("Failed to add to wishlist"); }
      else toast.success(`${productName ?? "Item"} saved to wishlist ♥`);
    }
  }, [user, items]);

  const isWishlisted = useCallback((productId: string) => items.includes(productId), [items]);

  return (
    <WishlistContext.Provider value={{ items, toggle, isWishlisted, loading }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};
