import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ShoppingCart,
  MessageCircle,
  Heart,
  Star,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Share2,
  Minus,
  Plus,
  ChevronRight,
  MapPin,
  Package,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { useStoreUI } from "@/hooks/useStoreUI";
import { useStoreActions, WHATSAPP_NUMBER } from "@/hooks/useStoreActions";
import { ProductReviews } from "@/components/ProductReviews";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getProductMedia } from "@/data/solarProducts";
import { inferBrand, inferDepartment, isSolarProduct } from "@/hooks/useCatalog";
import { commerceProvider, isMedusaCommerce } from "@/lib/commerce";
import { medusa } from "@/lib/medusa";

interface Variant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number;
  stock_quantity: number;
  manage_inventory?: boolean;
  allow_backorder?: boolean;
  image_url: string | null;
  attributes: Record<string, string>;
  is_active: boolean;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price?: number;
  category_id: string | null;
  image_url: string | null;
  video_url: string | null;
  stock_quantity: number;
  brand: string | null;
  model_number: string | null;
  product_type: string;
  power_watts: number | null;
  voltage: string | null;
  capacity: string | null;
  warranty_months: number | null;
  installation_required: boolean;
  specifications: Record<string, string>;
  categories?: { name: string };
}

type TabId = "overview" | "specs" | "box" | "reviews";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();
  const { setStoreModalOpen } = useStoreUI();
  const { addProduct, orderViaWhatsApp } = useStoreActions();

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    if (id) load(id);
  }, [id]);

  const load = async (productId: string) => {
    setLoading(true);
    try {
      if (commerceProvider === "medusa") {
        const regionId = import.meta.env.VITE_MEDUSA_REGION_ID || undefined;
        const { product: data } = await medusa.product.retrieve(productId, {
          ...(regionId ? { region_id: regionId } : {}),
          fields: "*variants,*variants.calculated_price,+variants.inventory_quantity,*images,*categories",
        });

        const metadata = data.metadata || {};
        const metadataProductType = typeof metadata.product_type === "string" ? metadata.product_type : "";
        if (isSolarProduct(data.title, metadataProductType)) {
          toast.error("This product is not currently available in the electronics catalogue.");
          navigate("/search");
          setLoading(false);
          return;
        }
        const department = inferDepartment(data.title, metadataProductType);
        const loaded: Variant[] = (data.variants || []).map((variant) => ({
          id: variant.id,
          product_id: data.id,
          name: variant.title,
          sku: variant.sku ?? null,
          price:
            variant.calculated_price?.calculated_amount != null
              ? variant.calculated_price.calculated_amount / 100
              : (variant.prices?.[0]?.amount ?? 0) / 100,
          stock_quantity: variant.manage_inventory === false ? 999999 : Number(variant.inventory_quantity ?? 0),
          manage_inventory: variant.manage_inventory,
          allow_backorder: variant.allow_backorder,
          image_url: null,
          attributes:
            variant.metadata?.attributes && typeof variant.metadata.attributes === "object" && !Array.isArray(variant.metadata.attributes)
              ? Object.fromEntries(Object.entries(variant.metadata.attributes).map(([key, value]) => [key, String(value)]))
              : {},
          is_active: true,
          sort_order: 0,
        }));

        const firstImage = data.thumbnail || data.images?.[0]?.url || getProductMedia({ name: data.title, product_type: metadataProductType }).imageUrl;
        const mapped: Product = {
          id: data.id,
          name: data.title,
          description: data.description ?? null,
          price: loaded.length ? Math.min(...loaded.map((v) => v.price)) : 0,
          original_price:
            typeof metadata.original_price === "number"
              ? metadata.original_price
              : typeof metadata.original_price === "string"
                ? Number(metadata.original_price)
                : undefined,
          category_id: `department:${department.slug}`,
          image_url: firstImage || null,
          video_url: typeof metadata.video_url === "string" ? metadata.video_url : null,
          stock_quantity: loaded.reduce((sum, v) => sum + Math.max(0, v.stock_quantity), 0),
          brand: inferBrand(data.title, typeof metadata.brand === "string" ? metadata.brand : ""),
          model_number: typeof metadata.model_number === "string" ? metadata.model_number : null,
          product_type: metadataProductType || department.name,
          power_watts: typeof metadata.power_watts === "number" ? metadata.power_watts : null,
          voltage: typeof metadata.voltage === "string" ? metadata.voltage : null,
          capacity: typeof metadata.capacity === "string" ? metadata.capacity : null,
          warranty_months: typeof metadata.warranty_months === "number" ? metadata.warranty_months : null,
          installation_required: metadata.installation_required === true || metadata.installation_required === "true",
          specifications:
            metadata.specifications && typeof metadata.specifications === "object" && !Array.isArray(metadata.specifications)
              ? Object.fromEntries(Object.entries(metadata.specifications).map(([key, value]) => [key, String(value)]))
              : {},
          categories: { name: department.name },
        };

        setProduct(mapped);
        setAvgRating(typeof metadata.avg_rating === "number" ? metadata.avg_rating : Number(metadata.avg_rating) || 0);
        setReviewCount(typeof metadata.review_count === "number" ? metadata.review_count : Number(metadata.review_count) || 0);
        setVariants(loaded);
        setSelectedVariantId(loaded[0]?.id || null);
        setActiveImage(firstImage);

        const relatedResult = await medusa.product.list({
          limit: 100,
          offset: 0,
          ...(regionId ? { region_id: regionId } : {}),
          fields: "*variants,*variants.calculated_price,+variants.inventory_quantity,*images,*categories",
        });

        const relatedProducts: Product[] = (relatedResult.products || [])
          .filter((item) => {
            const itemType = typeof item.metadata?.product_type === "string" ? item.metadata.product_type : "";
            return item.id !== data.id &&
              !isSolarProduct(item.title, itemType) &&
              inferDepartment(item.title, itemType).slug === department.slug;
          })
          .slice(0, 4)
          .map((item) => {
            const itemVariants = item.variants || [];
            const itemType = typeof item.metadata?.product_type === "string" ? item.metadata.product_type : "";
            const itemDepartment = inferDepartment(item.title, itemType);
            return {
              id: item.id,
              name: item.title,
              description: item.description ?? null,
              price: itemVariants.length
                ? Math.min(...itemVariants.map((v) =>
                    v.calculated_price?.calculated_amount != null
                      ? v.calculated_price.calculated_amount / 100
                      : (v.prices?.[0]?.amount ?? 0) / 100
                  ))
                : 0,
              original_price: typeof item.metadata?.original_price === "number" ? item.metadata.original_price : undefined,
              category_id: `department:${itemDepartment.slug}`,
              image_url: item.thumbnail || item.images?.[0]?.url || null,
              video_url: typeof item.metadata?.video_url === "string" ? item.metadata.video_url : null,
              stock_quantity: itemVariants.reduce((sum, v) => sum + Math.max(0, Number(v.inventory_quantity ?? 0)), 0),
              brand: inferBrand(item.title, typeof item.metadata?.brand === "string" ? item.metadata.brand : ""),
              model_number: typeof item.metadata?.model_number === "string" ? item.metadata.model_number : null,
              product_type: itemType || itemDepartment.name,
              power_watts: typeof item.metadata?.power_watts === "number" ? item.metadata.power_watts : null,
              voltage: typeof item.metadata?.voltage === "string" ? item.metadata.voltage : null,
              capacity: typeof item.metadata?.capacity === "string" ? item.metadata.capacity : null,
              warranty_months: typeof item.metadata?.warranty_months === "number" ? item.metadata.warranty_months : null,
              installation_required: item.metadata?.installation_required === true,
              specifications: {},
              categories: { name: itemDepartment.name },
            };
          });
        setRelated(relatedProducts);
        setLoading(false);
        return;
      }

      const [productRes, variantRes] = await Promise.all([
        supabase.from("products").select("*, categories(name)").eq("id", productId).single(),
        supabase
          .from("product_variants")
          .select("*")
          .eq("product_id", productId)
          .eq("is_active", true)
          .order("sort_order")
          .order("name"),
      ]);

      if (productRes.error || !productRes.data) {
        toast.error("Product not found");
        navigate("/");
        return;
      }

      const data = productRes.data as Product;
      const loaded = ((variantRes.data || []) as Variant[]).map((v) => ({
        ...v,
        attributes: (v.attributes || {}) as Record<string, string>,
      }));
      const media = getProductMedia(data);

      setProduct({
        ...data,
        brand: data.brand || media.brand.split("/")[0],
        model_number: data.model_number || media.modelNumber,
        image_url: media.imageUrl,
        specifications: (data.specifications || {}) as Record<string, string>,
      });
      setVariants(loaded);
      setSelectedVariantId(loaded[0]?.id || null);
      setActiveImage(media.imageUrl);

      const { data: reviews } = await supabase.from("reviews").select("rating").eq("product_id", productId);
      const ratings = (reviews || []).map((r) => r.rating);
      if (ratings.length > 0) {
        setReviewCount(ratings.length);
        setAvgRating(ratings.reduce((a, b) => a + b, 0) / ratings.length);
      }

      if (data.category_id) {
        const { data: rel } = await supabase
          .from("products")
          .select("*")
          .eq("category_id", data.category_id)
          .eq("is_active", true)
          .neq("id", productId)
          .limit(4);
        setRelated((rel || []) as Product[]);
      }

      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error("Product could not be loaded");
      navigate("/");
    }
  };

  useEffect(() => {
    if (!product) return;
    document.title = `${product.name} | Tech Innovation`;
    return () => {
      document.title = "Tech Innovation | Electronics & Smart Devices";
    };
  }, [product]);

  const selected = variants.find((v) => v.id === selectedVariantId) || null;
  const price = selected?.price ?? product?.price ?? 0;
  const stock = selected?.stock_quantity ?? product?.stock_quantity ?? 999;
  const cartId = selected && product ? product.id + "::" + selected.id : product?.id || "";
  const selectedCanPurchase =
    selected?.manage_inventory === false || selected?.allow_backorder === true;
  const outOfStock = !selectedCanPurchase && stock <= 0;
  const lowStock = stock > 0 && stock <= 5;
  const inCart = isInCart(cartId);
  const wishlisted = product ? isWishlisted(product.id) : false;

  const media = product ? getProductMedia(product) : null;
  const originalPrice = product?.original_price ?? price;
  const savings = Math.max(0, originalPrice - price);

  const specs = useMemo(() => {
    if (!product) return [];
    const base = [
      product.brand && ["Brand", product.brand],
      product.model_number && ["Model Number", product.model_number],
      product.product_type && ["Equipment Category", product.product_type.replace(/_/g, " ")],
      product.power_watts && ["Rated Power", `${product.power_watts} W`],
      product.voltage && ["System Voltage", product.voltage],
      product.capacity && ["Capacity / Storage", product.capacity],
      product.warranty_months
        ? ["Warranty", `${product.warranty_months} Months`]
        : ["Warranty", media?.warranty || "See product listing"],
      product.installation_required && ["Professional Installation", "Certified Engineers Available"],
    ].filter((x): x is string[] => Boolean(x));

    const attrs = selected ? Object.entries(selected.attributes || {}).map(([k, v]) => [k, String(v)]) : [];
    return [...base, ...attrs, ...Object.entries(product.specifications || {}).map(([k, v]) => [k, String(v)])];
  }, [product, selected, media]);

  const add = () => {
    if (!product || outOfStock || (isMedusaCommerce && !selected)) return;
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: cartId,
        product_id: product.id,
        variant_id: selected?.id || null,
        variant_name: selected?.name || null,
        name: selected ? `${product.name} — ${selected.name}` : product.name,
        price,
        image_url: selected?.image_url || activeImage || product.image_url,
        stock_quantity: stock,
      });
    }
    toast.success(`${quantity} × ${selected?.name || product.name} added to cart`);
  };

  const whatsapp = () => {
    if (!product) return;
    const message =
      `Hello Tech Innovation, I would like to order:\n\n*${product.name}*` +
      (selected ? `\nVariant: ${selected.name}\nSKU: ${selected.sku || "N/A"}` : "") +
      `\nQuantity: ${quantity}\nPrice: $${(price * quantity).toFixed(2)}` +
      `\n\nPlease confirm availability for collection at Harare Showroom or delivery address.`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const share = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-bb-blue" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="store-shell py-6 pb-24 md:pb-6">
      {/* Breadcrumb line */}
      <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-bb-blue">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="font-semibold text-slate-800">{product.categories?.name || "Electronics"}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-slate-400">{product.name}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* ── Left Column: Image Gallery & Badges ── */}
        <div>
          <div className="relative aspect-[4/3] sm:aspect-[5/4] lg:aspect-[5/4] overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-center sm:p-5">
            {savings > 0 && (
              <span className="absolute left-4 top-4 z-10 rounded bg-bb-red px-3 py-1 text-xs font-black text-white shadow-sm uppercase tracking-wider">
                Save ${savings}
              </span>
            )}
            {outOfStock && (
              <span className="absolute right-4 top-4 z-10 rounded bg-bb-ink px-3 py-1 text-xs font-black text-white">
                OUT OF STOCK
              </span>
            )}
            {lowStock && !outOfStock && (
              <span className="absolute right-4 top-4 z-10 rounded bg-bb-yellow px-3 py-1 text-xs font-black text-black">
                ONLY {stock} LEFT
              </span>
            )}

            <img
              src={activeImage}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* Thumbnail Row */}
          {media && media.galleryImages && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {media.galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all p-1 bg-white ${
                    activeImage === img ? "border-bb-blue ring-2 ring-bb-blue/20" : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  <img src={img} alt="Gallery item" className="h-full w-full object-cover rounded-lg" />
                </button>
              ))}
            </div>
          )}

          {/* Value Guarantees Below Gallery */}
          <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
            {[
              { icon: ShieldCheck, title: "Official Warranty", desc: media?.warranty || "12–60 Months" },
              { icon: Truck, title: "Nationwide Freight", desc: "Harare & All Provinces" },
              { icon: Wrench, title: "Tech Support", desc: "Expert Sizing & Setup" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-xs sm:p-3">
                <Icon className="h-4 w-4 text-bb-blue mx-auto mb-1 sm:h-5 sm:w-5" />
                <p className="text-[10px] font-black text-slate-900 sm:text-xs">{title}</p>
                <p className="mt-0.5 text-[9px] text-slate-500 sm:text-[10px]">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Column: Pricing, Specs & Buy Box ── */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
          <div>
            {/* Brand and Model Header */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-bb-blue">
                {product.brand || media?.brand}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={share}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-bb-ink"
                  title="Share product link"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleWishlist(product.id, product.name)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    wishlisted
                      ? "text-red-500 hover:bg-red-50"
                      : "text-slate-400 hover:bg-slate-100 hover:text-bb-ink"
                  }`}
                  title={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
                >
                  <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500" : ""}`} />
                </button>
              </div>
            </div>

            <h1 className="mt-2 text-xl font-black text-bb-ink leading-tight sm:text-2xl lg:text-3xl">
              {product.name}
            </h1>
            <p className="mt-1 text-xs text-slate-400 font-mono">Model: {product.model_number || media?.modelNumber}</p>

            {/* Star Rating */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${
                      s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700">{avgRating.toFixed(1)}</span>
              <button
                onClick={() => setTab("reviews")}
                className="text-xs text-slate-500 hover:text-bb-blue underline"
              >
                ({reviewCount} customer reviews)
              </button>
            </div>

            {/* ── Pricing Box ── */}
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black tracking-tight text-bb-ink sm:text-3xl">
                  ${price.toFixed(2)} USD
                </span>
                {savings > 0 && (
                  <span className="text-base text-slate-400 line-through">
                    ${originalPrice.toFixed(2)}
                  </span>
                )}
                {savings > 0 && (
                  <Badge className="bg-bb-red text-white hover:bg-bb-red font-black text-xs border-0">
                    Save ${savings}
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                <span>USD price</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>Warranty shown below</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>Delivery calculated at checkout</span>
              </div>
            </div>

            {/* Variant Selector Pills */}
            {variants.length > 0 && (
              <div className="mt-6">
                <div className="mb-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-black text-sm text-slate-900">Choose your option</span>
                    <span className="text-[11px] text-slate-500">{variants.length} available</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-4 text-slate-500">Choose the option that matches the model or configuration you need. The price updates with your selection.</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {variants.map((v) => {
                    const active = v.id === selectedVariantId;
                    const unavailable = v.stock_quantity <= 0;
                    return (
                      <button
                        key={v.id}
                        disabled={unavailable}
                        onClick={() => {
                          setSelectedVariantId(v.id);
                          setQuantity(1);
                          if (v.image_url) setActiveImage(v.image_url);
                        }}
                        className={`rounded-xl border-2 p-3 text-left transition-all ${
                          active
                            ? "border-bb-blue bg-blue-50/50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        } ${unavailable ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <span className="block text-xs font-black text-slate-900">{v.name}</span>
                        <span className="mt-1 block text-sm font-bold text-bb-blue">${v.price.toFixed(2)}</span>
                        <span className={`mt-1 block text-[10px] font-semibold ${unavailable ? "text-red-500" : "text-emerald-700"}`}>
                          {unavailable ? "Unavailable" : "Available to order"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Key Specs Checklist */}
            {media && media.keySpecs && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                  Key Specifications at a Glance
                </h4>
                <div className="space-y-1.5 text-xs text-slate-700">
                  {media.keySpecs.map((spec, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fulfillment Options */}
            <div className="mt-6 space-y-2 rounded-xl border border-slate-200 p-4 text-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-bb-blue mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900">Harare Showroom Pickup</p>
                    <p className="text-slate-500 text-[11px]">Ready in 2 hours for collection & inspection</p>
                  </div>
                </div>
                <button
                  onClick={() => setStoreModalOpen(true)}
                  className="text-bb-blue font-bold underline shrink-0 hover:text-bb-blue-darker"
                >
                  Store details
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-start gap-2.5">
                <Truck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">Doorstep Delivery Across Zimbabwe</p>
                  <p className="text-slate-500 text-[11px]">Same-day in Harare • 24–48 hrs nationwide freight</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Yellow Purchase Actions ── */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            {!outOfStock ? (
              <>
                <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
                  <span className="font-bold">Ready to buy?</span> Choose your quantity, add it to the cart, then continue to checkout for delivery and payment.
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-xs font-bold text-slate-700">Quantity:</span>
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white">
                    <button
                      className="px-3 py-2 text-slate-600 hover:text-black font-bold"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-black text-slate-900">{quantity}</span>
                    <button
                      className="px-3 py-2 text-slate-600 hover:text-black font-bold"
                      onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-sm font-black text-bb-ink">
                    Subtotal: ${(price * quantity).toFixed(2)} USD
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button
                    onClick={add}
                    className="h-12 rounded-lg bg-bb-yellow hover:bg-bb-yellow-dark text-black font-extrabold text-sm shadow-md"
                  >
                    {inCart ? (
                      <>
                        <CheckCircle2 className="mr-2 h-5 w-5" /> Added to Cart
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={whatsapp}
                    className="h-12 rounded-lg bg-wa hover:bg-wa-dark text-white font-extrabold text-sm shadow-md"
                  >
                    <MessageCircle className="mr-2 h-5 w-5" /> Order via WhatsApp
                  </Button>
                </div>
              </>
            ) : (
              <Button disabled className="w-full h-12 bg-slate-200 text-slate-500 font-bold text-sm rounded-lg">
                Currently Sold Out
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile purchase bar */}
      {!outOfStock && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_30px_-20px_rgba(15,23,42,0.45)] backdrop-blur md:hidden">
          <div className="store-shell flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-slate-500">{selected?.name || product.name}</p>
              <p className="text-base font-black text-bb-ink">${(price * quantity).toFixed(2)}</p>
            </div>
            <Button
              onClick={add}
              className="h-11 shrink-0 rounded-lg bg-bb-yellow px-5 text-xs font-black text-black hover:bg-bb-yellow-dark"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {inCart ? "Added" : "Add to Cart"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Tabs: Overview, Specs, What's in the Box, Reviews ── */}
      <section className="mt-12 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b bg-slate-50/50">
          {(
            [
              { id: "overview", label: "Overview & Features" },
              { id: "specs", label: "Technical Specifications" },
              { id: "box", label: "What's in the Box" },
              { id: "reviews", label: `Customer Reviews (${reviewCount})` },
            ] as { id: TabId; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-6 py-4 text-xs font-black uppercase tracking-wider transition-colors border-b-2 ${
                tab === t.id
                  ? "border-bb-blue text-bb-blue bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {tab === "overview" && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h3 className="text-lg font-black text-slate-900">Product Description</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                  {product.description || "Product description and specifications will be updated as more information is added to the catalogue."}
                </p>
              </div>

              {media && media.features && (
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Key Features</h4>
                  <ul className="mt-3 space-y-2 text-xs text-slate-700">
                    {media.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-bb-blue shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {tab === "specs" && (
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-4">Detailed Technical Specifications</h3>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                {specs.map(([label, value], i) => (
                  <div
                    key={label + i}
                    className={`grid grid-cols-2 px-4 py-3 text-xs ${i % 2 === 0 ? "bg-white" : "bg-slate-50/70"}`}
                  >
                    <span className="font-semibold text-slate-500">{label}</span>
                    <span className="text-right font-bold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "box" && (
            <div>
              <h3 className="text-lg font-black text-slate-900 mb-4">Included Components</h3>
              <div className="grid gap-3 sm:grid-cols-2 max-w-2xl">
                {(media?.whatsInTheBox || [
                  "Main Hardware Unit",
                  "User Installation & Wiring Manual",
                  "Warranty Card & QC Passed Certificate",
                  "Mounting Bracket & Hardware",
                ]).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-bold text-slate-800">
                    <Package className="h-4 w-4 text-bb-blue shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "reviews" && (
            <ProductReviews productId={product.id} avgRating={avgRating} reviewCount={reviewCount} />
          )}
        </div>
      </section>

      {/* ── Related Equipment ── */}
      {related.length > 0 && (
        <section className="mt-14">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-bb-blue">
            Related Hardware
          </span>
          <h3 className="text-2xl font-black text-slate-900 mt-1">Customers Also Viewed</h3>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                onOrder={orderViaWhatsApp}
                onAddToCart={addProduct}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
