import { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Minus, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  products?: Product[];
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

export const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! 👋 Welcome to TuppAfrica. I'm your TuppAfrica Assistant. How can I help you today? You can type or use voice messages!",
      isBot: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, price, image_url")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setProducts(data);
    }
  };

  const getProductsByKeyword = (text: string) => {
    const lowerText = text.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerText) ||
      p.description?.toLowerCase().includes(lowerText)
    );
  };

  const sendToAI = async (userMessage: string) => {
    setIsLoading(true);
    
    try {
      const conversationHistory = messages
        .slice(-6) // Last 6 messages for context
        .map(m => ({ role: m.isBot ? "assistant" : "user", content: m.text }));
      
      conversationHistory.push({ role: "user", content: userMessage });

      const { data, error } = await supabase.functions.invoke("chat-assistant", {
        body: { 
          messages: conversationHistory,
          products: products.map(p => ({
            name: p.name,
            price: p.price,
            description: p.description
          }))
        }
      });

      if (error) throw error;

      const aiResponse = data.message || data.fallback || "I'm here to help! Ask me about our products.";
      
      // Check if AI mentioned specific products
      const mentionedProducts = getProductsByKeyword(aiResponse);
      
      const botMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse,
        isBot: true,
        products: mentionedProducts.length > 0 && mentionedProducts.length <= 4 ? mentionedProducts : undefined,
      };
      
      setMessages((prev) => [...prev, botMessage]);

      // Play audio response if enabled
      if (audioEnabled) {
        await playTextAsAudio(aiResponse);
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      
      if (error.message?.includes("429") || error.message?.includes("Too many requests")) {
        toast.error("Too many requests. Please wait a moment.");
      } else if (error.message?.includes("402")) {
        toast.error("AI service temporarily unavailable.");
      }
      
      // Fallback response
      const botMessage: Message = {
        id: Date.now().toString(),
        text: "I'm having trouble connecting right now. You can browse our products above or contact us on WhatsApp!",
        isBot: true,
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isBot: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageText = input;
    setInput("");

    await sendToAI(messageText);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success("Recording started...");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Processing audio...");
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        const { data, error } = await supabase.functions.invoke("transcribe-audio", {
          body: { audio: base64Audio }
        });

        if (error) throw error;

        const transcribedText = data.text;
        
        if (transcribedText && transcribedText.trim()) {
          // Add user message with transcribed text
          const userMessage: Message = {
            id: Date.now().toString(),
            text: transcribedText,
            isBot: false,
          };
          setMessages((prev) => [...prev, userMessage]);
          
          // Send to AI
          await sendToAI(transcribedText);
        } else {
          toast.error("Could not understand the audio. Please try again.");
          setIsLoading(false);
        }
      };
    } catch (error: any) {
      console.error("Transcription error:", error);
      toast.error("Failed to transcribe audio. Please try typing instead.");
      setIsLoading(false);
    }
  };

  const playTextAsAudio = async (text: string) => {
    try {
      setIsPlayingAudio(true);
      
      const { data, error } = await supabase.functions.invoke("text-to-speech", {
        body: { text }
      });

      if (error) throw error;

      if (data.audioContent) {
        // Create audio element and play
        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsPlayingAudio(false);
        };
        
        await audio.play();
      }
    } catch (error: any) {
      console.error("TTS Error:", error);
      // Silently fail - audio is optional
      setIsPlayingAudio(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlayingAudio(false);
    }
  };

  const handleProductClick = (product: Product) => {
    const whatsappNumber = "2630784721912";
    const message = encodeURIComponent(
      `Hi! I'd like to order:\n\n${product.name}\nPrice: $${product.price.toFixed(2)}\n\nThank you!`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  if (isDismissed) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed left-4 bottom-4 w-14 h-14 rounded-full shadow-lg z-40 bg-primary hover:bg-primary/90"
          aria-label="Open chat"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={`fixed left-4 bottom-4 w-80 sm:w-96 shadow-xl z-40 flex flex-col bg-card border-border transition-all ${
          isMinimized ? "h-14" : "h-[500px]"
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <h3 className="font-semibold">TuppAfrica Assistant</h3>
            </div>
            <div className="flex gap-1">
              <Button
                onClick={() => {
                  setAudioEnabled(!audioEnabled);
                  if (isPlayingAudio) stopAudio();
                }}
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground"
                title={audioEnabled ? "Disable audio" : "Enable audio"}
              >
                {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                onClick={() => setIsMinimized(!isMinimized)}
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => {
                  setIsOpen(false);
                  setIsDismissed(true);
                  stopAudio();
                }}
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages - Hidden when minimized */}
          {!isMinimized && (
            <>
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id}>
                      <div
                        className={`flex ${message.isBot ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.isBot
                              ? "bg-muted text-foreground"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                        </div>
                      </div>
                      
                      {/* Product Cards */}
                      {message.products && message.products.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.products.map((product) => (
                            <div
                              key={product.id}
                              onClick={() => handleProductClick(product)}
                              className="bg-card border border-border rounded-lg p-2 flex gap-2 cursor-pointer hover:bg-accent transition-colors"
                            >
                              {product.image_url && (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-16 h-16 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-foreground">{product.name}</p>
                                <p className="text-sm text-primary font-bold">${product.price.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">Click to order</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-foreground rounded-lg px-4 py-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type or use voice..."
                    disabled={isLoading || isRecording}
                    className="flex-1"
                  />
                  <Button 
                    onClick={isRecording ? stopRecording : startRecording}
                    size="icon"
                    variant={isRecording ? "destructive" : "outline"}
                    disabled={isLoading}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button 
                    onClick={handleSend} 
                    size="icon"
                    disabled={isLoading || isRecording || !input.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </>
  );
};
