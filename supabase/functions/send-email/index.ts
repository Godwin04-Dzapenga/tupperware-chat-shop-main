import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string;
  order_number: string;
  customer_name: string;
  items: { name: string; quantity: number; unit_price: number; line_total: number }[];
  subtotal: number;
  discount_total: number;
  shipping_fee: number;
  total: number;
  shipping_city: string;
  shipping_line1: string;
  payment_method: string;
}

function buildHtml(d: EmailPayload): string {
  const rows = d.items.map(i => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#1a1a2e">${i.name}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#666;text-align:center">${i.quantity}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;font-weight:600;color:#1a1a2e;text-align:right">$${i.line_total.toFixed(2)}</td>
    </tr>`).join("");

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Order Confirmed</title></head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:'Helvetica Neue',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:32px 0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
<tr><td style="background:linear-gradient(135deg,#0d9488,#06b6d4);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center">
  <h1 style="margin:0;font-size:28px;font-weight:800;color:#fff">TuppAfrica</h1>
  <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.8);letter-spacing:2px;text-transform:uppercase">Zimbabwe's Premium Kitchen Store</p>
</td></tr>
<tr><td style="background:#fff;padding:40px">
  <div style="text-align:center;margin-bottom:28px">
    <div style="font-size:48px;margin-bottom:8px">✅</div>
    <h2 style="margin:0;font-size:22px;font-weight:700;color:#1a1a2e">Order Confirmed!</h2>
    <p style="margin:6px 0 0;color:#666;font-size:14px">Hi ${d.customer_name}, thanks for your order.</p>
  </div>
  <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:16px;margin-bottom:24px;text-align:center">
    <p style="margin:0;font-size:11px;color:#0d9488;font-weight:700;text-transform:uppercase;letter-spacing:1px">Order Number</p>
    <p style="margin:4px 0 0;font-size:26px;font-weight:800;color:#0f766e">${d.order_number}</p>
  </div>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0f0f0;border-radius:10px;overflow:hidden;margin-bottom:20px">
    <tr style="background:#f8fafc">
      <th style="padding:10px 16px;font-size:11px;color:#666;text-align:left;font-weight:600;text-transform:uppercase">Item</th>
      <th style="padding:10px 16px;font-size:11px;color:#666;text-align:center;font-weight:600;text-transform:uppercase">Qty</th>
      <th style="padding:10px 16px;font-size:11px;color:#666;text-align:right;font-weight:600;text-transform:uppercase">Total</th>
    </tr>${rows}
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
    <tr><td style="padding:4px 0;font-size:14px;color:#666">Subtotal</td><td style="padding:4px 0;font-size:14px;color:#1a1a2e;text-align:right">$${d.subtotal.toFixed(2)}</td></tr>
    ${d.discount_total > 0 ? `<tr><td style="padding:4px 0;font-size:14px;color:#059669">Discount</td><td style="padding:4px 0;font-size:14px;color:#059669;text-align:right">-$${d.discount_total.toFixed(2)}</td></tr>` : ""}
    <tr><td style="padding:4px 0;font-size:14px;color:#666">Shipping</td><td style="padding:4px 0;font-size:14px;color:#1a1a2e;text-align:right">${d.shipping_fee === 0 ? '<span style="color:#059669;font-weight:600">FREE</span>' : `$${d.shipping_fee.toFixed(2)}`}</td></tr>
    <tr><td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#1a1a2e;border-top:2px solid #f0f0f0">Total</td><td style="padding:12px 0 0;font-size:20px;font-weight:800;color:#0d9488;text-align:right;border-top:2px solid #f0f0f0">$${d.total.toFixed(2)}</td></tr>
  </table>
  <div style="background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:24px">
    <p style="margin:0 0 6px;font-size:11px;color:#0d9488;font-weight:700;text-transform:uppercase;letter-spacing:1px">📦 Shipping To</p>
    <p style="margin:0;font-size:14px;color:#1a1a2e">${d.shipping_line1}, ${d.shipping_city}, Zimbabwe</p>
    <p style="margin:4px 0 0;font-size:13px;color:#666">Payment: ${d.payment_method.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
  </div>
  <div style="text-align:center">
    <a href="https://wa.me/2630784721912" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:14px 36px;border-radius:50px;font-size:15px;font-weight:700">💬 Confirm on WhatsApp</a>
  </div>
</td></tr>
<tr><td style="background:#0f172a;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center">
  <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.6)">TuppAfrica — 944 New Adylin, Westgate, Harare</p>
  <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.3)">© ${new Date().getFullYear()} Oasis Sales Zimbabwe</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const payload: EmailPayload = await req.json();

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ sent: false, reason: "no_api_key" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "TuppAfrica <orders@tuppafrica.co.zw>",
        to: [payload.to],
        subject: `✅ Order Confirmed — ${payload.order_number}`,
        html: buildHtml(payload),
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Resend error");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await supabase.from("notifications").insert({ channel: "email", recipient: payload.to, template: "order_confirmation", status: "sent" });

    return new Response(JSON.stringify({ sent: true, id: data.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ sent: false, error: err.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});
