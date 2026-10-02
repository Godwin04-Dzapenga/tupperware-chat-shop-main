import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key",
};

interface CartItem { product_id: string; variant_id?: string; quantity: number; }
interface CheckoutPayload {
  items: CartItem[];
  shipping: { name: string; phone: string; line1: string; city: string; country: string };
  payment_method: "cash_on_delivery" | "whatsapp" | "paynow_ecocash" | "paynow_onemoney" | "stripe_card";
  coupon_code?: string; notes?: string; guest_email?: string; guest_name?: string;
}

const providerFor = (method: CheckoutPayload["payment_method"]) =>
  method === "stripe_card" ? "stripe" :
  method === "paynow_ecocash" || method === "paynow_onemoney" ? "paynow" : method;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { autoRefreshToken: false, persistSession: false } });
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = user?.id ?? null;
    }

    const payload: CheckoutPayload = await req.json();
    const { items, shipping, payment_method, coupon_code, notes, guest_email, guest_name } = payload;
    if (!items?.length) throw new Error("Cart is empty");
    if (!shipping?.name || !shipping?.phone || !shipping?.line1 || !shipping?.city) throw new Error("Shipping details incomplete");

    const idempotencyKey = req.headers.get("idempotency-key") || crypto.randomUUID();
    const productIds = [...new Set(items.map(i => i.product_id))];
    const { data: products, error: pErr } = await supabase.from("products").select("id,name,price,stock_quantity").in("id", productIds);
    if (pErr || !products) throw new Error("Failed to fetch products");
    const variantIds = [...new Set(items.map(i => i.variant_id).filter((id): id is string => Boolean(id)))];
    const { data: variants, error: vErr } = variantIds.length
      ? await supabase.from("product_variants").select("id,product_id,name,sku,price,stock_quantity,is_active").in("id", variantIds)
      : { data: [], error: null };
    if (vErr) throw new Error("Failed to fetch product variants");

    const productMap = Object.fromEntries(products.map(p => [p.id, p]));
    const variantMap = Object.fromEntries((variants || []).map(v => [v.id, v]));
    let subtotal = 0;
    const orderItems: Array<Record<string, unknown>> = [];

    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) throw new Error("Invalid quantity");
      const product = productMap[item.product_id];
      if (!product) throw new Error("Product not found: " + item.product_id);
      let name = product.name, unitPrice = Number(product.price), variantName: string | null = null;
      if (item.variant_id) {
        const variant = variantMap[item.variant_id];
        if (!variant || variant.product_id !== product.id || !variant.is_active) throw new Error("Selected product option is unavailable");
        if (variant.stock_quantity < item.quantity) throw new Error("Insufficient variant stock");
        variantName = variant.name; name += " — " + variant.name; unitPrice = Number(variant.price);
      } else if (product.stock_quantity < item.quantity) throw new Error("Insufficient product stock");
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      orderItems.push({ product_id: product.id, variant_id: item.variant_id ?? null, variant_name: variantName, product_name: name, unit_price: unitPrice, quantity: item.quantity, line_total: lineTotal });
    }

    let discountTotal = 0;
    if (coupon_code) {
      const { data: coupon } = await supabase.from("coupons").select("*").eq("code", coupon_code.toUpperCase()).eq("active", true).maybeSingle();
      if (!coupon) throw new Error("Invalid or expired coupon");
      if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) throw new Error("Coupon is not active yet");
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) throw new Error("Coupon has expired");
      if (coupon.min_order_total && subtotal < coupon.min_order_total) throw new Error("Minimum order of " + coupon.min_order_total + " required");
      if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) throw new Error("Coupon usage limit reached");
      discountTotal = coupon.discount_type === "percent" ? (subtotal * coupon.discount_value) / 100 : coupon.discount_value;
      discountTotal = Math.min(discountTotal, subtotal);
    }

    const shippingFee = subtotal >= 50 ? 0 : 5;
    const total = subtotal - discountTotal + shippingFee;
    const provider = providerFor(payment_method);

    const { data, error } = await supabase.rpc("create_checkout_order", {
      p_idempotency_key: idempotencyKey, p_user_id: userId, p_guest_email: guest_email ?? null, p_guest_name: guest_name ?? null,
      p_guest_phone: shipping.phone, p_shipping_name: shipping.name, p_shipping_phone: shipping.phone, p_shipping_line1: shipping.line1,
      p_shipping_city: shipping.city, p_shipping_country: shipping.country ?? "Zimbabwe", p_subtotal: subtotal, p_discount_total: discountTotal,
      p_shipping_fee: shippingFee, p_total: total, p_currency: "USD", p_coupon_code: coupon_code?.toUpperCase() ?? null,
      p_notes: notes ?? null, p_payment_provider: provider, p_payment_method: payment_method, p_items: orderItems
    });
    if (error || !data) throw new Error(error?.message || "Checkout failed");

    const itemsList = orderItems.map(oi => "• " + String(oi.product_name) + " x" + String(oi.quantity) + " — $" + Number(oi.line_total).toFixed(2)).join("\n");
    const waMessage = encodeURIComponent("🛒 *New Order: " + data.order_number + "*\n\n" + itemsList + "\n\n" +
      "Subtotal: $" + subtotal.toFixed(2) + "\n" + (discountTotal > 0 ? "Discount: -$" + discountTotal.toFixed(2) + "\n" : "") +
      "Shipping: " + (shippingFee === 0 ? "FREE" : "$" + shippingFee.toFixed(2)) + "\n*Total: $" + Number(data.total).toFixed(2) + "*\n\n" +
      "📦 Ship to: " + shipping.name + ", " + shipping.line1 + ", " + shipping.city + "\n📞 " + shipping.phone +
      "\n💳 Payment: " + payment_method.replace(/_/g, " ").toUpperCase());

    return new Response(JSON.stringify({
      success: true, order_id: data.order_id, order_number: data.order_number, total: Number(data.total),
      payment_id: data.payment_id, payment_status: provider === "cash_on_delivery" ? "pending" : "initiated",
      replayed: data.replayed, whatsapp_url: "https://wa.me/263778158984?text=" + waMessage
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return new Response(JSON.stringify({ success: false, error: message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});
