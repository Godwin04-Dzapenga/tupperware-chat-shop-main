import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  product_id: string;
  variant_id?: string;
  quantity: number;
}

interface CheckoutPayload {
  items: CartItem[];
  shipping: { name: string; phone: string; line1: string; city: string; country: string };
  payment_method: "cash_on_delivery" | "whatsapp" | "paynow";
  coupon_code?: string;
  notes?: string;
  guest_email?: string;
  guest_name?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

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

    const productIds = [...new Set(items.map(i => i.product_id))];
    const { data: products, error: pErr } = await supabase
      .from("products")
      .select("id, name, price, stock_quantity")
      .in("id", productIds);
    if (pErr || !products) throw new Error("Failed to fetch products");

    const variantIds = [...new Set(items.map(i => i.variant_id).filter((id): id is string => Boolean(id)))];
    const { data: variants, error: vErr } = variantIds.length
      ? await supabase.from("product_variants").select("id, product_id, name, sku, price, stock_quantity, is_active").in("id", variantIds)
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

      let name = product.name;
      let unitPrice = Number(product.price);
      if (item.variant_id) {
        const variant = variantMap[item.variant_id];
        if (!variant || variant.product_id !== product.id || !variant.is_active) throw new Error("Selected product option is unavailable");
        if (variant.stock_quantity < item.quantity) throw new Error('Insufficient stock for "' + product.name + " — " + variant.name + '"');
        name += " — " + variant.name;
        unitPrice = Number(variant.price);
      } else {
        if (product.stock_quantity < item.quantity) throw new Error('Insufficient stock for "' + product.name + '". Available: ' + product.stock_quantity);
      }

      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      orderItems.push({
        product_id: product.id,
        variant_id: item.variant_id ?? null,
        variant_name: item.variant_id ? variantMap[item.variant_id]?.name ?? null : null,
        product_name: name,
        unit_price: unitPrice,
        quantity: item.quantity,
        line_total: lineTotal,
      });
    }

    let discountTotal = 0;
    if (coupon_code) {
      const { data: coupon } = await supabase.from("coupons").select("*").eq("code", coupon_code.toUpperCase()).eq("active", true).maybeSingle();
      if (!coupon) throw new Error("Invalid or expired coupon");
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) throw new Error("Coupon has expired");
      if (coupon.min_order_total && subtotal < coupon.min_order_total) throw new Error("Minimum order of " + coupon.min_order_total + " required for this coupon");
      if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) throw new Error("Coupon usage limit reached");
      discountTotal = coupon.discount_type === "percent" ? (subtotal * coupon.discount_value) / 100 : coupon.discount_value;
      discountTotal = Math.min(discountTotal, subtotal);
      await supabase.from("coupons").update({ times_used: coupon.times_used + 1 }).eq("id", coupon.id);
    }

    const shippingFee = subtotal >= 50 ? 0 : 5;
    const total = subtotal - discountTotal + shippingFee;
    const { data: orderNumData } = await supabase.rpc("generate_order_number");
    const orderNumber = orderNumData as string;

    const { data: order, error: oErr } = await supabase.from("orders").insert({
      order_number: orderNumber, user_id: userId, guest_email: guest_email ?? null, guest_name: guest_name ?? null,
      status: "pending", subtotal, discount_total: discountTotal, shipping_fee: shippingFee, total, currency: "USD",
      shipping_name: shipping.name, shipping_phone: shipping.phone, shipping_line1: shipping.line1,
      shipping_city: shipping.city, shipping_country: shipping.country ?? "Zimbabwe", coupon_code: coupon_code ?? null, notes: notes ?? null,
    }).select().single();
    if (oErr || !order) throw new Error("Order creation failed: " + (oErr?.message || "unknown error"));

    const { error: itemErr } = await supabase.from("order_items").insert(orderItems.map(oi => ({ ...oi, order_id: order.id })));
    if (itemErr) throw new Error("Order items failed: " + itemErr.message);

    for (const item of items) {
      if (item.variant_id) {
        const { error } = await supabase.rpc("decrement_variant_stock", { p_variant_id: item.variant_id, p_quantity: item.quantity });
        if (error) throw new Error("Unable to reserve selected product option");
      } else {
        const { error } = await supabase.rpc("decrement_stock", { p_product_id: item.product_id, p_quantity: item.quantity });
        if (error) throw new Error("Unable to reserve product stock");
      }
    }

    await supabase.from("payments").insert({
      order_id: order.id, provider: payment_method, amount: total,
      status: payment_method === "cash_on_delivery" ? "pending" : "initiated",
    });

    await supabase.from("stock_movements").insert(items.map(item => ({
      product_id: item.product_id, quantity: -item.quantity, movement_type: "out",
      reason: "Order " + orderNumber + (item.variant_id ? " / variant " + item.variant_id : ""), created_by: userId,
    })));

    await supabase.from("audit_log").insert({
      user_id: userId, action: "create", entity: "orders", entity_id: order.id,
      diff: { order_number: orderNumber, total, item_count: items.length },
    });

    const itemsList = orderItems.map(oi => "• " + String(oi.product_name) + " x" + String(oi.quantity) + " — $" + Number(oi.line_total).toFixed(2)).join("\n");
    const waMessage = encodeURIComponent(
      "🛒 *New Order: " + orderNumber + "*\n\n" + itemsList + "\n\n" +
      "Subtotal: $" + subtotal.toFixed(2) + "\n" +
      (discountTotal > 0 ? "Discount: -$" + discountTotal.toFixed(2) + "\n" : "") +
      "Shipping: " + (shippingFee === 0 ? "FREE" : "$" + shippingFee.toFixed(2)) + "\n" +
      "*Total: $" + total.toFixed(2) + "*\n\n" +
      "📦 Ship to: " + shipping.name + ", " + shipping.line1 + ", " + shipping.city + "\n" +
      "📞 " + shipping.phone + "\n" +
      "💳 Payment: " + payment_method.replace(/_/g, " ").toUpperCase()
    );

    return new Response(JSON.stringify({
      success: true, order_id: order.id, order_number: orderNumber, total,
      whatsapp_url: "https://wa.me/2630784721912?text=" + waMessage,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return new Response(JSON.stringify({ success: false, error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400
    });
  }
});
