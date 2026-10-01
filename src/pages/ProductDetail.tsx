import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ShoppingCart, MessageCircle, Heart, Star, ShieldCheck, Truck, RotateCcw, CheckCircle2, Share2, Minus, Plus, AlertTriangle, Package, Zap, Wrench, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductReviews } from "@/components/ProductReviews";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Variant {
  id: string; product_id: string; name: string; sku: string | null; price: number; stock_quantity: number;
  image_url: string | null; attributes: Record<string, string>; is_active: boolean; sort_order: number;
}
interface Product {
  id: string; name: string; description: string | null; price: number; category_id: string | null;
  image_url: string | null; video_url: string | null; stock_quantity: number; brand: string | null;
  model_number: string | null; product_type: string; power_watts: number | null; voltage: string | null;
  capacity: string | null; warranty_months: number | null; installation_required: boolean;
  specifications: Record<string, string>; categories?: { name: string };
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, isInCart } = useCart();
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [tab, setTab] = useState<"overview" | "specs" | "reviews">("overview");

  useEffect(() => { if (id) load(id); }, [id]);

  const load = async (productId: string) => {
    setLoading(true);
    const [productRes, variantRes] = await Promise.all([
      supabase.from("products").select("*, categories(name)").eq("id", productId).single(),
      supabase.from("product_variants").select("*").eq("product_id", productId).eq("is_active", true).order("sort_order").order("name"),
    ]);
    if (productRes.error || !productRes.data) { toast.error("Product not found"); navigate("/"); return; }

    const data = productRes.data as Product;
    const loaded = ((variantRes.data || []) as Variant[]).map(v => ({ ...v, attributes: (v.attributes || {}) as Record<string, string> }));
    setProduct({ ...data, specifications: (data.specifications || {}) as Record<string, string> });
    setVariants(loaded);
    setSelectedVariantId(loaded[0]?.id || null);

    const { data: reviews } = await supabase.from("reviews").select("rating").eq("product_id", productId);
    const ratings = (reviews || []).map(r => r.rating);
    setReviewCount(ratings.length);
    setAvgRating(ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0);

    if (data.category_id) {
      const { data: rel } = await supabase.from("products").select("*").eq("category_id", data.category_id).eq("is_active", true).neq("id", productId).limit(4);
      setRelated((rel || []) as Product[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!product) return;
    document.title = product.name + " | Tech Innovation Zimbabwe";
    return () => { document.title = "Tech Innovation | Solar & Electronics Zimbabwe"; };
  }, [product]);

  const selected = variants.find(v => v.id === selectedVariantId) || null;
  const price = selected?.price ?? product?.price ?? 0;
  const stock = selected?.stock_quantity ?? product?.stock_quantity ?? 0;
  const cartId = selected && product ? product.id + "::" + selected.id : product?.id || "";
  const outOfStock = stock <= 0;
  const lowStock = stock > 0 && stock <= 5;
  const inCart = isInCart(cartId);
  const wishlisted = product ? isWishlisted(product.id) : false;

  const specs = useMemo(() => {
    if (!product) return [];
    const base = [
      product.brand && ["Brand", product.brand],
      product.model_number && ["Model", product.model_number],
      product.product_type && ["Type", product.product_type.replaceAll("_", " ")],
      product.power_watts && ["Power", product.power_watts + " W"],
      product.voltage && ["Voltage", product.voltage],
      product.capacity && ["Capacity", product.capacity],
      product.warranty_months && ["Warranty", product.warranty_months + " months"],
      product.installation_required && ["Installation", "Available"],
    ].filter((x): x is string[] => Boolean(x));
    const attrs = selected ? Object.entries(selected.attributes || {}).map(([k, v]) => [k, String(v)]) : [];
    return [...base, ...attrs, ...Object.entries(product.specifications || {}).map(([k, v]) => [k, String(v)])];
  }, [product, selected]);

  const add = () => {
    if (!product || outOfStock) return;
    for (let i = 0; i < quantity; i++) addToCart({
      id: cartId, product_id: product.id, variant_id: selected?.id || null, variant_name: selected?.name || null,
      name: selected ? product.name + " — " + selected.name : product.name,
      price, image_url: selected?.image_url || product.image_url, stock_quantity: stock,
    });
    toast.success(quantity + " × " + (selected?.name || product.name) + " added to cart");
  };

  const whatsapp = () => {
    if (!product) return;
    const message = "Hello Tech Innovation, I would like to order:\n\n" + product.name +
      (selected ? "\nVariant: " + selected.name + "\nSKU: " + (selected.sku || "N/A") : "") +
      "\nQty: " + quantity + "\nPrice: $" + (price * quantity).toFixed(2) +
      "\n\nPlease confirm availability and delivery/installation.";
    window.open("https://wa.me/263778158984?text=" + encodeURIComponent(message), "_blank");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#0046be]" /></div>;
  if (!product) return null;

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-[#111820]">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="container mx-auto flex h-14 items-center gap-2 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}><ArrowLeft className="mr-1 h-4 w-4" /> Shop</Button>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          <span className="truncate text-xs font-semibold">{product.categories?.name || "Products"} / {product.name}</span>
          <div className="ml-auto flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast.success("Link copied"))}><Share2 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => toggleWishlist(product.id, product.name)} className={wishlisted ? "text-red-500" : ""}><Heart className={"h-4 w-4 " + (wishlisted ? "fill-red-500" : "")} /></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-7">
        <div className="grid gap-7 lg:grid-cols-2">
          <div>
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-white">
              {outOfStock && <span className="absolute left-4 top-4 z-10 rounded bg-[#111820] px-3 py-1 text-xs font-black text-white">OUT OF STOCK</span>}
              {lowStock && <span className="absolute left-4 top-4 z-10 rounded bg-[#ffe000] px-3 py-1 text-xs font-black">ONLY {stock} LEFT</span>}
              <img src={selected?.image_url || product.image_url || ""} alt={product.name} className="h-full w-full object-contain p-8" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[[ShieldCheck, "Quality equipment"], [Truck, "Zimbabwe delivery"], [Wrench, product.installation_required ? "Installation available" : "Technical support"]].map(([Icon, label]) => {
                const I = Icon as typeof ShieldCheck;
                return <div key={label as string} className="flex items-center gap-2 rounded border bg-white p-3"><I className="h-4 w-4 text-[#0046be]" /><span className="text-[10px] font-bold text-slate-600">{label as string}</span></div>;
              })}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-6 lg:p-8">
            <div className="flex items-center gap-2">
              <Badge className="rounded-sm border-0 bg-blue-50 text-[#0046be]">{product.categories?.name || "Solar & Electronics"}</Badge>
              {product.brand && <span className="text-xs font-bold text-slate-500">{product.brand}</span>}
            </div>
            <h1 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">{product.name}</h1>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex">{[1,2,3,4,5].map(s => <Star key={s} className={"h-4 w-4 " + (s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-slate-200")} />)}</div>
              <span className="text-xs text-slate-500">{reviewCount ? avgRating.toFixed(1) + " (" + reviewCount + " reviews)" : "No reviews yet"}</span>
            </div>

            <div className="mt-6 flex items-end gap-2 border-y py-5">
              <span className="text-4xl font-black">{price.toFixed(2)} USD</span>
              {variants.length > 0 && <span className="pb-1 text-xs text-slate-500">selected option</span>}
            </div>

            {variants.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 flex justify-between"><p className="text-sm font-black">Choose an option</p><span className="text-xs text-slate-500">{variants.length} available</span></div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {variants.map(v => {
                    const active = v.id === selectedVariantId;
                    const unavailable = v.stock_quantity <= 0;
                    return <button key={v.id} disabled={unavailable} onClick={() => { setSelectedVariantId(v.id); setQuantity(1); }} className={"rounded-md border-2 p-3 text-left " + (active ? "border-[#0046be] bg-blue-50" : "border-slate-200") + (unavailable ? " opacity-45" : "")}>
                      <span className="block text-xs font-black">{v.name}</span><span className="mt-1 block text-sm font-bold">{v.price.toFixed(2)} USD</span><span className={"mt-1 block text-[10px] font-semibold " + (unavailable ? "text-red-500" : "text-emerald-600")}>{unavailable ? "Out of stock" : v.stock_quantity + " in stock"}</span>
                    </button>;
                  })}
                </div>
              </div>
            )}

            {selected && <div className="mt-4 rounded bg-slate-50 p-4"><div className="flex justify-between text-xs"><span className="font-bold text-slate-500">Selected SKU</span><span className="font-mono font-bold">{selected.sku || "Not assigned"}</span></div><div className="mt-3 flex flex-wrap gap-2">{Object.entries(selected.attributes || {}).map(([k, v]) => <span key={k} className="rounded border bg-white px-2 py-1 text-[10px] font-semibold">{k}: {String(v)}</span>)}</div></div>}

            <div className={"mt-5 flex items-center gap-2 text-sm font-bold " + (outOfStock ? "text-red-500" : "text-emerald-600")}>{outOfStock ? <><AlertTriangle className="h-4 w-4" /> Out of stock</> : <><CheckCircle2 className="h-4 w-4" /> In stock{lowStock ? " — only " + stock + " remaining" : ""}</>}</div>

            {!outOfStock && <div className="mt-5 flex flex-wrap items-center gap-3"><span className="text-sm font-bold">Quantity</span><div className="flex items-center rounded border"><button className="h-10 w-10" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="mx-auto h-4 w-4" /></button><span className="w-10 text-center text-sm font-black">{quantity}</span><button className="h-10 w-10 border-l" onClick={() => setQuantity(Math.min(stock, quantity + 1))}><Plus className="mx-auto h-4 w-4" /></button></div><span className="text-sm font-black">Total: { (price * quantity).toFixed(2) } USD</span></div>}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button onClick={add} disabled={outOfStock} className="h-12 rounded-md bg-[#0046be] font-black hover:bg-[#003b95]">{inCart ? <><CheckCircle2 className="mr-2 h-5 w-5" /> In cart</> : <><ShoppingCart className="mr-2 h-5 w-5" /> Add to cart</>}</Button>
              <Button onClick={whatsapp} disabled={outOfStock} className="h-12 rounded-md bg-emerald-600 font-black text-white hover:bg-emerald-700"><MessageCircle className="mr-2 h-5 w-5" /> WhatsApp quote</Button>
            </div>

            <div className="mt-5 grid gap-2 border-t pt-5 text-xs text-slate-600 sm:grid-cols-2">
              <div className="flex gap-2"><Zap className="h-4 w-4 text-[#0046be]" /> Technical product support</div>
              <div className="flex gap-2"><Package className="h-4 w-4 text-[#0046be]" /> Delivery across Zimbabwe</div>
              <div className="flex gap-2"><Wrench className="h-4 w-4 text-[#0046be]" /> Installation options</div>
              <div className="flex gap-2"><RotateCcw className="h-4 w-4 text-[#0046be]" /> After-sales support</div>
            </div>
          </div>
        </div>

        <section className="mt-9 rounded-lg border bg-white">
          <div className="flex overflow-x-auto border-b">{(["overview", "specs", "reviews"] as const).map(t => <button key={t} onClick={() => setTab(t)} className={"border-b-2 px-6 py-4 text-sm font-black capitalize " + (tab === t ? "border-[#0046be] text-[#0046be]" : "border-transparent text-slate-500")}>{t}{t === "reviews" && reviewCount ? " (" + reviewCount + ")" : ""}</button>)}</div>
          <div className="p-6 lg:p-8">
            {tab === "overview" && <div className="max-w-3xl"><h2 className="text-lg font-black">Product information</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{product.description || "Technical product information is available in the specifications panel."}</p></div>}
            {tab === "specs" && <div><h2 className="text-lg font-black">Specifications</h2>{specs.length ? <div className="mt-4 overflow-hidden rounded border">{specs.map(([label, value], i) => <div key={label + i} className={"grid grid-cols-2 px-4 py-3 text-sm " + (i % 2 ? "bg-slate-50" : "bg-white")}><span className="font-semibold text-slate-500">{label}</span><span className="text-right font-bold">{value}</span></div>)}</div> : <p className="mt-3 text-sm text-slate-500">No detailed specifications have been added yet.</p>}</div>}
            {tab === "reviews" && <ProductReviews productId={product.id} avgRating={avgRating} reviewCount={reviewCount} />}
          </div>
        </section>

        {related.length > 0 && <section className="mt-12"><p className="text-xs font-black uppercase tracking-widest text-[#0046be]">More from this category</p><h2 className="mt-1 text-2xl font-black">You may also like</h2><div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">{related.map(item => (
              <ProductCard
                key={item.id}
                product={item}
                onOrder={() => {
                  addToCart({
                    id: item.id,
                    product_id: item.id,
                    variant_id: null,
                    variant_name: null,
                    name: item.name,
                    price: item.price,
                    image_url: item.image_url,
                    stock_quantity: item.stock_quantity,
                  });
                  toast.success(`${item.name} added to cart`);
                }}
              />
            ))}</div></section>}
      </main>
    </div>
  );
}
