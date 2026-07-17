import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import logoImage from "@/assets/tuppafrica-logo.jpg";
import {
  ArrowLeft, ShoppingBag, MapPin, CreditCard, CheckCircle2,
  Truck, Tag, MessageCircle, Banknote, Loader2, Shield,
  ChevronRight, Package, Edit2, Phone, User, AlertCircle,
  Minus, Plus, Trash2, Star
} from "lucide-react";

type Step = "review" | "shipping" | "payment" | "confirm";
type PaymentMethod = "cash_on_delivery" | "whatsapp" | "paynow";

interface ShippingForm {
  name: string; phone: string; line1: string; city: string; country: string;
}

const STEPS = [
  { key: "review" as Step,   label: "Review",   icon: ShoppingBag },
  { key: "shipping" as Step, label: "Shipping",  icon: MapPin },
  { key: "payment" as Step,  label: "Payment",   icon: CreditCard },
  { key: "confirm" as Step,  label: "Confirm",   icon: CheckCircle2 },
];

const ZW_CITIES = ["Harare","Bulawayo","Gweru","Mutare","Masvingo","Chinhoyi","Marondera","Kwekwe","Kadoma","Victoria Falls"];

export default function Checkout() {
  const { items, totalPrice, clearCart, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("review");
  const [shipping, setShipping] = useState<ShippingForm>({
    name: user?.user_metadata?.full_name ?? "",
    phone: "", line1: "", city: "Harare", country: "Zimbabwe",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_on_delivery");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [orderResult, setOrderResult] = useState<{ order_number: string; total: number; whatsapp_url: string } | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [cityOpen, setCityOpen] = useState(false);

  const shippingFee = totalPrice - discount >= 50 ? 0 : items.length > 0 ? 5 : 0;
  const finalTotal = totalPrice - discount + shippingFee;
  const currentStepIdx = STEPS.findIndex((s) => s.key === step);

  const shippingValid = shipping.name.trim() && shipping.phone.trim() && shipping.line1.trim() && shipping.city.trim();

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await supabase.from("coupons").select("*").eq("code", couponCode.toUpperCase()).eq("active", true).maybeSingle();
      if (!data) { toast.error("Invalid or expired coupon code"); return; }
      if (data.expires_at && new Date(data.expires_at) < new Date()) { toast.error("This coupon has expired"); return; }
      if (data.min_order_total && totalPrice < data.min_order_total) { toast.error(`Minimum order of $${data.min_order_total} required`); return; }
      const d = data.discount_type === "percent"
        ? Math.min((totalPrice * data.discount_value) / 100, totalPrice)
        : Math.min(data.discount_value, totalPrice);
      setDiscount(d);
      setCouponApplied(true);
      toast.success(`Coupon applied — you save $${d.toFixed(2)}!`);
    } finally { setCouponLoading(false); }
  };

  const placeOrder = async () => {
    if (!user && !guestEmail.trim()) { toast.error("Please enter your email to continue"); return; }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("checkout", {
        body: {
          items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
          shipping,
          payment_method: paymentMethod,
          coupon_code: couponApplied ? couponCode.toUpperCase() : undefined,
          notes: notes || undefined,
          guest_email: !user ? guestEmail : undefined,
          guest_name: !user ? shipping.name : undefined,
        },
      });
      if (res.error || !res.data?.success) throw new Error(res.data?.error || res.error?.message || "Checkout failed");
      clearCart();
      setOrderResult(res.data);
      setStep("confirm");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  };

  if (step === "confirm" && orderResult) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b bg-card px-4 py-3 flex items-center gap-3">
          <img src={logoImage} alt="TuppAfrica" className="h-8 w-auto" />
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md text-center space-y-6">
            <div className="mx-auto h-24 w-24 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Order Placed!</h1>
              <p className="text-muted-foreground mt-1 text-sm">Thank you for shopping with TuppAfrica 🎉</p>
            </div>
            <div className="rounded-2xl border bg-card p-5 text-left space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Order number</span>
                <span className="font-bold text-primary text-sm">{orderResult.order_number}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total paid</span>
                <span className="font-bold text-lg">${orderResult.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending Confirmation</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ships to</span>
                <span className="text-sm font-medium">{shipping.city}, Zimbabwe</span>
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex gap-3 text-left">
              <MessageCircle className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
              <p>Open WhatsApp to confirm your order and arrange payment with our team.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Button size="lg" className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 gap-2"
                onClick={() => window.open(orderResult.whatsapp_url, "_blank")}>
                <MessageCircle className="h-5 w-5" /> Confirm via WhatsApp
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate("/orders")}>
                  <Package className="h-4 w-4 mr-1.5" /> My Orders
                </Button>
                <Button variant="ghost" size="sm" className="rounded-full" onClick={() => navigate("/")}>
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && step !== "confirm") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-5 p-8 text-center bg-background">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-4xl">🛒</div>
        <h2 className="text-2xl font-bold">Your cart is empty</h2>
        <p className="text-muted-foreground text-sm max-w-xs">Add some products to your cart before checking out.</p>
        <Button onClick={() => navigate("/")} className="rounded-full px-8">Browse Products</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/98 backdrop-blur-md shadow-sm">
        <div className="container mx-auto flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Shop
          </Button>
          <div className="h-5 w-px bg-border" />
          <img src={logoImage} alt="TuppAfrica" className="h-8 w-auto" />
          <span className="text-sm font-semibold text-muted-foreground hidden sm:inline">/ Checkout</span>

          {/* Step progress */}
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            {STEPS.map((s, idx) => {
              const done = idx < currentStepIdx;
              const active = idx === currentStepIdx;
              const Icon = s.icon;
              return (
                <div key={s.key} className="flex items-center gap-1 sm:gap-2">
                  <div className={`flex items-center gap-1.5 text-xs font-semibold ${active ? "text-primary" : done ? "text-emerald-600" : "text-muted-foreground/50"}`}>
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all ${active ? "bg-primary text-white shadow-sm" : done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/50"}`}>
                      {done ? "✓" : <Icon className="h-3 w-3" />}
                    </div>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {idx < STEPS.length - 1 && <ChevronRight className={`h-3 w-3 ${idx < currentStepIdx ? "text-emerald-400" : "text-muted-foreground/30"}`} />}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-5">

          {/* ── MAIN COLUMN ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* STEP: REVIEW */}
            {step === "review" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-extrabold">Review your cart</h2>
                  <span className="text-sm text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</span>
                </div>

                <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                  {items.map((item, idx) => (
                    <div key={item.id} className={`flex gap-4 p-4 ${idx !== 0 ? "border-t" : ""}`}>
                      <div className="h-18 w-18 shrink-0 rounded-xl overflow-hidden bg-muted">
                        {item.image_url
                          ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                          : <div className="h-full w-full flex items-center justify-center text-2xl">📦</div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm leading-snug">{item.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">${item.price.toFixed(2)} each</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-0 rounded-full border bg-background">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="rounded-2xl border bg-card p-4 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold flex items-center gap-2"><Tag className="h-4 w-4 text-primary" /> Coupon Code</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. TUPA20"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={couponApplied}
                      className="rounded-full h-9 uppercase font-mono text-sm"
                    />
                    <Button
                      variant={couponApplied ? "ghost" : "outline"}
                      size="sm"
                      onClick={couponApplied ? () => { setCouponApplied(false); setDiscount(0); setCouponCode(""); } : validateCoupon}
                      disabled={couponLoading || (!couponApplied && !couponCode.trim())}
                      className="rounded-full shrink-0 h-9 px-4"
                    >
                      {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : couponApplied ? "Remove" : "Apply"}
                    </Button>
                  </div>
                  {couponApplied && (
                    <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Coupon applied — saving ${discount.toFixed(2)}
                    </p>
                  )}
                </div>

                <Button className="w-full rounded-full h-12 text-sm font-bold shadow-sm gap-2" onClick={() => setStep("shipping")}>
                  Continue to Shipping <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* STEP: SHIPPING */}
            {step === "shipping" && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <button onClick={() => setStep("review")} className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-muted transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <h2 className="text-xl font-extrabold">Shipping details</h2>
                </div>

                <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
                  {!user && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Email address *</Label>
                      <Input type="email" placeholder="you@example.com" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="h-10 rounded-xl" />
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1"><AlertCircle className="h-3 w-3" />Order confirmation will be sent here</p>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" /> Full Name *</Label>
                      <Input placeholder="John Doe" value={shipping.name} onChange={(e) => setShipping((s) => ({ ...s, name: e.target.value }))} className="h-10 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone Number *</Label>
                      <Input placeholder="+263 77..." value={shipping.phone} onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))} className="h-10 rounded-xl" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Street Address *</Label>
                    <Input placeholder="944 New Adylin, Westgate" value={shipping.line1} onChange={(e) => setShipping((s) => ({ ...s, line1: e.target.value }))} className="h-10 rounded-xl" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 relative">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">City *</Label>
                      <button
                        type="button"
                        onClick={() => setCityOpen(!cityOpen)}
                        className="w-full flex items-center justify-between h-10 rounded-xl border bg-background px-3 text-sm hover:border-primary/50 transition-colors"
                      >
                        <span className={shipping.city ? "text-foreground" : "text-muted-foreground"}>{shipping.city || "Select city"}</span>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${cityOpen ? "rotate-90" : ""}`} />
                      </button>
                      {cityOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border bg-card shadow-lg z-20 overflow-hidden">
                          {ZW_CITIES.map((city) => (
                            <button key={city} type="button"
                              onClick={() => { setShipping((s) => ({ ...s, city })); setCityOpen(false); }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${shipping.city === city ? "text-primary font-semibold bg-primary/5" : ""}`}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Country</Label>
                      <Input value={shipping.country} readOnly className="h-10 rounded-xl bg-muted/40 text-muted-foreground cursor-not-allowed" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Delivery Notes (optional)</Label>
                    <Textarea placeholder="Gate code, landmark, or special instructions…" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="rounded-xl resize-none text-sm" />
                  </div>
                </div>

                <Button
                  className="w-full rounded-full h-12 text-sm font-bold shadow-sm gap-2"
                  disabled={!shippingValid || (!user && !guestEmail)}
                  onClick={() => setStep("payment")}
                >
                  Continue to Payment <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* STEP: PAYMENT */}
            {step === "payment" && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <button onClick={() => setStep("shipping")} className="flex h-8 w-8 items-center justify-center rounded-full border hover:bg-muted transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <h2 className="text-xl font-extrabold">Payment method</h2>
                </div>

                {/* Shipping summary */}
                <div className="rounded-2xl border bg-card p-4 shadow-sm flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold">{shipping.name}</p>
                      <p className="text-muted-foreground text-xs">{shipping.line1}, {shipping.city} · {shipping.phone}</p>
                    </div>
                  </div>
                  <button onClick={() => setStep("shipping")} className="text-xs text-primary font-semibold flex items-center gap-0.5 shrink-0 hover:underline">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                </div>

                {/* Payment options */}
                <div className="space-y-3">
                  {[
                    { id: "cash_on_delivery" as PaymentMethod, icon: Banknote, label: "Cash on Delivery", sub: "Pay when your order arrives at your door", badge: "Most popular" },
                    { id: "whatsapp" as PaymentMethod, icon: MessageCircle, label: "WhatsApp Order", sub: "Confirm order and arrange payment via WhatsApp", badge: null },
                    { id: "paynow" as PaymentMethod, icon: Shield, label: "Paynow / EcoCash", sub: "Instant mobile payment — EcoCash, OneMoney, Visa", badge: "Instant" },
                  ].map((method) => {
                    const Icon = method.icon;
                    const selected = paymentMethod === method.id;
                    return (
                      <button key={method.id} type="button" onClick={() => setPaymentMethod(method.id)}
                        className={`w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-150 ${selected ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/30 hover:bg-muted/30"}`}
                      >
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${selected ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{method.label}</p>
                            {method.badge && <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${selected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>{method.badge}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{method.sub}</p>
                        </div>
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selected ? "border-primary" : "border-muted-foreground/30"}`}>
                          {selected && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Security note */}
                <div className="flex items-center gap-2.5 rounded-xl bg-muted/50 border border-border/50 p-3 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  <span>Your order is secure. Prices are verified server-side — no payment info is stored by us.</span>
                </div>

                <Button className="w-full rounded-full h-12 text-sm font-bold shadow-sm gap-2" onClick={placeOrder} disabled={loading}>
                  {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Placing order…</>) : (`Place Order · $${finalTotal.toFixed(2)}`)}
                </Button>
              </div>
            )}
          </div>

          {/* ── ORDER SUMMARY SIDEBAR ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 rounded-2xl border bg-card shadow-sm overflow-hidden">
              <div className="bg-muted/40 border-b px-5 py-4">
                <h3 className="font-bold text-sm">Order Summary</h3>
                <p className="text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</p>
              </div>

              <div className="p-5 space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted">
                          {item.image_url
                            ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                            : <div className="h-full w-full flex items-center justify-center text-lg">📦</div>
                          }
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center min-w-[18px] min-h-[18px] px-1">
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
                      <span className="flex items-center gap-1"><Tag className="h-3 w-3" /> Discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Shipping</span>
                    <span>{shippingFee === 0
                      ? <span className="text-emerald-600 font-semibold">FREE</span>
                      : `$${shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center font-extrabold">
                  <span className="text-base">Total</span>
                  <span className="text-xl text-primary">${finalTotal.toFixed(2)}</span>
                </div>

                {totalPrice < 50 && items.length > 0 && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 flex gap-2">
                    <Truck className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                    <span>Add <strong>${(50 - totalPrice).toFixed(2)}</strong> more to get <strong>free shipping!</strong></span>
                  </div>
                )}

                <div className="space-y-2">
                  {[
                    { icon: ShieldCheck, text: "100% genuine Tupperware products" },
                    { icon: Truck, text: "Harare same-day or next-day delivery" },
                    { icon: Star, text: "Lifetime warranty on all products" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.text} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{item.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
