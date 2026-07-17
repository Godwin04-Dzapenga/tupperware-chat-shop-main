import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Package, MessageCircle, Clock, CheckCircle2, Truck, XCircle, RotateCcw, ShoppingBag } from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  discount_total: number;
  shipping_fee: number;
  currency: string;
  shipping_name: string;
  shipping_line1: string;
  shipping_city: string;
  notes: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:    { label: "Pending",    color: "bg-amber-100 text-amber-700",    icon: Clock },
  confirmed:  { label: "Confirmed",  color: "bg-blue-100 text-blue-700",      icon: CheckCircle2 },
  processing: { label: "Processing", color: "bg-purple-100 text-purple-700",  icon: Package },
  shipped:    { label: "Shipped",    color: "bg-cyan-100 text-cyan-700",      icon: Truck },
  delivered:  { label: "Delivered",  color: "bg-emerald-100 text-emerald-700",icon: CheckCircle2 },
  cancelled:  { label: "Cancelled",  color: "bg-red-100 text-red-700",        icon: XCircle },
  refunded:   { label: "Refunded",   color: "bg-slate-100 text-slate-700",    icon: RotateCcw },
};

const STATUS_STEPS = ["pending", "confirmed", "processing", "shipped", "delivered"];

export default function Orders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    fetchOrders();

    // Realtime subscription for order status updates
    const channel = supabase
      .channel("orders-realtime")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "orders",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setOrders((prev) =>
          prev.map((o) => o.id === payload.new.id ? { ...o, ...(payload.new as any) } : o)
        );
        toast.info(`Order ${payload.new.order_number} updated to "${payload.new.status}"`);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, authLoading]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`*, order_items(*)`)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (err: any) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const buildWhatsAppUrl = (order: Order) => {
    const msg = encodeURIComponent(
      `Hi! I'd like to follow up on my order *${order.order_number}*.\n\nCurrent status: ${order.status}\nTotal: $${order.total.toFixed(2)}\n\nThank you!`
    );
    return `https://wa.me/2630784721912?text=${msg}`;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Shop
          </Button>
          <div>
            <h1 className="text-lg font-bold">My Orders</h1>
            <p className="text-xs text-muted-foreground">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30" />
            <h2 className="text-xl font-bold text-muted-foreground">No orders yet</h2>
            <Button onClick={() => navigate("/")} className="rounded-full">Start Shopping</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const isExpanded = expandedId === order.id;
              const stepIdx = STATUS_STEPS.indexOf(order.status);
              const isTerminal = ["cancelled", "refunded"].includes(order.status);

              return (
                <div key={order.id} className="rounded-2xl border bg-card overflow-hidden shadow-sm">
                  {/* Order header */}
                  <button
                    className="w-full flex items-start gap-4 p-5 text-left hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cfg.color}`}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-primary">{order.order_number}</span>
                        <Badge className={`${cfg.color} border-0 text-xs`}>{cfg.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}
                        {order.order_items?.length} item{order.order_items?.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{order.currency}</p>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t px-5 pb-5 space-y-5">
                      {/* Status tracker */}
                      {!isTerminal && (
                        <div className="pt-4">
                          <div className="flex items-center gap-0">
                            {STATUS_STEPS.map((s, idx) => {
                              const done = idx <= stepIdx;
                              const active = idx === stepIdx;
                              return (
                                <div key={s} className="flex items-center flex-1">
                                  <div className="flex flex-col items-center gap-1">
                                    <div className={`h-3 w-3 rounded-full border-2 transition-all ${done ? "border-primary bg-primary" : "border-muted-foreground/30 bg-background"} ${active ? "ring-4 ring-primary/20" : ""}`} />
                                    <span className={`text-[9px] font-semibold capitalize ${done ? "text-primary" : "text-muted-foreground"}`}>
                                      {s}
                                    </span>
                                  </div>
                                  {idx < STATUS_STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 mb-3 ${idx < stepIdx ? "bg-primary" : "bg-muted"}`} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Items */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items</h4>
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm border rounded-lg p-3">
                            <span className="font-medium">{item.product_name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                            <span className="font-bold">${item.line_total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Totals */}
                      <div className="space-y-1.5 text-sm border-t pt-3">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span>
                        </div>
                        {order.discount_total > 0 && (
                          <div className="flex justify-between text-emerald-600">
                            <span>Discount</span><span>-${order.discount_total.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-muted-foreground">
                          <span>Shipping</span>
                          <span>{order.shipping_fee === 0 ? <span className="text-emerald-600">FREE</span> : `$${order.shipping_fee.toFixed(2)}`}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base border-t pt-2">
                          <span>Total</span><span className="text-primary">${order.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Shipping address */}
                      <div className="text-sm bg-muted/40 rounded-xl p-3">
                        <p className="font-semibold mb-0.5">Shipping to:</p>
                        <p className="text-muted-foreground">{order.shipping_name} · {order.shipping_line1}, {order.shipping_city}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          className="rounded-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => window.open(buildWhatsAppUrl(order), "_blank")}
                        >
                          <MessageCircle className="h-4 w-4" /> Follow Up on WhatsApp
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
