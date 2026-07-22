import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MessageCircle, X, Send, Minimize2, Mic, MicOff, Volume2, VolumeX, ShoppingCart, ArrowRight, Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  products?: SuggestedProduct[];
  timestamp: Date;
}

interface SuggestedProduct {
  id: string; name: string; price: number; image_url: string | null;
}

const WELCOME = "Hi! 👋 I'm Tuppie, your TuppAfrica shopping assistant. I can help you find products, check prices, and answer questions. What are you looking for today?";
const QUICK_REPLIES = ["Show all products", "What's on sale?", "Delivery info", "Contact us"];

export const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", text: WELCOME, isBot: true, timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const [recording, setRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [hasShownNudge, setHasShownNudge] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Auto-nudge after 30s
  useEffect(() => {
    if (hasShownNudge) return;
    const t = setTimeout(() => {
      if (!open) {
        setUnread(1);
        setHasShownNudge(true);
      }
    }, 30000);
    return () => clearTimeout(t);
  }, [open, hasShownNudge]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, minimized]);

  const addMessage = useCallback((text: string, isBot: boolean, products?: SuggestedProduct[]) => {
    const msg: Message = { id: Date.now().toString(), text, isBot, products, timestamp: new Date() };
    setMessages(prev => [...prev, msg]);
    if (isBot && !open) setUnread(n => n + 1);
    return msg;
  }, [open]);

  const sendMessage = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");
    addMessage(content, false);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-assistant", {
        body: { message: content },
      });
      if (error) throw error;

      const botText = data?.response || data?.message || "Sorry, I didn't catch that. Can you rephrase?";
      const products = data?.products || [];
      addMessage(botText, true, products.length > 0 ? products : undefined);

      if (ttsEnabled && data?.response) {
        speakText(data.response);
      }
    } catch (err) {
      addMessage("Sorry, I'm having trouble connecting right now. Please try WhatsApp for immediate help!", true);
    } finally {
      setLoading(false);
    }
  };

  const speakText = async (text: string) => {
    try {
      const { data } = await supabase.functions.invoke("text-to-speech", { body: { text } });
      if (data?.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audio.play();
      }
    } catch { /* silent */ }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          try {
            const { data } = await supabase.functions.invoke("transcribe-audio", { body: { audio: base64 } });
            if (data?.text) { setInput(data.text); }
          } catch { toast.error("Couldn't transcribe audio"); }
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch { toast.error("Microphone access denied"); }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const handleOpen = () => {
    setOpen(true);
    setMinimized(false);
    setUnread(0);
  };

  const fmtTime = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* ── FLOATING BUTTON ── */}
      {!open && (
        <div className="fixed left-4 bottom-6 z-50">
          <button
            onClick={handleOpen}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl transition-all hover:scale-110 active:scale-95"
            style={{ boxShadow: "0 4px 24px hsl(180 65% 45% / 0.45)" }}
            aria-label="Open chat"
          >
            <MessageCircle className="h-6 w-6" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow">
                {unread}
              </span>
            )}
          </button>
          {/* Pulse */}
          <div className="pointer-events-none absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />

          {/* Tooltip nudge */}
          {unread > 0 && (
            <div className="absolute bottom-16 left-0 w-52 rounded-xl bg-white p-3 shadow-xl border text-xs text-[#1c1c1c] font-medium">
              <div className="flex items-center gap-2 mb-1">
                <Bot className="h-4 w-4 text-primary shrink-0"/>
                <span className="font-bold text-primary">Tuppie</span>
              </div>
              Need help finding the right product? I'm here! 👋
              <div className="absolute -bottom-1.5 left-5 h-3 w-3 rotate-45 bg-white border-r border-b"/>
            </div>
          )}
        </div>
      )}

      {/* ── CHAT WINDOW ── */}
      {open && (
        <div
          className={`fixed left-4 bottom-6 z-50 flex flex-col rounded-2xl bg-white shadow-2xl border overflow-hidden transition-all duration-300 ${minimized ? "h-14 w-72" : "h-[480px] w-80 sm:w-96"}`}
          style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-primary px-4 py-3 shrink-0">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white">
                <Bot className="h-5 w-5" />
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-primary"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">Tuppie</p>
              <p className="text-[10px] text-white/70 mt-0.5">TuppAfrica Assistant · Online</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTtsEnabled(e => !e)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/20 transition-colors"
                title={ttsEnabled ? "Mute" : "Enable voice"}
              >
                {ttsEnabled ? <Volume2 className="h-3.5 w-3.5"/> : <VolumeX className="h-3.5 w-3.5"/>}
              </button>
              <button onClick={() => setMinimized(m => !m)} className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/20 transition-colors">
                <Minimize2 className="h-3.5 w-3.5"/>
              </button>
              <button onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:bg-white/20 transition-colors">
                <X className="h-3.5 w-3.5"/>
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#f8f8f8]">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex gap-2 ${msg.isBot ? "justify-start" : "justify-end"}`}>
                    {msg.isBot && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white mt-auto">
                        <Bot className="h-3.5 w-3.5"/>
                      </div>
                    )}
                    <div className={`max-w-[78%] space-y-2`}>
                      <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                        msg.isBot
                          ? "bg-white text-[#1c1c1c] rounded-tl-sm"
                          : "bg-primary text-white rounded-tr-sm"
                      }`}>
                        {msg.text}
                        <span className={`block text-[9px] mt-1 ${msg.isBot ? "text-muted-foreground" : "text-white/60"}`}>
                          {fmtTime(msg.timestamp)}
                        </span>
                      </div>

                      {/* Product suggestions */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="space-y-2">
                          {msg.products.slice(0, 3).map(p => (
                            <div key={p.id} className="flex gap-2.5 rounded-xl bg-white border p-2.5 shadow-sm">
                              {p.image_url && (
                                <img src={p.image_url} alt={p.name} className="h-12 w-12 rounded-lg object-cover shrink-0 bg-muted"/>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold line-clamp-1">{p.name}</p>
                                <p className="text-xs font-bold text-primary mt-0.5">${p.price.toFixed(2)}</p>
                                <div className="flex gap-1.5 mt-1.5">
                                  <button
                                    onClick={() => { addToCart(p as any); toast.success(`${p.name} added!`); }}
                                    className="flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold hover:bg-primary hover:text-white transition-colors"
                                  >
                                    <ShoppingCart className="h-2.5 w-2.5"/>Cart
                                  </button>
                                  <button
                                    onClick={() => { setOpen(false); navigate(`/product/${p.id}`); }}
                                    className="flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-semibold hover:bg-foreground hover:text-background transition-colors"
                                  >
                                    View
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {!msg.isBot && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted mt-auto">
                        <User className="h-3.5 w-3.5 text-muted-foreground"/>
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2 justify-start">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white mt-auto">
                      <Bot className="h-3.5 w-3.5"/>
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-1">
                        {[0,1,2].map(i => (
                          <div key={i} className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}/>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef}/>
              </div>

              {/* Quick replies */}
              {messages.length <= 2 && (
                <div className="flex gap-1.5 overflow-x-auto px-4 py-2 bg-white border-t scrollbar-hide">
                  {QUICK_REPLIES.map(r => (
                    <button key={r} onClick={() => sendMessage(r)}
                      className="shrink-0 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary hover:bg-primary hover:text-white transition-colors whitespace-nowrap">
                      {r}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="flex items-center gap-2 border-t bg-white px-3 py-2.5">
                <button
                  onClick={recording ? stopRecording : startRecording}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${recording ? "bg-red-500 text-white animate-pulse" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
                  title={recording ? "Stop recording" : "Voice input"}
                >
                  {recording ? <MicOff className="h-3.5 w-3.5"/> : <Mic className="h-3.5 w-3.5"/>}
                </button>

                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder={recording ? "Listening…" : "Ask Tuppie anything…"}
                  disabled={loading || recording}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
                />

                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Send className="h-3.5 w-3.5"/>}
                </button>
              </div>

              {/* Footer */}
              <div className="bg-white px-4 py-1.5 border-t text-center">
                <p className="text-[9px] text-muted-foreground/60">
                  Powered by TuppAfrica AI · <a href="https://wa.me/2630784721912" target="_blank" rel="noreferrer" className="text-emerald-600 font-semibold hover:underline">Switch to WhatsApp</a>
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
