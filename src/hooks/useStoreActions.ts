import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { medusa } from "@/lib/medusa";
import type { StoreProduct } from "@/hooks/useCatalog";

export const WHATSAPP_NUMBER = "263778158984";

interface CartProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  stock_quantity?: number;
  default_variant_id?: string | null;
  product_id?: string;
  variant_id?: string | null;
}

/** Shared cart + WhatsApp order actions used across the storefront. */
export function useStoreActions() {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const addProduct = async (product: StoreProduct | (CartProduct & { variant_count?: number })) => {
    if ((product.variant_count ?? 0) > 1) {
      navigate(`/product/${product.id}`);
      return;
    }

    try {
      let variantId =
        ("variant_id" in product ? product.variant_id : null) ||
        ("default_variant_id" in product ? product.default_variant_id : null) ||
        null;

      if (!variantId) {
        const { product: remoteProduct } = await medusa.product.retrieve(product.id, {
          ...(import.meta.env.VITE_MEDUSA_REGION_ID
            ? { region_id: import.meta.env.VITE_MEDUSA_REGION_ID }
            : {}),
          fields:
            "*variants,*variants.calculated_price,+variants.inventory_quantity,*images,*categories",
        });

        variantId =
          remoteProduct.variants?.find(
            (variant) =>
              variant.manage_inventory === false ||
              variant.allow_backorder === true ||
              Number(variant.inventory_quantity ?? 0) > 0
          )?.id ?? remoteProduct.variants?.[0]?.id ?? null;
      }

      if (!variantId) {
        throw new Error("This product has no purchasable variant configured.");
      }

      await addToCart({
        ...product,
        product_id: ("product_id" in product ? product.product_id : undefined) || product.id,
        variant_id: variantId,
      } as CartProduct);
      toast.success(`${product.name} added to cart`);
    } catch (error: any) {
      toast.error(error?.message || "Could not add this product to the cart.");
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
