import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, CheckCircle2, CreditCard, DollarSign, Package, ShoppingBag, Users } from "lucide-react";

interface OrderRow { id: string; order_number: string; status: string; total: number; created_at: string; shipping_name: string | null; }
interface PaymentRow { id: string; status: string; amount: number; provider: string; }
interface ProductRow { id: string; name: string; stock_quantity: number; reorder_level: number; price: number; is_active: boolean; }
interface OverviewData {
  orders: OrderRow[];
  payments: PaymentRow[];
  products: ProductRow[];
  customerCount: number;
  categoryCount: number;
}

const statusLabel = (status: string) => status.replace(/_/g, " ").replace(/\\b\\w/g, c => c.toUpperCase());
const money = (value: number) => "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function AdminOverview({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [orders, payments, products, profiles, categories] = await Promise.all([
        supabase.from("orders").select("id, order_number, status, total, created_at, shipping_name").order("created_at", { ascending: false }).limit(8),
        supabase.from("payments").select("id, status, amount, provider").order("id", { ascending: false }).limit(100),
        supabase.from("products").select("id, name, stock_quantity, reorder_level, price, is_active").order("stock_quantity", { ascending: true }).limit(100),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
      ]);
      const firstError = orders.error || payments.error || products.error || profiles.error || categories.error;
      if (firstError) throw firstError;
      setData({
        orders: orders.data || [],
        payments: payments.data || [],
        products: products.data || [],
        customerCount: profiles.count || 0,
        categoryCount: categories.count || 0,
      });
    } catch (err: any) {
      setError(err?.message || "Unable to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const channel = supabase.channel("admin-overview")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "payments" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading admin dashboard…</div>;
  if (error || !data) return (
    <Card><CardContent className="py-10 text-center space-y-3">
      <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
      <p className="text-sm text-muted-foreground">{error || "Dashboard data unavailable"}</p>
      <Button size="sm" variant="outline" onClick={load}>Retry</Button>
    </CardContent></Card>
  );

  const deliveredRevenue = data.orders.filter(o => o.status === "delivered").reduce((sum, o) => sum + Number(o.total), 0);
  const pendingOrders = data.orders.filter(o => o.status === "pending").length;
  const awaitingPayments = data.payments.filter(p => ["initiated", "pending"].includes(p.status)).length;
  const failedPayments = data.payments.filter(p => ["failed", "cancelled", "expired"].includes(p.status)).length;
  const lowStock = data.products.filter(p => Number(p.stock_quantity) <= Number(p.reorder_level) && Number(p.stock_quantity) > 0);
  const outOfStock = data.products.filter(p => Number(p.stock_quantity) === 0);

  const healthItems = [
    { label: "Products database", ok: data.products.length > 0, detail: `${data.products.length} products` },
    { label: "Categories database", ok: data.categoryCount > 0, detail: `${data.categoryCount} categories` },
    { label: "Orders database", ok: true, detail: `${data.orders.length} recent orders loaded` },
    { label: "Payments database", ok: true, detail: `${data.payments.length} payment records loaded` },
    { label: "Customer profiles", ok: true, detail: `${data.customerCount} profiles` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold">Store Control Center</h2>
          <p className="text-sm text-muted-foreground">Live operational view of products, orders, payments, customers and inventory.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>Refresh data</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Delivered revenue", value: money(deliveredRevenue), icon: DollarSign, action: "orders" },
          { title: "Pending orders", value: pendingOrders, icon: ShoppingBag, action: "orders" },
          { title: "Awaiting payment", value: awaitingPayments, icon: CreditCard, action: "orders" },
          { title: "Customers", value: data.customerCount, icon: Users, action: "users" },
        ].map(item => {
          const Icon = item.icon;
          return <Card key={item.title} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate(item.action)}>
            <CardContent className="p-5 flex items-center justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.title}</p><p className="mt-1 text-2xl font-extrabold">{item.value}</p></div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Icon className="h-5 w-5" /></div>
            </CardContent>
          </Card>;
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Recent orders</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("orders")}>View all <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.orders.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No orders yet.</p> :
              data.orders.map(order => <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div className="min-w-0"><p className="font-semibold text-sm">{order.order_number}</p><p className="text-xs text-muted-foreground truncate">{order.shipping_name || "Guest customer"} · {new Date(order.created_at).toLocaleString("en-GB")}</p></div>
                <div className="text-right shrink-0"><p className="font-bold text-sm">{money(Number(order.total))}</p><Badge variant="outline" className="text-[10px]">{statusLabel(order.status)}</Badge></div>
              </div>)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Inventory alerts</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full flex items-center justify-between rounded-xl border p-3 text-left hover:bg-muted/40" onClick={() => onNavigate("inventory")}>
              <span className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="h-4 w-4 text-amber-500" /> Low stock</span><Badge>{lowStock.length}</Badge>
            </button>
            <button className="w-full flex items-center justify-between rounded-xl border p-3 text-left hover:bg-muted/40" onClick={() => onNavigate("products")}>
              <span className="flex items-center gap-2 text-sm font-semibold"><Package className="h-4 w-4 text-red-500" /> Out of stock</span><Badge variant="destructive">{outOfStock.length}</Badge>
            </button>
            <p className="text-xs text-muted-foreground">Inventory values are read directly from the products table.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Payment operations</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Pending / initiated</span><strong>{awaitingPayments}</strong></div>
            <div className="flex justify-between"><span>Failed / cancelled / expired</span><strong>{failedPayments}</strong></div>
            <div className="flex justify-between"><span>Payment records</span><strong>{data.payments.length}</strong></div>
            <p className="pt-2 text-xs text-muted-foreground">Payment status is stored separately from order status so payment processing can be integrated without treating an order as paid from the browser.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Database connection health</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {healthItems.map(item => <div key={item.label} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <span className="flex items-center gap-2 text-sm"><CheckCircle2 className={`h-4 w-4 ${item.ok ? "text-emerald-500" : "text-red-500"}`} />{item.label}</span>
              <span className="text-xs text-muted-foreground">{item.detail}</span>
            </div>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
