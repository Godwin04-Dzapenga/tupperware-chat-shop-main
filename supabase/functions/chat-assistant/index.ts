import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, products } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context about available products
    const productContext = products && products.length > 0 
      ? `\n\nAvailable products:\n${products.map((p: any) => 
          `- ${p.name}: $${p.price.toFixed(2)}${p.description ? ` - ${p.description}` : ''}`
        ).join('\n')}`
      : '';

    const systemPrompt = `You are a helpful TuppAfrica assistant. Your role is to help customers:
- Learn about TuppAfrica products (containers, bottles, lunch boxes, bowls)
- Answer questions about pricing and features
- Guide them on how to order via WhatsApp
- Provide information about delivery options
- Show relevant products when asked (I will display product cards with images automatically when you mention product names)

IMPORTANT: When recommending products:
1. Mention specific product names from the list so I can show their images
2. Describe key features and benefits
3. Be enthusiastic but concise
4. If asked about categories, mention 2-3 specific products

Keep responses friendly, conversational, and helpful (2-3 sentences max). 
When customers want to order, tell them to click the product card or WhatsApp button.
The store's WhatsApp number is +2630784721912.${productContext}`;

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
          ...messages,
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
        fallback: "I'm having trouble connecting right now. Please try asking about our products, pricing, or how to order!"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
