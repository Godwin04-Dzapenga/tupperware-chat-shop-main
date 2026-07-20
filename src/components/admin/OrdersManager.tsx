import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  Search, Package, Clock, CheckCircle2, Truck, XCircle,
  RotateCcw, ChevronDown, ChevronUp, MessageCircle,
  Download, FileText, TrendingUp, ShoppingBag, DollarSign,
  Filter, RefreshCw, Eye, Printer, AlertCircle, MapPin, Phone, User
} from "lucide-react";

interface OrderItem { id: string; product_name: string; quantity: number; unit_price: number; line_total: number; }
interface Payment { provider: string; status: string; amount: number; }
interface Order {
  id: string; order_number: string; status: string; total: number;
  subtotal: number; discount_total: number; shipping_fee: number;
  shipping_name: string | null; shipping_phone: string | null;
  shipping_line1: string | null; shipping_city: string | null;
  shipping_country: string | null; coupon_code: string | null;
  notes: string | null; created_at: string; updated_at: string;
  user_id: string | null; guest_email: string | null;
  order_items: OrderItem[]; payments: Payment[];
}

const STATUS_OPTIONS = ["pending","confirmed","processing","shipped","delivered","cancelled","refunded"];
const STATUS_CONFIG: Record<string,{label:string;color:string;bg:string;icon:any}> = {
  pending:    {label:"Pending",    color:"text-amber-700",   bg:"bg-amber-100",    icon:Clock},
  confirmed:  {label:"Confirmed",  color:"text-blue-700",    bg:"bg-blue-100",     icon:CheckCircle2},
  processing: {label:"Processing", color:"text-purple-700",  bg:"bg-purple-100",   icon:Package},
  shipped:    {label:"Shipped",    color:"text-cyan-700",    bg:"bg-cyan-100",     icon:Truck},
  delivered:  {label:"Delivered",  color:"text-emerald-700", bg:"bg-emerald-100",  icon:CheckCircle2},
  cancelled:  {label:"Cancelled",  color:"text-red-700",     bg:"bg-red-100",      icon:XCircle},
  refunded:   {label:"Refunded",   color:"text-slate-700",   bg:"bg-slate-100",    icon:RotateCcw},
};
const STATUS_STEPS = ["pending","confirmed","processing","shipped","delivered"];
const fmt = (n: number) => `$${n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
const fmtDateTime = (d: string) => new Date(d).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState(() => { const d=new Date(); d.setDate(1); return d.toISOString().split("T")[0]; });
  const [dateTo, setDateTo] = useState(()=>new Date().toISOString().split("T")[0]);
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const [updatingId, setUpdatingId] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => { fetchOrders(); subscribeRealtime(); }, [dateFrom, dateTo]);

  const subscribeRealtime = () => {
    const ch = supabase.channel("admin-orders-rt")
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"orders"},(payload)=>{
        toast.info(`🛒 New order: ${(payload.new as any).order_number}`);
        fetchOrders();
      })
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"orders"},(payload)=>{
        setOrders(prev=>prev.map(o=>o.id===(payload.new as any).id?{...o,...(payload.new as any)}:o));
      })
      .subscribe();
    return ()=>{ supabase.removeChannel(ch); };
  };

  const fetchOrders = async () => {
    setLoading(true);
    const {data,error} = await supabase
      .from("orders")
      .select(`*, order_items(*), payments(provider,status,amount)`)
      .gte("created_at", dateFrom)
      .lte("created_at", dateTo+"T23:59:59")
      .order("created_at",{ascending:false});
    if (error) { toast.error("Failed to load orders"); }
    else setOrders((data as Order[])||[]);
    setLoading(false);
  };

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    const {error} = await supabase.from("orders").update({status}).eq("id",orderId);
    if (error) toast.error("Failed to update status");
    else {
      toast.success(`Order updated to "${status}"`);
      setOrders(prev=>prev.map(o=>o.id===orderId?{...o,status}:o));
      await supabase.from("audit_log").insert({action:"update_status",entity:"orders",entity_id:orderId,diff:{status}});
    }
    setUpdatingId(null);
  };

  // Filtered & tabbed
  const byTab = useMemo(() => {
    if (activeTab==="all") return orders;
    if (activeTab==="pending") return orders.filter(o=>o.status==="pending");
    if (activeTab==="active") return orders.filter(o=>["confirmed","processing","shipped"].includes(o.status));
    if (activeTab==="delivered") return orders.filter(o=>o.status==="delivered");
    return orders.filter(o=>["cancelled","refunded"].includes(o.status));
  }, [orders, activeTab]);

  const filtered = useMemo(()=>byTab.filter(o=>{
    if (statusFilter!=="all" && o.status!==statusFilter) return false;
    if (search) {
      const q=search.toLowerCase();
      return o.order_number.toLowerCase().includes(q)||
        o.shipping_name?.toLowerCase().includes(q)||
        o.shipping_phone?.includes(q)||
        o.guest_email?.toLowerCase().includes(q);
    }
    return true;
  }),[byTab,statusFilter,search]);

  // KPIs
  const kpi = useMemo(()=>({
    total: orders.length,
    revenue: orders.filter(o=>o.status==="delivered").reduce((s,o)=>s+o.total,0),
    pending: orders.filter(o=>o.status==="pending").length,
    today: orders.filter(o=>new Date(o.created_at).toDateString()===new Date().toDateString()).length,
    avgOrder: orders.length>0 ? orders.reduce((s,o)=>s+o.total,0)/orders.length : 0,
    delivered: orders.filter(o=>o.status==="delivered").length,
  }),[orders]);

  const tabCounts = useMemo(()=>({
    all: orders.length,
    pending: orders.filter(o=>o.status==="pending").length,
    active: orders.filter(o=>["confirmed","processing","shipped"].includes(o.status)).length,
    delivered: orders.filter(o=>o.status==="delivered").length,
    closed: orders.filter(o=>["cancelled","refunded"].includes(o.status)).length,
  }),[orders]);

  // Exports
  const exportCSV = () => {
    const rows=[["Order#","Status","Customer","Phone","City","Items","Subtotal","Discount","Shipping","Total","Payment","Date"],
      ...filtered.map(o=>[o.order_number,o.status,o.shipping_name||"",o.shipping_phone||"",o.shipping_city||"",
        o.order_items?.length||0,o.subtotal,o.discount_total,o.shipping_fee,o.total,
        o.payments?.[0]?.provider||"",fmtDate(o.created_at)])];
    const blob=new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download=`orders-${dateFrom}-${dateTo}.csv`; a.click();
  };

  const exportPDF = () => {
    const doc=new jsPDF("l","mm","a4");
    doc.setFontSize(14); doc.text("TuppAfrica — Orders Report",14,14);
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`Period: ${fmtDate(dateFrom)} – ${fmtDate(dateTo)}   Revenue: ${fmt(kpi.revenue)}   Orders: ${kpi.total}   Pending: ${kpi.pending}`,14,20);
    autoTable(doc,{
      head:[["Order#","Status","Customer","Phone","City","Items","Total","Payment","Date"]],
      body:filtered.map(o=>[o.order_number,o.status,o.shipping_name||"—",o.shipping_phone||"—",
        o.shipping_city||"—",o.order_items?.length||0,`$${o.total.toFixed(2)}`,
        o.payments?.[0]?.provider?.replace(/_/g," ")||"—",fmtDate(o.created_at)]),
      startY:24, styles:{fontSize:8}, headStyles:{fillColor:[13,148,136]},
      alternateRowStyles:{fillColor:[245,255,254]},
    });
    doc.save(`orders-${dateFrom}-${dateTo}.pdf`);
  };

  const exportExcel = () => {
    const ws=XLSX.utils.json_to_sheet(filtered.map(o=>({
      "Order#":o.order_number, Status:o.status,
      Customer:o.shipping_name||"", Phone:o.shipping_phone||"",
      City:o.shipping_city||"", Items:o.order_items?.length||0,
      Subtotal:o.subtotal, Discount:o.discount_total, Shipping:o.shipping_fee, Total:o.total,
      Payment:o.payments?.[0]?.provider?.replace(/_/g," ")||"",
      Date:fmtDate(o.created_at),
    })));
    const wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"Orders");
    XLSX.writeFile(wb,`orders-${dateFrom}-${dateTo}.xlsx`);
  };

  const printOrder = (order: Order) => {
    const w=window.open("","_blank");
    if (!w) return;
    w.document.write(`<html><head><title>${order.order_number}</title><style>body{font-family:Arial,sans-serif;padding:24px;max-width:600px;margin:0 auto}h1{font-size:20px}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{padding:8px;text-align:left;border-bottom:1px solid #eee}th{font-size:11px;text-transform:uppercase;color:#666}.total{font-weight:bold;font-size:16px}</style></head><body>
      <h1>TuppAfrica — ${order.order_number}</h1>
      <p>Date: ${fmtDateTime(order.created_at)} | Status: ${order.status}</p>
      <p>Customer: ${order.shipping_name||"—"} | ${order.shipping_phone||"—"}</p>
      <p>Address: ${order.shipping_line1||"—"}, ${order.shipping_city||"—"}, ${order.shipping_country||"Zimbabwe"}</p>
      ${order.notes?`<p>Notes: ${order.notes}</p>`:""}
      <table><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
      ${order.order_items?.map(i=>`<tr><td>${i.product_name}</td><td>${i.quantity}</td><td>$${i.unit_price.toFixed(2)}</td><td>$${i.line_total.toFixed(2)}</td></tr>`).join("")}
      </table>
      <p>Subtotal: $${order.subtotal.toFixed(2)}</p>
      ${order.discount_total>0?`<p>Discount: -$${order.discount_total.toFixed(2)}</p>`:""}
      <p>Shipping: ${order.shipping_fee===0?"FREE":"$"+order.shipping_fee.toFixed(2)}</p>
      <p class="total">TOTAL: $${order.total.toFixed(2)}</p>
      <p>Payment: ${order.payments?.[0]?.provider?.replace(/_/g," ")||"—"}</p>
    </body></html>`);
    w.document.close(); w.print();
  };

  const whatsappCustomer = (order: Order) => {
    const phone=(order.shipping_phone||"").replace(/\D/g,"");
    const msg=encodeURIComponent(`Hi ${order.shipping_name?.split(" ")[0]||""}! 👋\n\nYour TuppAfrica order *${order.order_number}* is now *${order.status}*.\n\nTotal: $${order.total.toFixed(2)}\nItems: ${order.order_items?.length} product(s)\n\nThank you for shopping with us! 🛍️`);
    window.open(`https://wa.me/${phone}?text=${msg}`,"_blank");
  };

  if (loading) return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading orders…</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-primary"/>Order Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time order tracking, fulfilment & customer communication</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="h-8 w-36 text-xs rounded-full"/>
          <span className="self-center text-xs text-muted-foreground">to</span>
          <Input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="h-8 w-36 text-xs rounded-full"/>
          <Button size="sm" variant="outline" onClick={fetchOrders} className="h-8 rounded-full px-3"><RefreshCw className="h-3.5 w-3.5"/></Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[
          {label:"Total Orders",   value:kpi.total,              icon:ShoppingBag, color:"primary"},
          {label:"Revenue",        value:fmt(kpi.revenue),       icon:DollarSign,  color:"emerald"},
          {label:"Pending",        value:kpi.pending,            icon:Clock,       color:kpi.pending>0?"amber":"slate"},
          {label:"Today",          value:kpi.today,              icon:TrendingUp,  color:"blue"},
          {label:"Avg Order",      value:fmt(kpi.avgOrder),      icon:Package,     color:"purple"},
          {label:"Delivered",      value:kpi.delivered,          icon:CheckCircle2,color:"teal"},
        ].map(card=>{
          const Icon=card.icon;
          const cmap:Record<string,string>={primary:"text-primary bg-primary/10",emerald:"text-emerald-600 bg-emerald-50",amber:"text-amber-600 bg-amber-50",slate:"text-slate-500 bg-slate-100",blue:"text-blue-600 bg-blue-50",purple:"text-purple-600 bg-purple-50",teal:"text-teal-600 bg-teal-50"};
          return (
            <Card key={card.label} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{card.label}</p>
                    <p className={`text-lg font-extrabold mt-0.5 ${cmap[card.color]?.split(" ")[0]}`}>{card.value}</p>
                  </div>
                  <div className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center ${cmap[card.color]}`}><Icon className="h-4 w-4"/></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="rounded-xl">
            {[
              {id:"all",     label:`All (${tabCounts.all})`},
              {id:"pending", label:`Pending (${tabCounts.pending})`},
              {id:"active",  label:`Active (${tabCounts.active})`},
              {id:"delivered",label:`Delivered (${tabCounts.delivered})`},
              {id:"closed",  label:`Closed (${tabCounts.closed})`},
            ].map(t=><TabsTrigger key={t.id} value={t.id} className="text-xs">{t.label}</TabsTrigger>)}
          </TabsList>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
              <Input placeholder="Search order, name, phone…" value={search} onChange={e=>setSearch(e.target.value)} className="h-8 pl-8 w-52 text-xs rounded-full"/>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-xs rounded-full"><SelectValue placeholder="Status"/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map(s=><SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full text-xs" onClick={exportCSV}><Download className="h-3.5 w-3.5"/>CSV</Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full text-xs" onClick={exportPDF}><FileText className="h-3.5 w-3.5"/>PDF</Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full text-xs" onClick={exportExcel}><Download className="h-3.5 w-3.5"/>Excel</Button>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-3">
          <Card>
            <CardContent className="p-0">
              {filtered.length===0
                ? <div className="py-16 text-center text-muted-foreground"><ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30"/><p>No orders found</p></div>
                : <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="text-xs w-6"></TableHead>
                          <TableHead className="text-xs">Order #</TableHead>
                          <TableHead className="text-xs">Customer</TableHead>
                          <TableHead className="text-xs">Location</TableHead>
                          <TableHead className="text-xs">Items</TableHead>
                          <TableHead className="text-xs">Total</TableHead>
                          <TableHead className="text-xs">Payment</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map(order=>{
                          const cfg=STATUS_CONFIG[order.status]??STATUS_CONFIG.pending;
                          const StatusIcon=cfg.icon;
                          const isExpanded=expandedId===order.id;
                          const stepIdx=STATUS_STEPS.indexOf(order.status);
                          const isTerminal=["cancelled","refunded"].includes(order.status);
                          return (
                            <>
                              <TableRow key={order.id} className={`cursor-pointer hover:bg-muted/20 transition-colors ${isExpanded?"bg-muted/10":""}`}
                                onClick={()=>setExpandedId(isExpanded?null:order.id)}>
                                <TableCell>
                                  {isExpanded?<ChevronUp className="h-3.5 w-3.5 text-muted-foreground"/>:<ChevronDown className="h-3.5 w-3.5 text-muted-foreground"/>}
                                </TableCell>
                                <TableCell>
                                  <span className="font-bold text-primary text-sm">{order.order_number}</span>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="text-sm font-medium">{order.shipping_name||order.guest_email||"Guest"}</p>
                                    <p className="text-xs text-muted-foreground">{order.shipping_phone||""}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">{order.shipping_city||"—"}</TableCell>
                                <TableCell><span className="text-sm">{order.order_items?.length||0}</span></TableCell>
                                <TableCell><span className="font-bold text-sm">{fmt(order.total)}</span></TableCell>
                                <TableCell>
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {order.payments?.[0]?.provider?.replace(/_/g," ")||"—"}
                                  </span>
                                </TableCell>
                                <TableCell onClick={e=>e.stopPropagation()}>
                                  <Select value={order.status} onValueChange={v=>updateStatus(order.id,v)} disabled={updatingId===order.id}>
                                    <SelectTrigger className={`h-7 text-xs w-32 border-0 font-semibold rounded-full ${cfg.bg} ${cfg.color}`}>
                                      <div className="flex items-center gap-1"><StatusIcon className="h-3 w-3"/><SelectValue/></div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {STATUS_OPTIONS.map(s=><SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(order.created_at)}</TableCell>
                                <TableCell onClick={e=>e.stopPropagation()}>
                                  <div className="flex gap-1 justify-end">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Print order" onClick={()=>printOrder(order)}><Printer className="h-3.5 w-3.5"/></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" title="WhatsApp customer" onClick={()=>whatsappCustomer(order)}><MessageCircle className="h-3.5 w-3.5"/></Button>
                                  </div>
                                </TableCell>
                              </TableRow>

                              {/* Expanded detail row */}
                              {isExpanded && (
                                <TableRow key={`${order.id}-detail`} className="bg-muted/5">
                                  <TableCell colSpan={10} className="p-0">
                                    <div className="p-5 space-y-4">
                                      {/* Status tracker */}
                                      {!isTerminal && (
                                        <div className="flex items-center gap-0 max-w-lg">
                                          {STATUS_STEPS.map((s,i)=>{
                                            const done=i<=stepIdx; const active=i===stepIdx;
                                            const Ic=STATUS_CONFIG[s]?.icon||Clock;
                                            return (
                                              <div key={s} className="flex items-center flex-1">
                                                <div className="flex flex-col items-center gap-1">
                                                  <div className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${done?"border-primary bg-primary text-white":active?"border-primary bg-white text-primary ring-2 ring-primary/20":"border-muted-foreground/20 bg-background text-muted-foreground/30"}`}>
                                                    {done&&i<stepIdx?<CheckCircle2 className="h-3.5 w-3.5"/>:<Ic className="h-3 w-3"/>}
                                                  </div>
                                                  <span className={`text-[9px] font-semibold capitalize ${done?"text-primary":"text-muted-foreground/40"}`}>{s}</span>
                                                </div>
                                                {i<STATUS_STEPS.length-1&&<div className={`flex-1 h-0.5 mb-4 mx-1 rounded-full ${i<stepIdx?"bg-primary":"bg-muted"}`}/>}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                      {isTerminal&&<Badge className={`${STATUS_CONFIG[order.status]?.bg} ${STATUS_CONFIG[order.status]?.color} border-0`}>{STATUS_CONFIG[order.status]?.label}</Badge>}

                                      <div className="grid gap-4 md:grid-cols-3">
                                        {/* Items */}
                                        <div className="md:col-span-2 space-y-2">
                                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Order Items</p>
                                          {order.order_items?.map(item=>(
                                            <div key={item.id} className="flex justify-between text-sm border rounded-xl p-3 bg-card">
                                              <div><p className="font-medium">{item.product_name}</p><p className="text-xs text-muted-foreground">${item.unit_price.toFixed(2)} × {item.quantity}</p></div>
                                              <p className="font-bold">{fmt(item.line_total)}</p>
                                            </div>
                                          ))}
                                          <div className="space-y-1 text-sm pt-2 border-t">
                                            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
                                            {order.discount_total>0&&<div className="flex justify-between text-emerald-600"><span>Discount {order.coupon_code&&`(${order.coupon_code})`}</span><span>-{fmt(order.discount_total)}</span></div>}
                                            <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>{order.shipping_fee===0?"FREE":fmt(order.shipping_fee)}</span></div>
                                            <div className="flex justify-between font-bold border-t pt-1 text-base"><span>Total</span><span className="text-primary">{fmt(order.total)}</span></div>
                                          </div>
                                        </div>

                                        {/* Shipping + actions */}
                                        <div className="space-y-3">
                                          <div className="bg-card rounded-xl border p-4 space-y-2 text-sm">
                                            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Shipping Details</p>
                                            <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-primary shrink-0"/><span className="font-semibold">{order.shipping_name}</span></div>
                                            <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary shrink-0"/><span>{order.shipping_phone}</span></div>
                                            <div className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5"/><span className="text-muted-foreground">{order.shipping_line1}, {order.shipping_city}</span></div>
                                            {order.notes&&<div className="flex items-start gap-2"><AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5"/><span className="text-muted-foreground italic">{order.notes}</span></div>}
                                          </div>
                                          <div className="flex flex-col gap-2">
                                            <Button size="sm" className="w-full rounded-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={()=>whatsappCustomer(order)}>
                                              <MessageCircle className="h-4 w-4"/>WhatsApp Customer
                                            </Button>
                                            <Button size="sm" variant="outline" className="w-full rounded-full gap-2" onClick={()=>printOrder(order)}>
                                              <Printer className="h-4 w-4"/>Print Order
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
              }
              {filtered.length>0&&(
                <div className="border-t px-4 py-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{filtered.length} order{filtered.length!==1?"s":""}</p>
                  <div className="flex gap-4 text-xs font-semibold">
                    <span className="text-emerald-600">Revenue: {fmt(filtered.filter(o=>o.status==="delivered").reduce((s,o)=>s+o.total,0))}</span>
                    <span className="text-amber-600">Pending: {filtered.filter(o=>o.status==="pending").length}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
