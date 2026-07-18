import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, TrendingDown, ShoppingBag, DollarSign, Users, Package, Star, AlertTriangle } from "lucide-react";

interface Analytics {
  totalRevenue: number; prevRevenue: number;
  totalOrders: number; prevOrders: number;
  avgOrderValue: number;
  totalProducts: number; lowStockCount: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  topProducts: { name: string; sold: number; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  categoryRevenue: { name: string; value: number }[];
}

const COLORS = ["#0d9488", "#06b6d4", "#f59e0b", "#8b5cf6", "#ec4899", "#10b981"];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", processing: "Processing",
  shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};

function StatCard({ title, value, prev, icon: Icon, prefix = "", suffix = "", color = "primary" }: any) {
  const pct = prev > 0 ? (((value - prev) / prev) * 100).toFixed(1) : null;
  const up = pct !== null && parseFloat(pct) >= 0;
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
            <p className="mt-1 text-3xl font-extrabold text-foreground">{prefix}{typeof value === "number" && !Number.isInteger(value) ? value.toFixed(2) : value}{suffix}</p>
            {pct !== null && (
              <div className={`mt-1.5 flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-600" : "text-red-500"}`}>
                {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {Math.abs(parseFloat(pct))}% vs last period
              </div>
            )}
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => { fetchAnalytics(); }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const days = parseInt(period);
    const now = new Date();
    const from = new Date(now.getTime() - days * 86400000).toISOString();
    const prevFrom = new Date(now.getTime() - days * 2 * 86400000).toISOString();

    const [ordersRes, prevOrdersRes, productsRes, itemsRes] = await Promise.all([
      supabase.from("orders").select("id, total, status, created_at").gte("created_at", from),
      supabase.from("orders").select("id, total").gte("created_at", prevFrom).lt("created_at", from),
      supabase.from("products").select("id, name, stock_quantity, reorder_level, category_id, categories(name)"),
      supabase.from("order_items").select("product_name, quantity, line_total, order_id, orders!inner(created_at, status)").gte("orders.created_at", from),
    ]);

    const orders = ordersRes.data || [];
    const prevOrders = prevOrdersRes.data || [];
    const products = productsRes.data || [];
    const items = itemsRes.data || [];

    const deliveredOrders = orders.filter(o => o.status === "delivered");
    const totalRevenue = deliveredOrders.reduce((s, o) => s + o.total, 0);
    const prevRevenue = prevOrders.reduce((s, o) => s + o.total, 0);

    // Revenue by day
    const dayMap: Record<string, { revenue: number; orders: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      dayMap[key] = { revenue: 0, orders: 0 };
    }
    orders.forEach(o => {
      const key = new Date(o.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      if (dayMap[key]) { dayMap[key].revenue += o.status === "delivered" ? o.total : 0; dayMap[key].orders++; }
    });
    const revenueByDay = Object.entries(dayMap).map(([date, v]) => ({ date, ...v }));

    // Top products by revenue
    const productMap: Record<string, { sold: number; revenue: number }> = {};
    items.forEach((item: any) => {
      if (!productMap[item.product_name]) productMap[item.product_name] = { sold: 0, revenue: 0 };
      productMap[item.product_name].sold += item.quantity;
      productMap[item.product_name].revenue += item.line_total;
    });
    const topProducts = Object.entries(productMap)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    // Orders by status
    const statusMap: Record<string, number> = {};
    orders.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
    const ordersByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

    // Category revenue
    const catMap: Record<string, number> = {};
    items.forEach((item: any) => {
      const product = products.find((p: any) => p.name === item.product_name);
      const cat = (product as any)?.categories?.name || "Uncategorised";
      catMap[cat] = (catMap[cat] || 0) + item.line_total;
    });
    const categoryRevenue = Object.entries(catMap).map(([name, value]) => ({ name, value }));

    const lowStockCount = products.filter((p: any) => p.stock_quantity <= (p.reorder_level || 5)).length;

    setData({
      totalRevenue, prevRevenue,
      totalOrders: orders.length, prevOrders: prevOrders.length,
      avgOrderValue: orders.length > 0 ? orders.reduce((s, o) => s + o.total, 0) / orders.length : 0,
      totalProducts: products.length, lowStockCount,
      revenueByDay, topProducts, ordersByStatus, categoryRevenue,
    });
    setLoading(false);
  };

  if (loading) return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading analytics…</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold">Analytics Dashboard</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36 rounded-full text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Revenue" value={data.totalRevenue} prev={data.prevRevenue} icon={DollarSign} prefix="$" />
        <StatCard title="Orders" value={data.totalOrders} prev={data.prevOrders} icon={ShoppingBag} />
        <StatCard title="Avg Order Value" value={data.avgOrderValue} icon={TrendingUp} prefix="$" />
        <StatCard title="Low Stock Items" value={data.lowStockCount} icon={AlertTriangle} />
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Revenue & Orders Over Time</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.revenueByDay} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" interval={Math.floor(data.revenueByDay.length / 6)} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2.5} dot={false} name="Revenue ($)" />
              <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2} dot={false} name="Orders" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top products */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Top Products by Revenue</CardTitle></CardHeader>
          <CardContent>
            {data.topProducts.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">No sales data yet</p>
              : <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.topProducts} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={v => `$${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={90} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`, "Revenue"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="revenue" fill="#0d9488" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </CardContent>
        </Card>

        {/* Orders by status */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Orders by Status</CardTitle></CardHeader>
          <CardContent>
            {data.ordersByStatus.length === 0
              ? <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
              : <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.ordersByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ status, count }) => `${STATUS_LABELS[status] || status}: ${count}`} labelLine={false} fontSize={10}>
                      {data.ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, name) => [v, STATUS_LABELS[String(name)] || name]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
            }
          </CardContent>
        </Card>
      </div>

      {/* Low stock warning */}
      {data.lowStockCount > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              <strong>{data.lowStockCount} product{data.lowStockCount !== 1 ? "s" : ""}</strong> are at or below reorder level. Check the Inventory tab.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
