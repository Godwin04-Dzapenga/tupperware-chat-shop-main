import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Search, Package, Clock, CheckCircle2, Truck, XCircle, RotateCcw, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";

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
  shipping_name: string | null;
  shipping_phone: string | null;
  shipping_line1: string | null;
  shipping_city: string | null;
  coupon_code: string | null;
  notes: string | null;
  created_at: string;
  order_items: OrderItem[];
  payments: { provider: string; status: string }[];
}

const STATUS_OPTIONS = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-amber-100 text-amber-700",
  confirmed:  "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700",
  shipped:    "bg-cyan-100 text-cyan-700",
  delivered:  "bg-emerald-100 text-emerald-700",
  cancelled:  "bg-red-100 text-red-700",
  refunded:   "bg-slate-100 text-slate-700",
};

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();

    // Realtime for new orders
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        toast.info(`New order received: ${payload.new.order_number}`);
        fetchOrders();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select(`*, order_items(*), payments(provider, status)`)
      .order("created_at", { ascending: false });

    if (error) { toast.error("Failed to load orders"); return; }
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) { toast.error("Failed to update status"); }
    else {
      toast.success(`Order updated to "${newStatus}"`);
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));

      // Audit log
      await supabase.from("audit_log").insert({
        action: "update_status",
        entity: "orders",
        entity_id: orderId,
        diff: { status: newStatus },
      });
    }
    setUpdatingId(null);
  };

  const filtered = orders.filter((o) => {
    const matchesSearch =
      search === "" ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.shipping_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.shipping_phone?.includes(search);
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    today: orders.filter((o) => new Date(o.created_at).toDateString() === new Date().toDateString()).length,
    revenue: orders.filter((o) => o.status === "delivered").reduce((s, o) => s + o.total, 0),
  };

  if (loading) return <div className="py-20 text-center text-muted-foreground">Loading orders…</div>;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total Orders", value: stats.total, icon: Package },
          { label: "Pending", value: stats.pending, icon: Clock, highlight: stats.pending > 0 },
          { label: "Today", value: stats.today, icon: CheckCircle2 },
          { label: "Revenue (Delivered)", value: `$${stats.revenue.toFixed(2)}`, icon: Truck },
        ].map((s) => (
          <Card key={s.label} className={s.highlight ? "border-amber-300 bg-amber-50" : ""}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className={`text-2xl font-extrabold mt-0.5 ${s.highlight ? "text-amber-600" : "text-foreground"}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search order #, name, phone…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders table */}
      <Card>
        <CardContent className="p-0">
          <div className="rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((order) => (
                  <>
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    >
                      <TableCell className="font-bold text-primary">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{order.shipping_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{order.shipping_phone || ""}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{order.order_items?.length ?? 0} item{order.order_items?.length !== 1 ? "s" : ""}</span>
                      </TableCell>
                      <TableCell className="font-bold">${order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className="text-xs capitalize text-muted-foreground">
                          {order.payments?.[0]?.provider?.replace(/_/g, " ") || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(v) => { updateStatus(order.id, v); }}
                          disabled={updatingId === order.id}
                        >
                          <SelectTrigger className={`h-7 text-xs w-32 border-0 ${STATUS_COLORS[order.status] ?? ""} font-semibold`} onClick={(e) => e.stopPropagation()}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => (
                              <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </TableCell>
                      <TableCell>
                        {expandedId === order.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                    </TableRow>

                    {/* Expanded detail row */}
                    {expandedId === order.id && (
                      <TableRow key={`${order.id}-detail`} className="bg-muted/10">
                        <TableCell colSpan={8} className="p-4">
                          <div className="grid gap-4 md:grid-cols-3">
                            {/* Items */}
                            <div className="md:col-span-2 space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items</p>
                              {order.order_items?.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm border rounded-lg p-2.5 bg-card">
                                  <span className="font-medium">{item.product_name} <span className="text-muted-foreground">×{item.quantity}</span></span>
                                  <span className="font-bold">${item.line_total.toFixed(2)}</span>
                                </div>
                              ))}
                              <div className="space-y-1 text-sm pt-2 border-t">
                                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
                                {order.discount_total > 0 && <div className="flex justify-between text-emerald-600"><span>Discount ({order.coupon_code})</span><span>-${order.discount_total.toFixed(2)}</span></div>}
                                <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{order.shipping_fee === 0 ? "FREE" : `$${order.shipping_fee.toFixed(2)}`}</span></div>
                                <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span className="text-primary">${order.total.toFixed(2)}</span></div>
                              </div>
                            </div>

                            {/* Shipping + actions */}
                            <div className="space-y-3">
                              <div className="bg-card rounded-xl p-3 space-y-1 border text-sm">
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Ship to</p>
                                <p className="font-semibold">{order.shipping_name}</p>
                                <p className="text-muted-foreground">{order.shipping_phone}</p>
                                <p className="text-muted-foreground">{order.shipping_line1}, {order.shipping_city}</p>
                                {order.notes && <p className="text-muted-foreground italic">Note: {order.notes}</p>}
                              </div>
                              <Button
                                size="sm"
                                className="w-full rounded-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => {
                                  const msg = encodeURIComponent(`Hi ${order.shipping_name}! Your TuppAfrica order *${order.order_number}* is now *${order.status}*. Total: $${order.total.toFixed(2)}. Thank you for shopping with us! 🛍️`);
                                  window.open(`https://wa.me/${order.shipping_phone?.replace(/\D/g, "")}?text=${msg}`, "_blank");
                                }}
                              >
                                <MessageCircle className="h-4 w-4" /> WhatsApp Customer
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
