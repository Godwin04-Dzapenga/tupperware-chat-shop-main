// Supabase scheduled edge function — run every hour via pg_cron or Supabase Cron
// Finds carts idle for 2+ hours with items and sends a WhatsApp nudge message

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const ONE_DAY_AGO   = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Find carts idle between 2h and 24h with items, owner has a phone number
    const { data: carts, error } = await supabase
      .from("carts")
      .select("user_id, items, updated_at, profiles(full_name, phone)")
      .lt("updated_at", TWO_HOURS_AGO)
      .gt("updated_at", ONE_DAY_AGO)
      .neq("items", "[]");

    if (error) throw error;
    if (!carts?.length) {
      return new Response(JSON.stringify({ nudged: 0, message: "No abandoned carts" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let nudged = 0;

    for (const cart of carts) {
      const profile = (cart as any).profiles;
      if (!profile?.phone) continue;

      // Check not already nudged today
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", cart.user_id)
        .eq("template", "abandoned_cart")
        .gte("sent_at", ONE_DAY_AGO)
        .maybeSingle();

      if (existing) continue;

      const items = cart.items as any[];
      const firstName = profile.full_name?.split(" ")[0] || "there";
      const itemCount = items.reduce((s: number, i: any) => s + (i.quantity || 1), 0);
      const firstItem = items[0]?.name || "your items";

      const message = encodeURIComponent(
        `Hi ${firstName}! 👋\n\nYou left ${itemCount} item${itemCount !== 1 ? "s" : ""} in your TuppAfrica cart — including *${firstItem}*.\n\nYour cart is saved! Complete your order here:\n🛒 https://tuppafrica.co.zw/checkout\n\nNeed help? Just reply to this message.\n\n— TuppAfrica Team 🇿🇼`
      );

      // WhatsApp Cloud API (or use wa.me link as fallback)
      const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_BUSINESS_TOKEN");
      const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

      if (WHATSAPP_TOKEN && WHATSAPP_PHONE_ID) {
        const phone = profile.phone.replace(/\D/g, "");
        await fetch(`https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${WHATSAPP_TOKEN}` },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phone,
            type: "text",
            text: { body: decodeURIComponent(message) },
          }),
        });
      }

      // Log the nudge
      await supabase.from("notifications").insert({
        user_id: cart.user_id,
        channel: "whatsapp",
        recipient: profile.phone,
        template: "abandoned_cart",
        status: "sent",
      });

      nudged++;
    }

    return new Response(JSON.stringify({ nudged, total_checked: carts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
