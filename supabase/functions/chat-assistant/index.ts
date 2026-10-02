const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, products } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const productContext = products && products.length > 0
      ? `\n\nAvailable products:\n${products.map((p: any) =>
          `- ${p.name}: $${p.price.toFixed(2)}${p.description ? ` — ${p.description}` : ''}${p.brand ? ` (${p.brand})` : ''}`
        ).join('\n')}`
      : '';

    const systemPrompt = `You are a helpful Tech Innovation assistant for a solar and electronics shop in Zimbabwe. Your role is to help customers:
- Learn about our solar panels, hybrid inverters, lithium batteries, solar kits, and electronics
- Answer questions about pricing, technical specifications, and features
- Help them understand what system size they need
- Guide them on how to order via WhatsApp or the online checkout
- Provide information about delivery and installation options
- Show relevant products when asked (product cards with images are displayed automatically when you mention product names)

IMPORTANT: When recommending products:
1. Mention specific product names from the list so cards can be shown
2. Describe key technical specs (watts, voltage, capacity, warranty)
3. Be enthusiastic but concise (2-3 sentences max)
4. If asked about categories, mention 2-3 specific products

When customers want to order, tell them to click the product card or use our WhatsApp: +263778158984.
Our store handles delivery across Zimbabwe and professional installation is available.${productContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...(messages || []),
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ message: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in chat-assistant:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
        fallback: "I'm having trouble connecting right now. Please ask about our solar panels, inverters, batteries, or call +263778158984!"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
