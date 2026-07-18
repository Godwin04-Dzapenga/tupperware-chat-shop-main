// Triggered via Supabase Database Webhook on products UPDATE
// Fires when stock_quantity drops to or below reorder_level

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json();
    const { record, old_record } = payload;

    // Only fire if stock just crossed below reorder_level
    const reorderLevel = record.reorder_level ?? 5;
    const justHitLow = record.stock_quantity <= reorderLevel && old_record.stock_quantity > reorderLevel;
    if (!justHitLow) {
      return new Response(JSON.stringify({ skipped: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const productName = record.name;
    const currentStock = record.stock_quantity;
    const adminWhatsApp = Deno.env.get("ADMIN_WHATSAPP_NUMBER") || "2630784721912";

    const message = `🚨 *Low Stock Alert — TuppAfrica*\n\n*Product:* ${productName}\n*Current Stock:* ${currentStock} units\n*Reorder Level:* ${reorderLevel} units\n\nPlease restock soon to avoid stockouts.\n\n_TuppAfrica Inventory System_`;

    const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_BUSINESS_TOKEN");
    const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (WHATSAPP_TOKEN && WHATSAPP_PHONE_ID) {
      await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${WHATSAPP_TOKEN}` },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: adminWhatsApp,
          type: "text",
          text: { body: message },
        }),
      });
    }

    // Also log to audit
    await supabase.from("audit_log").insert({
      action: "low_stock_alert",
      entity: "products",
      entity_id: record.id,
      diff: { stock_quantity: currentStock, reorder_level: reorderLevel, product_name: productName },
    });

    return new Response(JSON.stringify({ alerted: true, product: productName, stock: currentStock }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
