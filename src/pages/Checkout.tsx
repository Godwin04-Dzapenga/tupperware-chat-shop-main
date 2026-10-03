import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { isMedusaCommerce } from "@/lib/commerce";
import { medusa } from "@/lib/medusa";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import {
  ArrowLeft, ShoppingBag, MapPin, CreditCard, CheckCircle2,
  Truck, Tag, MessageCircle, Banknote, Loader2, Shield,
  ChevronRight, Package, Edit2, Phone, User, AlertCircle,
  Minus, Plus, Trash2, ShieldCheck, Star, Lock,
  Smartphone, Zap, Clock, ChevronDown, Sun
} from "lucide-react";
import { resolveProductImage } from "@/data/solarProducts";

// ── Types ──────────────────────────────────────────────────────────────────
type Step = "cart" | "shipping" | "payment" | "confirm";
type CheckoutPath = "online" | "whatsapp" | null;
type PaymentMethod = "cash_on_delivery" | "paynow_ecocash" | "paynow_onemoney" | "stripe_card";

const PAYMENT_LABELS: Record<PaymentMethod, string> = { cash_on_delivery: "Cash on delivery", paynow_ecocash: "EcoCash via Paynow", paynow_onemoney: "OneMoney via Paynow", stripe_card: "Card payment" };

interface ShippingForm {
  name: string; phone: string; email: string;
  line1: string; line2: string; city: string; country: string;
}

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const ZW_CITIES = [
  "Harare","Bulawayo","Gweru","Mutare","Masvingo",
  "Chinhoyi","Marondera","Kwekwe","Kadoma","Victoria Falls",
  "Bindura","Chiredzi","Zvishavane","Beitbridge","Hwange"
];

const STEPS: { key: Step; label: string }[] = [
  { key:"cart",     label:"Cart"     },
  { key:"shipping", label:"Delivery" },
  { key:"payment",  label:"Payment"  },
  { key:"confirm",  label:"Confirm"  },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function Checkout() {
  const { items, totalPrice, clearCart, updateQuantity, removeFromCart, syncWithBackend } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep]                 = useState<Step>("cart");
  const [path, setPath]                 = useState<CheckoutPath>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_on_delivery");
  const [couponCode, setCouponCode]     = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount]         = useState(0);
  const [loading, setLoading]           = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [cityOpen, setCityOpen]         = useState(false);
  const [orderResult, setOrderResult]   = useState<{
    order_number: string; total: number; whatsapp_url: string;
  } | null>(null);
  const [backendTotal, setBackendTotal] = useState<number | null>(null);
  const [backendShipping, setBackendShipping] = useState<number | null>(null);

  const [shipping, setShipping] = useState<ShippingForm>({
    name: user?.user_metadata?.full_name ?? "",
    phone: "", email: user?.email ?? "",
    line1: "", line2: "", city: "Harare", country: "Zimbabwe",
  });

  // ── Derived ───────────────────────────────────────────────────────────
  const shippingFee   = backendShipping ?? ((totalPrice - discount) >= 50 ? 0 : items.length > 0 ? 5 : 0);
  const finalTotal    = backendTotal ?? (totalPrice - discount + shippingFee);
  const currentStepIdx = STEPS.findIndex(s => s.key === step);
  const emailValid = !shipping.email.trim() || isValidEmail(shipping.email);
  const shippingValid = Boolean(
    shipping.name.trim() &&
    shipping.phone.trim() &&
    shipping.line1.trim() &&
    shipping.city.trim() &&
    emailValid &&
    (user || isValidEmail(shipping.email)),
  );

  // ── Coupon ────────────────────────────────────────────────────────────
  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      if (isMedusaCommerce) {
        const cart = await syncWithBackend();
        if (!cart?.id) throw new Error("Your cart is still syncing. Please try again.");
        const result = await medusa.cart.addPromotion(cart.id, couponCode.trim().toUpperCase());
        const updated = result.cart;
        const discountAmount = (updated.discount_total || 0) / 100;
        setDiscount(discountAmount);
        setBackendTotal((updated.total || 0) / 100);
        setCouponApplied(true);
        toast.success(`Coupon applied — you save $${discountAmount.toFixed(2)}!`);
        return;
      }
      const { data } = await supabase.from("coupons").select("*").eq("code", couponCode.toUpperCase()).eq("active", true).maybeSingle();
      if (!data) { toast.error("Invalid or expired coupon"); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error("Coupon expired"); return; }
      if (data.min_order_total && totalPrice < data.min_order_total) { toast.error(`Min order $${data.min_order_total} required`); return; }
      const d = data.discount_type === "percent"
        ? Math.min((totalPrice * data.discount_value) / 100, totalPrice)
        : Math.min(data.discount_value, totalPrice);
      setDiscount(d); setCouponApplied(true);
      toast.success(`Coupon applied — you save $${d.toFixed(2)}!`);
    } catch (error: any) {
      toast.error(error?.message || "Coupon could not be applied");
    } finally { setCouponLoading(false); }
  };

  // ── Prepare Medusa checkout ───────────────────────────────────────────
  const prepareCheckout = async () => {
    if (!isMedusaCommerce) { setStep("payment"); return; }
    setLoading(true);
    try {
      const cart = await syncWithBackend();
      if (!cart?.id) throw new Error("Could not create the Medusa cart.");
      const addressParts = shipping.name.trim().split(/\s+/);
      const customerEmail = shipping.email.trim();
      if (!isValidEmail(customerEmail)) {
        throw new Error("Please enter a valid email address.");
      }
      const updated = await medusa.cart.updateAddress(cart.id, {
        email: customerEmail,
        shipping_address: {
          first_name: addressParts[0] || shipping.name,
          last_name: addressParts.slice(1).join(" ") || "Customer",
          address_1: shipping.line1.trim(),
          address_2: shipping.line2.trim() || undefined,
          city: shipping.city.trim(),
          country_code: "zw",
          phone: shipping.phone.trim(),
        },
        billing_address: {
          first_name: addressParts[0] || shipping.name,
          last_name: addressParts.slice(1).join(" ") || "Customer",
          address_1: shipping.line1.trim(),
          address_2: shipping.line2.trim() || undefined,
          city: shipping.city.trim(),
          country_code: "zw",
          phone: shipping.phone.trim(),
        },
      });
      let checkoutCart = updated.cart;
      const options = await medusa.cart.getShippingOptions(checkoutCart.id);
      const standard = options.shipping_options?.find((option) => /standard/i.test(option.name)) || options.shipping_options?.[0];
      if (!standard) throw new Error("No Zimbabwe shipping option is available for this cart.");
      checkoutCart = (await medusa.cart.addShippingMethod(checkoutCart.id, standard.id)).cart;
      setBackendShipping((checkoutCart.shipping_total || 0) / 100);
      setBackendTotal((checkoutCart.total || 0) / 100);
      setStep("payment");
    } catch (error: any) {
      toast.error(error?.message || "Could not prepare checkout.");
    } finally { setLoading(false); }
  };

  // ── Place order ───────────────────────────────────────────────────────
  const placeOrder = async () => {
    setLoading(true);
    try {
      if (isMedusaCommerce) {
        const cart = await syncWithBackend();
        if (!cart?.id) throw new Error("Your cart could not be synchronized.");

        const paymentCollection =
          cart.payment_collection?.id
            ? cart.payment_collection
            : (await medusa.cart.createPaymentCollection(cart.id)).payment_collection;

        if (!paymentCollection?.id) {
          throw new Error("Medusa could not create a payment collection.");
        }

        if (paymentMethod === "paynow_ecocash" || paymentMethod === "paynow_onemoney") {
          const providerId = "pp_paynow_paynow";
          const initialized = await medusa.cart.initiatePaymentSession(
            paymentCollection.id,
            providerId,
            {
              cart_id: cart.id,
              email: shipping.email.trim(),
              phone: shipping.phone.trim(),
              payment_method: paymentMethod === "paynow_ecocash" ? "ecocash" : "onemoney",
            },
          );

          const session = initialized.payment_collection.payment_sessions?.find(
            (payment) => payment.provider_id === providerId,
          );
          const redirectUrl = session?.data?.redirect_url;
          if (typeof redirectUrl !== "string" || !redirectUrl) {
            throw new Error("Paynow did not return a payment link.");
          }

          localStorage.setItem("tech_innovation_paynow_cart_id", cart.id);
          window.location.assign(redirectUrl);
          return;
        }

        // Cash on Delivery uses Medusa's built-in system/manual provider.
        if (paymentMethod === "cash_on_delivery") {
          await medusa.cart.initiatePaymentSession(paymentCollection.id, "pp_system");
        }

        const completed = await medusa.cart.complete(cart.id);
        if (completed.type !== "order" || !completed.order) {
          throw new Error("Medusa could not complete the order. Please check the payment session and try again.");
        }
        const order = completed.order;
        const total = (order.total || 0) / 100;
        const orderNumber = order.display_id ? String(order.display_id) : order.id;
        const itemsList = items.map(i => `• ${i.name} ×${i.quantity}`).join("\n");
        const whatsapp_url = `https://wa.me/263778158984?text=${encodeURIComponent(
          `Hi Tech Innovation, I have placed order #${orderNumber}.\n\n${itemsList}\n\nTotal: $${total.toFixed(2)} USD\nDelivery: ${shipping.city}, Zimbabwe`
        )}`;
        const history = JSON.parse(localStorage.getItem("tech_innovation_order_ids") || "[]") as string[];
        localStorage.setItem("tech_innovation_order_ids", JSON.stringify([order.id, ...history.filter((id) => id !== order.id)].slice(0, 20)));
        clearCart();
        setOrderResult({ order_number: orderNumber, total, whatsapp_url });
        setStep("confirm");
        return;
      }
      const res = await supabase.functions.invoke("checkout", {
        body: {
          items: items.map(i => ({ product_id: i.product_id || i.id, variant_id: i.variant_id || undefined, quantity: i.quantity })),
          shipping: { name: shipping.name, phone: shipping.phone, line1: shipping.line1, city: shipping.city, country: shipping.country },
          payment_method: paymentMethod,
          coupon_code: couponApplied ? couponCode.toUpperCase() : undefined,
          guest_email: !user ? shipping.email : undefined,
          guest_name: !user ? shipping.name : undefined,
        },
      });
      if (res.error || !res.data?.success) throw new Error(res.data?.error || "Checkout failed");
      clearCart();
      setOrderResult(res.data);
      setStep("confirm");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  // ── WhatsApp direct order (bypass online checkout) ───────────────────
  const orderViaWhatsApp = () => {
    const itemsList = items.map(i => `• ${i.name}${i.variant_name ? ` — ${i.variant_name}` : ""} ×${i.quantity} — ${(i.price * i.quantity).toFixed(2)}`).join("\n");
    const msg = encodeURIComponent(
      `Hi! I'd like to place an order:\n\n${itemsList}\n\n` +
      (discount > 0 ? `Coupon: ${couponCode} (-$${discount.toFixed(2)})\n` : "") +
      `Subtotal: $${totalPrice.toFixed(2)}\n` +
      `Shipping: ${shippingFee === 0 ? "FREE" : `$${shippingFee.toFixed(2)}`}\n` +
      `*Total: $${finalTotal.toFixed(2)}*\n\n` +
      `Please confirm availability, payment instructions and delivery details. Thank you!`
    );
    window.open(`https://wa.me/263778158984?text=${msg}`, "_blank");
  };

  useEffect(() => {
    if (!isMedusaCommerce) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("paynow") !== "return") return;

    const cartId = params.get("cart_id") || localStorage.getItem("tech_innovation_paynow_cart_id");
    if (!cartId) {
      toast.error("We could not find the Paynow checkout session.");
      return;
    }

    let cancelled = false;
    const completePaynowOrder = async () => {
      setLoading(true);
      try {
        const completed = await medusa.cart.complete(cartId);
        if (cancelled) return;
        if (completed.type !== "order" || !completed.order) {
          throw new Error("Paynow payment has not been confirmed yet. Please wait a moment and try again.");
        }
        const order = completed.order;
        const total = (order.total || 0) / 100;
        const orderNumber = order.display_id ? String(order.display_id) : order.id;
        const itemsList = items.map(i => `• ${i.name} ×${i.quantity}`).join("\n");
        const whatsapp_url = `https://wa.me/263778158984?text=${encodeURIComponent(
          `Hi Tech Innovation, I have paid for order #${orderNumber}.\\n\\n${itemsList}\\n\\nTotal: ${total.toFixed(2)} USD\\nDelivery: ${shipping.city}, Zimbabwe`
        )}`;
        const history = JSON.parse(localStorage.getItem("tech_innovation_order_ids") || "[]") as string[];
        localStorage.setItem("tech_innovation_order_ids", JSON.stringify([order.id, ...history.filter((id) => id !== order.id)].slice(0, 20)));
        localStorage.removeItem("tech_innovation_paynow_cart_id");
        window.history.replaceState({}, "", "/checkout");
        clearCart();
        setOrderResult({ order_number: orderNumber, total, whatsapp_url });
        setStep("confirm");
      } catch (error: any) {
        if (!cancelled) toast.error(error?.message || "Paynow payment could not be confirmed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void completePaynowOrder();
    return () => { cancelled = true; };
  }, [clearCart, isMedusaCommerce, items, shipping.city]);

  // ── Empty cart ────────────────────────────────────────────────────────
  if (items.length === 0 && step !== "confirm") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-8 text-center bg-bb-surface">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/20" />
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <p className="text-muted-foreground text-sm">Add some products before checking out.</p>
        <Button onClick={() => navigate("/")} className="rounded-sm px-8 h-11">Browse Products</Button>
      </div>
    );
  }

  // ── Order confirmed ───────────────────────────────────────────────────
  if (step === "confirm" && orderResult) {
    return (
      <div className="min-h-screen bg-bb-surface flex flex-col">
        <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 font-black text-sm"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bb-yellow text-bb-ink"><Sun className="h-5 w-5 fill-bb-ink text-bb-ink" /></span> TECH INNOVATION</div>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border overflow-hidden">
            {/* Green top bar */}
            <div className="bg-emerald-600 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 shrink-0" />
                <div>
                  <h1 className="text-xl font-extrabold">Order placed successfully!</h1>
                  <p className="text-emerald-100 text-sm mt-0.5">Thank you for shopping with Tech Innovation 🎉</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Order details */}
              <div className="rounded-xl border bg-bb-surface p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order number</span>
                  <span className="font-extrabold text-primary">{orderResult.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total charged</span>
                  <span className="font-bold text-lg">${orderResult.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery to</span>
                  <span className="font-medium">{shipping.city}, Zimbabwe</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge className="bg-amber-100 text-amber-700 border-0">Awaiting confirmation</Badge>
                </div>
              </div>

              {/* WhatsApp confirm CTA */}
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
                <p className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  Confirm your order on WhatsApp
                </p>
                <p className="text-xs text-emerald-700">Our team will confirm stock, payment status and delivery arrangements with you.</p>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm h-11 gap-2"
                  onClick={() => window.open(orderResult.whatsapp_url, "_blank")}>
                  <MessageCircle className="h-4 w-4" /> Open WhatsApp
                </Button>
              </div>

              {/* Next steps */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">What happens next</p>
                {[
                  { n: "1", t: "We confirm stock & availability via WhatsApp" },
                  { n: "2", t: "You pay using your preferred method" },
                  { n: "3", t: "We arrange delivery to your selected location" },
                ].map(step => (
                  <div key={step.n} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{step.n}</div>
                    {step.t}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button variant="outline" className="rounded-sm h-10 gap-1.5" onClick={() => navigate("/orders")}>
                  <Package className="h-4 w-4" /> My Orders
                </Button>
                <Button variant="ghost" className="rounded-sm h-10" onClick={() => navigate("/")}>
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main checkout layout ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bb-surface">

      {/* ── HEADER ── */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto flex items-center gap-4 px-4 py-3">
          <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Shop
          </button>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2 font-black text-sm"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bb-yellow text-bb-ink"><Sun className="h-5 w-5 fill-bb-ink text-bb-ink" /></span> TECH INNOVATION</div>

          {/* Step breadcrumb — Amazon style */}
          <div className="ml-auto hidden sm:flex items-center gap-1">
            {STEPS.map((s, idx) => {
              const done   = idx < currentStepIdx;
              const active = idx === currentStepIdx;
              const future = idx > currentStepIdx;
              return (
                <div key={s.key} className="flex items-center gap-1">
                  <span className={`text-xs font-semibold px-1 ${active ? "text-primary border-b-2 border-primary pb-0.5" : done ? "text-muted-foreground" : "text-muted-foreground/40"}`}>
                    {done ? "✓ " : ""}{s.label}
                  </span>
                  {idx < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground/30" />}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-4">
            <Lock className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline text-emerald-600 font-semibold">Secure Checkout</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-5">

          {/* ── MAIN ── */}
          <div className="lg:col-span-3 space-y-4">

            {/* ════════════════════════════════════════════
                STEP 1 — CART REVIEW
            ════════════════════════════════════════════ */}
            {step === "cart" && (
              <div className="space-y-4">
                <h1 className="text-2xl font-extrabold text-bb-ink">Shopping Cart</h1>

                {/* Cart items */}
                <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
                  {items.map((item, idx) => (
                    <div key={item.id} className={`flex gap-4 p-4 ${idx !== 0 ? "border-t" : ""}`}>
                      <div className="h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-bb-surface border">
                        <img
                          src={resolveProductImage(item)}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm leading-snug text-bb-ink">{item.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.variant_name ? "Variant: " + item.variant_name + " • " : ""}Unit price: <span className="font-semibold">${item.price.toFixed(2)}</span></p>
                        {/* Qty stepper — Amazon style */}
                        <div className="flex items-center gap-3 mt-2.5">
                          <div className="flex items-center border rounded-sm overflow-hidden bg-bb-surface">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-muted transition-colors border-r">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-9 text-center text-sm font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="flex h-7 w-7 items-center justify-center text-muted-foreground hover:bg-muted transition-colors border-l">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)}
                            className="text-xs text-red-500 hover:underline font-medium">
                            Remove
                          </button>
                          <button onClick={() => navigate(`/product/${item.product_id || item.id.split("::")[0]}`)}
                            className="text-xs text-primary hover:underline font-medium">
                            View details
                          </button>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-bb-ink">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2"><Tag className="h-4 w-4 text-primary" />Promo / Coupon Code</h3>
                  <div className="flex gap-2">
                    <Input placeholder="Enter code" value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      disabled={couponApplied}
                      className="rounded-sm h-9 uppercase font-mono text-sm max-w-xs" />
                    <Button variant={couponApplied ? "ghost" : "outline"} size="sm"
                      onClick={couponApplied ? () => { setCouponApplied(false); setDiscount(0); setCouponCode(""); } : validateCoupon}
                      disabled={couponLoading || (!couponApplied && !couponCode.trim())}
                      className="rounded-sm h-9 px-5">
                      {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : couponApplied ? "Remove" : "Apply"}
                    </Button>
                  </div>
                  {couponApplied && (
                    <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Coupon applied — you save ${discount.toFixed(2)}
                    </p>
                  )}
                </div>

                {/* ── CHECKOUT PATH SELECTOR — the key Amazon feature ── */}
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b bg-bb-surface">
                    <h3 className="font-bold text-sm text-bb-ink">How would you like to proceed?</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Choose your preferred checkout experience</p>
                  </div>

                  <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
                    {/* Option A — Online checkout */}
                    <button
                      onClick={() => { setPath("online"); setStep("shipping"); }}
                      className={`group flex flex-col items-start gap-3 p-5 text-left transition-all hover:bg-primary/5 ${path === "online" ? "bg-primary/5 ring-2 ring-inset ring-primary" : ""}`}
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-extrabold text-sm text-bb-ink">Proceed to Checkout</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Enter delivery address, choose payment method and place your order securely online.</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {["Cash on Delivery","EcoCash","Paynow","Card"].map(m => (
                          <span key={m} className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{m}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-primary font-bold mt-auto">
                        Continue <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </button>

                    {/* Option B — WhatsApp order */}
                    <button
                      onClick={() => { setPath("whatsapp"); orderViaWhatsApp(); }}
                      className={`group flex flex-col items-start gap-3 p-5 text-left transition-all hover:bg-emerald-50 ${path === "whatsapp" ? "bg-emerald-50" : ""}`}
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-extrabold text-sm text-bb-ink">Order via WhatsApp</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Send your cart directly to our team on WhatsApp. We'll confirm and arrange payment manually.</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {["Instant","No signup needed","Personal service"].map(m => (
                          <span key={m} className="text-[10px] font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-emerald-700">{m}</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold mt-auto">
                        Open WhatsApp <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════
                STEP 2 — DELIVERY ADDRESS
            ════════════════════════════════════════════ */}
            {step === "shipping" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setStep("cart")} className="flex h-8 w-8 items-center justify-center rounded-full border bg-white hover:bg-muted transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <h2 className="text-xl font-extrabold text-bb-ink">Delivery Address</h2>
                </div>

                <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Email *</Label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={shipping.email}
                      onChange={e => setShipping(s => ({ ...s, email: e.target.value }))}
                      className="rounded-sm h-10"
                      aria-invalid={Boolean(shipping.email.trim() && !isValidEmail(shipping.email))}
                    />
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />Order confirmation goes here
                    </p>
                    {shipping.email.trim() && !isValidEmail(shipping.email) && (
                      <p className="text-[10px] text-destructive">Please enter a valid email address.</p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Full Name *</Label>
                      <Input placeholder="John Doe" value={shipping.name}
                        onChange={e => setShipping(s => ({ ...s, name: e.target.value }))} className="rounded-sm h-10" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Phone *</Label>
                      <Input placeholder="+263 77..." value={shipping.phone}
                        onChange={e => setShipping(s => ({ ...s, phone: e.target.value }))} className="rounded-sm h-10" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Street Address *</Label>
                    <Input placeholder="944 New Adylin, Westgate" value={shipping.line1}
                      onChange={e => setShipping(s => ({ ...s, line1: e.target.value }))} className="rounded-sm h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Apt / Suite / Floor (optional)</Label>
                    <Input placeholder="Flat 4B, 2nd floor…" value={shipping.line2}
                      onChange={e => setShipping(s => ({ ...s, line2: e.target.value }))} className="rounded-sm h-10" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* City picker */}
                    <div className="space-y-1.5 relative">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">City *</Label>
                      <button type="button" onClick={() => setCityOpen(!cityOpen)}
                        className="w-full flex items-center justify-between h-10 rounded-sm border bg-white px-3 text-sm hover:border-primary/50 transition-colors">
                        <span className={shipping.city ? "text-foreground" : "text-muted-foreground"}>
                          {shipping.city || "Select city"}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${cityOpen ? "rotate-180" : ""}`} />
                      </button>
                      {cityOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border bg-white shadow-xl z-30 overflow-hidden max-h-48 overflow-y-auto">
                          {ZW_CITIES.map(city => (
                            <button key={city} type="button"
                              onClick={() => { setShipping(s => ({ ...s, city })); setCityOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-bb-surface transition-colors ${shipping.city === city ? "text-primary font-semibold bg-primary/5" : ""}`}>
                              {city}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Country</Label>
                      <Input value="Zimbabwe" readOnly className="rounded-sm h-10 bg-bb-surface text-muted-foreground cursor-not-allowed" />
                    </div>
                  </div>

                  {/* Delivery info banner */}
                  <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
                    <Truck className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
                    <div>
                      <p className="font-semibold">Delivery options available in Harare</p>
                      <p className="text-blue-600 mt-0.5">Delivery timing is confirmed with you after your order is placed.</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full rounded-sm h-12 text-sm font-bold gap-2"
                  disabled={!shippingValid}
                  onClick={prepareCheckout}>
                  Continue to Payment <ChevronRight className="h-4 w-4" />
                </Button>

                {/* WhatsApp escape hatch */}
                <p className="text-center text-xs text-muted-foreground">
                  Prefer to order by phone?{" "}
                  <button onClick={orderViaWhatsApp} className="text-emerald-600 font-semibold hover:underline">
                    Order via WhatsApp instead
                  </button>
                </p>
              </div>
            )}

            {/* ════════════════════════════════════════════
                STEP 3 — PAYMENT
            ════════════════════════════════════════════ */}
            {step === "payment" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <button onClick={() => setStep("shipping")} className="flex h-8 w-8 items-center justify-center rounded-full border bg-white hover:bg-muted transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <h2 className="text-xl font-extrabold text-bb-ink">Payment</h2>
                </div>

                {/* Delivery address summary — Amazon style */}
                <div className="bg-white rounded-2xl border shadow-sm p-4 flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold">{shipping.name}</p>
                      <p className="text-muted-foreground text-xs">{shipping.line1}{shipping.line2 ? `, ${shipping.line2}` : ""}, {shipping.city} · {shipping.phone}</p>
                    </div>
                  </div>
                  <button onClick={() => setStep("shipping")} className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5 shrink-0">
                    <Edit2 className="h-3 w-3" /> Change
                  </button>
                </div>

                {/* Payment methods */}
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                  <div className="px-5 py-3 border-b bg-bb-surface">
                    <h3 className="font-bold text-sm">Select payment method</h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {[
                      {
                        id: "cash_on_delivery" as PaymentMethod,
                        disabled: false,
                        icon: Banknote,
                        iconBg: "bg-amber-100 text-amber-600",
                        label: "Cash on Delivery",
                        sub: "Pay in cash when your order arrives",
                        badge: "Most popular",
                        badgeColor: "bg-primary/10 text-primary",
                      },
                      {
                        id: "paynow_ecocash" as PaymentMethod,
                        icon: Smartphone,
                        iconBg: "bg-red-100 text-red-600",
                        disabled: false,
                        label: "EcoCash",
                        sub: "Instant mobile money payment via EcoCash",
                        badge: "Instant",
                        badgeColor: "bg-emerald-100 text-emerald-700",
                      },
                      {
                        id: "paynow_onemoney" as PaymentMethod,
                        icon: Zap,
                        iconBg: "bg-blue-100 text-blue-600",
                        disabled: false,
                        label: "OneMoney",
                        sub: "Pay instantly via NetOne's OneMoney",
                        badge: "Instant",
                        badgeColor: "bg-emerald-100 text-emerald-700",
                      },
                      {
                        id: "stripe_card" as PaymentMethod,
                        icon: CreditCard,
                        iconBg: "bg-purple-100 text-purple-600",
                        disabled: true,
                        label: "Visa / Mastercard",
                        sub: "Secure card payment (USD)",
                        badge: null,
                        badgeColor: "",
                      },
                    ].map(method => {
                      const Icon = method.icon;
                      const selected = paymentMethod === method.id;
                      return (
                        <label key={method.id}
                          aria-disabled={method.disabled}
                          className={`flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all ${selected ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30 hover:bg-bb-surface"}`}>
                          <input type="radio" name="payment" className="sr-only" checked={selected} disabled={method.disabled}
                            onChange={() => !method.disabled && setPaymentMethod(method.id)} />
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${method.iconBg}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{method.label}</p>
                              {method.disabled ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Coming soon</span>
                              ) : method.badge && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${method.badgeColor}`}>{method.badge}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{method.sub}</p>
                          </div>
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "border-primary" : "border-muted-foreground/30"}`}>
                            {selected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* EcoCash / OneMoney instructions */}
                  {(paymentMethod === "paynow_ecocash" || paymentMethod === "paynow_onemoney") && (
                    <div className="mx-4 mb-4 rounded-xl bg-blue-50 border border-blue-100 p-4 text-xs text-blue-800 space-y-1.5">
                      <p className="font-bold">How it works:</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-700">
                        <li>Place your order below</li>
                        <li>We'll send you a {paymentMethod === "paynow_ecocash" ? "EcoCash" : "OneMoney"} payment request</li>
                        <li>Approve the payment on your phone</li>
                        <li>Your order ships immediately after confirmation</li>
                      </ol>
                    </div>
                  )}

                  {paymentMethod === "stripe_card" && (
                    <div className="mx-4 mb-4 rounded-xl bg-purple-50 border border-purple-100 p-4 text-xs text-purple-800 flex items-start gap-2">
                      <Shield className="h-4 w-4 shrink-0 text-purple-500 mt-0.5" />
                      <p>Card payment is currently handled via our WhatsApp agent for verification. After placing the order, our team will send you a secure payment link.</p>
                    </div>
                  )}
                </div>

                {/* Security note */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Prices verified server-side. Your payment details are never stored by Tech Innovation.</span>
                </div>

                {/* CTA */}
                <div className="space-y-3">
                  <Button className="w-full rounded-sm h-12 text-sm font-bold gap-2 shadow-md"
                    onClick={placeOrder} disabled={loading}>
                    {loading
                      ? <><Loader2 className="h-4 w-4 animate-spin" />Placing order…</>
                      : `Place Order · $${finalTotal.toFixed(2)}`
                    }
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    By placing your order you agree to Tech Innovation's terms of service.
                  </p>

                  {/* WhatsApp escape hatch */}
                  <div className="relative flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground shrink-0">or</span>
                    <Separator className="flex-1" />
                  </div>
                  <Button variant="outline" className="w-full rounded-sm h-11 gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={orderViaWhatsApp}>
                    <MessageCircle className="h-4 w-4" />
                    Order via WhatsApp instead
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── ORDER SUMMARY SIDEBAR ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="bg-bb-surface border-b px-5 py-3">
                <h3 className="font-bold text-sm">Order Summary</h3>
                <p className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</p>
              </div>

              <div className="p-5 space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="h-14 w-14 rounded-xl overflow-hidden bg-bb-surface border">
                          <img
                            src={resolveProductImage(item)}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground">${item.price.toFixed(2)} each</p>
                      </div>
                      <p className="text-sm font-bold shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span><span>${totalPrice.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span className="flex items-center gap-1"><Tag className="h-3 w-3" />Coupon ({couponCode})</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" />Shipping</span>
                    <span>{shippingFee === 0
                      ? <span className="text-emerald-600 font-semibold">FREE</span>
                      : `$${shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-baseline font-extrabold">
                  <span>Order total</span>
                  <span className="text-2xl text-bb-ink">${finalTotal.toFixed(2)}</span>
                </div>

                {/* Free shipping nudge */}
                {totalPrice < 50 && items.length > 0 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex gap-2">
                    <Truck className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                    <span>Add <strong>${(50 - totalPrice).toFixed(2)}</strong> more for <strong>free shipping</strong>!</span>
                  </div>
                )}

                {/* Trust signals — Amazon style */}
                <Separator />
                <div className="space-y-2.5">
                  {[
                    { icon: ShieldCheck, text: "Quality solar & electronics" },
                    { icon: Truck,       text: "Zimbabwe delivery options" },
                    { icon: Clock,       text: "Delivery timing confirmed with you" },
                    { icon: Star,        text: "Warranty varies by product" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

                {/* Payment badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["EcoCash","OneMoney","Visa","Mastercard","Cash"].map(m => (
                    <span key={m} className="text-[9px] font-bold border rounded px-1.5 py-0.5 text-muted-foreground bg-bb-surface">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
