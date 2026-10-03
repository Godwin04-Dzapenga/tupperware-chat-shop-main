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
  product_id?: string;
  variant_id?: string | null;
  default_variant_id?: string | null;
  variant_count?: number;
}

/** Shared storefront actions. Commerce mutations go through the Medusa-backed cart. */
export function useStoreActions() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const addProduct = async (product: StoreProduct | CartProduct) => {
    if ((product.variant_count ?? 0) > 1) {
      navigate(`/product/${product.id}`);
      return;
    }

    try {
      await addToCart({
        id: product.id,
        product_id: "product_id" in product && product.product_id ? product.product_id : product.id,
        variant_id:
          ("variant_id" in product ? product.variant_id : null) ||
          ("default_variant_id" in product ? product.default_variant_id : null) ||
          null,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        stock_quantity: product.stock_quantity,
      });
      toast.success(`${product.name} added to cart`);
    } catch {
      // addToCart already reports the backend error.
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
