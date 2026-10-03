import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import type { StoreProduct } from "@/hooks/useCatalog";

export const WHATSAPP_NUMBER = "263778158984";

interface CartProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  stock_quantity?: number;
}

/** Shared cart + WhatsApp order actions used across the storefront. */
export function useStoreActions() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const addProduct = async (product: StoreProduct | CartProduct & { variant_count?: number }) => {
    if (product.variant_count) {
      navigate(`/product/${product.id}`);
      return;
    }

    try {
      await addToCart(product as CartProduct);
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add this item to the cart.");
    }
  };

  const orderViaWhatsApp = (product: { name: string; price: number; variant_count?: number }) => {
    const text = encodeURIComponent(
      `Hello Tech Innovation, I am interested in ordering:\n\n*${product.name}*\nPrice: $${product.price.toFixed(
        2
      )}\n${product.variant_count ? "Please show me available capacity/wattage options.\n" : ""}Please confirm availability at the Harare Showroom and delivery options.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
  };

  return { addProduct, orderViaWhatsApp };
}
