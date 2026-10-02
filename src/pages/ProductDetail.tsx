import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  MessageCircle,
  Heart,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Share2,
  Minus,
  Plus,
  AlertTriangle,
  Package,
  Zap,
  Wrench,
  ChevronRight,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductReviews } from "@/components/ProductReviews";
import { ProductCard } from "@/components/ProductCard";
import { StoreModal } from "@/components/StoreModal";
import { Cart } from "@/components/Cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getProductMedia } from "@/data/solarProducts";

interface Variant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number;
  stock_quantity: number;
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

const WHATSAPP = "263778158984";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(4.9);
  const [reviewCount, setReviewCount] = useState(16);
  const [tab, setTab] = useState<"overview" | "specs" | "box" | "reviews">("overview");
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [bundleAdded, setBundleAdded] = useState(false);

  useEffect(() => {
    if (id) load(id);
  }, [id]);

  const load = async (productId: string) => {
    setLoading(true);
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
    const initialImg = data.image_url && !data.image_url.includes("0.2930892299948875")
      ? data.image_url
      : media.imageUrl;

    setProduct({
      ...data,
      brand: data.brand || media.brand.split("/")[0],
      model_number: data.model_number || media.modelNumber,
      image_url: initialImg,
      specifications: (data.specifications || {}) as Record<string, string>,
    });
    setVariants(loaded);
    setSelectedVariantId(loaded[0]?.id || null);
    setActiveImage(initialImg);

    // Reviews
    const { data: reviews } = await supabase.from("reviews").select("rating").eq("product_id", productId);
    const ratings = (reviews || []).map((r) => r.rating);
    if (ratings.length > 0) {
      setReviewCount(ratings.length);
      setAvgRating(ratings.reduce((a, b) => a + b, 0) / ratings.length);
    }

    // Related Products
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
  };

  useEffect(() => {
    if (!product) return;
    document.title = `${product.name} | Tech Innovation Best Buy`;
    return () => {
      document.title = "Tech Innovation | Solar & Electronics Zimbabwe";
    };
  }, [product]);

  const selected = variants.find((v) => v.id === selectedVariantId) || null;
  const price = selected?.price ?? product?.price ?? 0;
  const stock = selected?.stock_quantity ?? product?.stock_quantity ?? 999;
  const cartId = selected && product ? product.id + "::" + selected.id : product?.id || "";
  const outOfStock = stock <= 0;
  const lowStock = stock > 0 && stock <= 5;
  const inCart = isInCart(cartId);
  const wishlisted = product ? isWishlisted(product.id) : false;

  const media = product ? getProductMedia(product) : null;
  const originalPrice = media ? (media.originalPrice > price ? media.originalPrice : Math.round(price * 1.18)) : price;
  const savings = originalPrice - price;

  const specs = useMemo(() => {
    if (!product) return [];
    const base = [
      product.brand && ["Brand", product.brand],
      product.model_number && ["Model Number", product.model_number],
      product.product_type && ["Equipment Category", product.product_type.replaceAll("_", " ")],
      product.power_watts && ["Rated Power", `${product.power_watts} W`],
      product.voltage && ["System Voltage", product.voltage],
      product.capacity && ["Capacity / Storage", product.capacity],
      product.warranty_months
        ? ["Warranty", `${product.warranty_months} Months`]
        : ["Warranty", media?.warranty || "12 Months Official"],
      product.installation_required && ["Professional Installation", "Certified Engineers Available"],
    ].filter((x): x is string[] => Boolean(x));

    const attrs = selected ? Object.entries(selected.attributes || {}).map(([k, v]) => [k, String(v)]) : [];
    return [...base, ...attrs, ...Object.entries(product.specifications || {}).map(([k, v]) => [k, String(v)])];
  }, [product, selected, media]);

  const add = () => {
    if (!product || outOfStock) return;
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
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleAddBundle = () => {
    if (!product) return;
    // Add current product + solar cables + surge protector
    add();
    addToCart({
      id: "bundle-cables",
      name: "6mm² Solar DC Cable (20m Roll)",
      price: 50,
      image_url: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800&h=800&fit=crop&q=85",
      stock_quantity: 20,
    });
    addToCart({
      id: "bundle-protector",
      name: "Automatic Voltage Protector 63A",
      price: 65,
      image_url: "https://images.unsplash.com/photo-1558441719-8b449c6ff673?w=800&h=800&fit=crop&q=85",
      stock_quantity: 15,
    });
    setBundleAdded(true);
    toast.success("Complete 3-piece installation bundle added to cart! Save $15.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#0046be]" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#111820] flex flex-col font-sans">
      {/* ── Best Buy Top Header Bar ── */}
      <header className="sticky top-0 z-50 bg-[#0046be] text-white shadow-md">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10 font-bold"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Shop All
          </Button>

          <ChevronRight className="h-3.5 w-3.5 text-white/40" />
          <span className="truncate text-xs font-semibold text-white/80 max-w-xs sm:max-w-md">
            {product.categories?.name || "Equipment"} / {product.name}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied to clipboard");
              }}
              className="text-white hover:bg-white/10"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleWishlist(product.id, product.name)}
              className={wishlisted ? "text-red-400" : "text-white hover:bg-white/10"}
              title="Save to Wishlist"
            >
              <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-400" : ""}`} />
            </Button>
            <Cart />
          </div>
        </div>
      </header>

      {/* ── Main Product Display ── */}
      <main className="container mx-auto max-w-7xl px-4 py-8 flex-1">
        {/* Breadcrumb line */}
        <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
          <Link to="/" className="hover:text-[#0046be]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-800 font-semibold">{product.categories?.name || "Power Equipment"}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-400 truncate">{product.name}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          {/* ── Left Column: Image Gallery & Badges ── */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-center">
              {savings > 0 && (
                <span className="absolute left-4 top-4 z-10 rounded bg-[#bb0620] px-3 py-1 text-xs font-black text-white shadow-sm uppercase tracking-wider">
                  Save ${savings}
                </span>
              )}
              {outOfStock && (
                <span className="absolute right-4 top-4 z-10 rounded bg-[#111820] px-3 py-1 text-xs font-black text-white">
                  OUT OF STOCK
                </span>
              )}
              {lowStock && !outOfStock && (
                <span className="absolute right-4 top-4 z-10 rounded bg-[#ffe000] px-3 py-1 text-xs font-black text-black">
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
                      activeImage === img ? "border-[#0046be] ring-2 ring-[#0046be]/20" : "border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <img src={img} alt="Gallery item" className="h-full w-full object-cover rounded-lg" />
                  </button>
                ))}
              </div>
            )}

            {/* Value Guarantees Below Gallery */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { icon: ShieldCheck, title: "Official Warranty", desc: media?.warranty || "12–60 Months" },
                { icon: Truck, title: "Nationwide Freight", desc: "Harare & All Provinces" },
                { icon: Wrench, title: "Tech Support", desc: "Expert Sizing & Setup" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border border-slate-200 bg-white p-3.5 text-center shadow-xs">
                  <Icon className="h-5 w-5 text-[#0046be] mx-auto mb-1" />
                  <p className="text-xs font-black text-slate-900">{title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Column: Best Buy Pricing, Specs & Buy Box ── */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div>
              {/* Brand and Model Header */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#0046be]">
                  {product.brand || media?.brand}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Model: {product.model_number || media?.modelNumber}
                </span>
              </div>

              <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {product.name}
              </h1>

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
                  className="text-xs text-slate-500 hover:text-[#0046be] underline"
                >
                  ({reviewCount} customer reviews)
                </button>
              </div>

              {/* ── Best Buy Pricing Box ── */}
              <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-black text-[#111820]">
                    ${price.toFixed(2)} USD
                  </span>
                  {savings > 0 && (
                    <span className="text-base text-slate-400 line-through">
                      ${originalPrice.toFixed(2)}
                    </span>
                  )}
                  {savings > 0 && (
                    <Badge className="bg-[#bb0620] text-white hover:bg-[#bb0620] font-black text-xs border-0">
                      Save ${savings}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Cash on Delivery, EcoCash, Zipit or Bank Transfer accepted. Price inclusive of VAT.
                </p>
              </div>

              {/* Variant Selector Pills */}
              {variants.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="font-black text-slate-900">Select Power / Capacity Option:</span>
                    <span className="text-slate-500">{variants.length} configurations</span>
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
                              ? "border-[#0046be] bg-blue-50/50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          } ${unavailable ? "opacity-40 cursor-not-allowed" : ""}`}
                        >
                          <span className="block text-xs font-black text-slate-900">{v.name}</span>
                          <span className="mt-1 block text-sm font-bold text-[#0046be]">${v.price.toFixed(2)}</span>
                          <span className={`mt-0.5 block text-[10px] font-semibold ${unavailable ? "text-red-500" : "text-emerald-700"}`}>
                            {unavailable ? "Sold out" : `${v.stock_quantity} in stock`}
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
                    <MapPin className="h-4 w-4 text-[#0046be] mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">Harare Showroom Pickup</p>
                      <p className="text-slate-500 text-[11px]">Ready in 2 hours for collection & inspection</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStoreModalOpen(true)}
                    className="text-[#0046be] font-bold underline shrink-0 hover:text-[#003494]"
                  >
                    Store details
                  </button>
                </div>

                <div className="pt-2 border-t flex items-start gap-2.5">
                  <Truck className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900">Doorstep Delivery Across Zimbabwe</p>
                    <p className="text-slate-500 text-[11px]">Same-day in Harare • 24–48 hrs nationwide freight</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Best Buy Yellow Purchase Actions ── */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              {!outOfStock ? (
                <>
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
                    <span className="text-sm font-black text-[#111820]">
                      Subtotal: ${(price * quantity).toFixed(2)} USD
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      onClick={add}
                      className="h-12 rounded-lg bg-[#ffe000] hover:bg-[#ffd200] text-black font-extrabold text-sm shadow-md"
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
                      className="h-12 rounded-lg bg-[#25D366] hover:bg-[#128C7E] text-white font-extrabold text-sm shadow-md"
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

        {/* ── Frequently Bought Together Bundle ── */}
        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0046be]">
            <Sparkles className="h-4 w-4" /> Frequently Bought Together
          </div>
          <h3 className="text-xl font-black text-slate-900 mt-1">Complete Installation Accessories Bundle</h3>
          <p className="text-xs text-slate-500 mt-0.5">Protect your investment with certified DC cables and surge protection.</p>

          <div className="mt-6 flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 rounded-xl border p-3 bg-slate-50">
                <img src={activeImage} alt={product.name} className="h-14 w-14 object-cover rounded" />
                <div className="text-xs">
                  <p className="font-bold text-slate-900 truncate max-w-[150px]">{product.name}</p>
                  <p className="text-[#0046be] font-black">${price.toFixed(2)}</p>
                </div>
              </div>

              <span className="text-xl font-bold text-slate-400">+</span>

              <div className="flex items-center gap-2 rounded-xl border p-3 bg-slate-50">
                <img
                  src="https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=200&h=200&fit=crop&q=80"
                  alt="Cables"
                  className="h-14 w-14 object-cover rounded"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">6mm² PV Cable (20m Roll)</p>
                  <p className="text-[#0046be] font-black">$50.00</p>
                </div>
              </div>

              <span className="text-xl font-bold text-slate-400">+</span>

              <div className="flex items-center gap-2 rounded-xl border p-3 bg-slate-50">
                <img
                  src="https://images.unsplash.com/photo-1558441719-8b449c6ff673?w=200&h=200&fit=crop&q=80"
                  alt="Protector"
                  className="h-14 w-14 object-cover rounded"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Automatic Voltage Protector 63A</p>
                  <p className="text-[#0046be] font-black">$65.00</p>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xs text-slate-500 font-semibold">Bundle Total Price:</div>
              <div className="text-2xl font-black text-slate-900">${(price + 50 + 65).toFixed(2)} USD</div>
              <Button
                onClick={handleAddBundle}
                className="mt-3 bg-[#ffe000] hover:bg-[#ffd200] text-black font-extrabold text-xs h-10 px-5 shadow-sm"
              >
                {bundleAdded ? "✓ Added All 3 to Cart" : "Add All 3 Items to Cart"}
              </Button>
            </div>
          </div>
        </section>

        {/* ── Tabs: Overview, Specs, What's in the Box, Reviews ── */}
        <section className="mt-12 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto border-b bg-slate-50/50">
            {[
              { id: "overview", label: "Overview & Features" },
              { id: "specs", label: "Technical Specifications" },
              { id: "box", label: "What's in the Box" },
              { id: "reviews", label: `Customer Reviews (${reviewCount})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`px-6 py-4 text-xs font-black uppercase tracking-wider transition-colors border-b-2 ${
                  tab === t.id
                    ? "border-[#0046be] text-[#0046be] bg-white"
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
                    {product.description ||
                      "Engineered for high-yield solar harvesting and dependable backup power in Zimbabwe. Built with rugged industrial components to resist power grid surges, temperature swings, and prolonged high-load operation."}
                  </p>
                </div>

                {media && media.features && (
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">Key Features</h4>
                    <ul className="mt-3 space-y-2 text-xs text-slate-700">
                      {media.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-[#0046be] shrink-0 mt-0.5" />
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
                      <Package className="h-4 w-4 text-[#0046be] shrink-0" />
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
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#0046be]">
              Related Hardware
            </span>
            <h3 className="text-2xl font-black text-slate-900 mt-1">Customers Also Viewed</h3>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  onOrder={() => navigate(`/product/${item.id}`)}
                  onAddToCart={() => {
                    addToCart(item);
                    toast.success(`${item.name} added to cart`);
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Showroom Modal */}
      <StoreModal open={storeModalOpen} onClose={() => setStoreModalOpen(false)} />
    </div>
  );
}
