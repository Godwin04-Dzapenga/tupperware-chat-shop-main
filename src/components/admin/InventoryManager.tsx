import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  Package, AlertTriangle, TrendingUp, TrendingDown, Plus,
  Search, Download, FileText, RefreshCw, Filter, DollarSign,
  ArrowUpCircle, ArrowDownCircle, SlidersHorizontal, Edit2, CheckCircle2
} from "lucide-react";

interface Product {
  id: string; name: string; stock_quantity: number; reorder_level: number;
  sku: string | null; price: number; cost_price: number;
  category_id: string | null; image_url: string | null;
  categories?: { name: string } | null;
}
interface StockMovement {
  id: string; product_id: string; quantity: number; movement_type: string;
  reason: string | null; notes: string | null; created_at: string;
  products: { name: string };
}

const MOVEMENT_REASONS = {
  in:  ["Purchase from supplier","Customer return","Stock correction","Initial stock","Transfer in"],
  out: ["Sale","Damaged/spoiled","Expired","Sample","Transfer out","Write-off"],
  adjustment: ["Stock take correction","System adjustment","Audit correction"],
};
const fmt = (n: number) => `$${n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});

export const InventoryManager = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product|null>(null);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("stock");

  const [form, setForm] = useState({
    product_id: "", quantity: "", movement_type: "in",
    reason: "", notes: "", custom_reason: "",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [productsRes, movementsRes] = await Promise.all([
      supabase.from("products").select("*, categories(name)").order("name"),
      supabase.from("stock_movements").select("*, products(name)").order("created_at",{ascending:false}).limit(200),
    ]);
    if (productsRes.error) toast.error("Failed to load inventory");
    else { setProducts(productsRes.data||[]); setMovements(movementsRes.data||[]); }
    setLoading(false);
  };

  const resetForm = () => setForm({product_id:"",quantity:"",movement_type:"in",reason:"",notes:"",custom_reason:""});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id) { toast.error("Select a product"); return; }
    const qty = parseInt(form.quantity);
    if (!qty || qty <= 0) { toast.error("Enter a valid quantity"); return; }
    const reason = form.custom_reason || form.reason;
    if (!reason) { toast.error("Select or enter a reason"); return; }

    const product = products.find(p=>p.id===form.product_id);
    if (!product) return;

    const delta = form.movement_type === "out" ? -qty : qty;
    const newQty = form.movement_type === "adjustment"
      ? qty
      : Math.max(0, product.stock_quantity + delta);

    try {
      const { error: mvErr } = await supabase.from("stock_movements").insert([{
        product_id: form.product_id,
        quantity: form.movement_type==="adjustment" ? qty - product.stock_quantity : delta,
        movement_type: form.movement_type,
        reason, notes: form.notes||null,
      }]);
      if (mvErr) throw mvErr;

      const { error: upErr } = await supabase.from("products").update({stock_quantity:newQty}).eq("id",form.product_id);
      if (upErr) throw upErr;

      toast.success(`Stock updated! ${product.name}: ${product.stock_quantity} → ${newQty}`);
      setDialogOpen(false); resetForm(); fetchData();
    } catch (err:any) { toast.error(err.message||"Failed to update stock"); }
  };

  // Filtered products
  const filtered = useMemo(()=>products.filter(p=>{
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.sku||"").toLowerCase().includes(search.toLowerCase())) return false;
    if (stockFilter==="low") return p.stock_quantity<=p.reorder_level && p.stock_quantity>0;
    if (stockFilter==="out") return p.stock_quantity===0;
    if (stockFilter==="ok")  return p.stock_quantity>p.reorder_level;
    return true;
  }),[products,search,stockFilter]);

  // KPIs
  const kpi = useMemo(()=>({
    total: products.length,
    totalCost: products.reduce((s,p)=>s+p.stock_quantity*p.cost_price,0),
    totalRetail: products.reduce((s,p)=>s+p.stock_quantity*p.price,0),
    lowStock: products.filter(p=>p.stock_quantity<=p.reorder_level&&p.stock_quantity>0).length,
    outOfStock: products.filter(p=>p.stock_quantity===0).length,
    potentialProfit: products.reduce((s,p)=>s+p.stock_quantity*(p.price-p.cost_price),0),
  }),[products]);

  // Chart data — top 10 by stock value
  const chartData = useMemo(()=>
    [...products].sort((a,b)=>b.stock_quantity*b.cost_price - a.stock_quantity*a.cost_price)
      .slice(0,10).map(p=>({name:p.name.split(" ").slice(0,2).join(" "),value:p.stock_quantity*p.cost_price,qty:p.stock_quantity}))
  ,[products]);

  const exportExcel = () => {
    const ws=XLSX.utils.json_to_sheet(filtered.map(p=>({
      Name:p.name, SKU:p.sku||"",
      Category:(p as any).categories?.name||"",
      Stock:p.stock_quantity, "Reorder Level":p.reorder_level,
      Status:p.stock_quantity===0?"Out of Stock":p.stock_quantity<=p.reorder_level?"Low Stock":"In Stock",
      "Cost Price":p.cost_price, "Sell Price":p.price,
      "Stock Value (Cost)":p.stock_quantity*p.cost_price,
      "Stock Value (Retail)":p.stock_quantity*p.price,
      "Potential Profit":p.stock_quantity*(p.price-p.cost_price),
    })));
    const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Inventory");
    XLSX.writeFile(wb,`inventory-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc=new jsPDF("l","mm","a4");
    doc.setFontSize(14); doc.text("TuppAfrica — Inventory Report",14,14);
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleString()}   Total SKUs: ${kpi.total}   Stock Value: ${fmt(kpi.totalCost)}   Low Stock: ${kpi.lowStock}   Out of Stock: ${kpi.outOfStock}`,14,20);
    autoTable(doc,{
      head:[["Product","SKU","Category","Stock","Reorder","Status","Cost Price","Sell Price","Stock Value"]],
      body:filtered.map(p=>[
        p.name,p.sku||"—",(p as any).categories?.name||"—",
        p.stock_quantity,p.reorder_level,
        p.stock_quantity===0?"Out":p.stock_quantity<=p.reorder_level?"Low":"OK",
        `$${p.cost_price.toFixed(2)}`,`$${p.price.toFixed(2)}`,
        `$${(p.stock_quantity*p.cost_price).toFixed(2)}`,
      ]),
      startY:24, styles:{fontSize:8},
      headStyles:{fillColor:[13,148,136]},
      bodyStyles:{},
      didParseCell:(data:any)=>{
        if(data.column.index===5){
          if(data.cell.text[0]==="Out") data.cell.styles.textColor=[220,38,38];
          else if(data.cell.text[0]==="Low") data.cell.styles.textColor=[217,119,6];
          else data.cell.styles.textColor=[5,150,105];
        }
      },
    });
    doc.save(`inventory-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (loading) return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading inventory…</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2"><Package className="h-5 w-5 text-primary"/>Inventory Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time stock levels, valuations & movement history</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchData} className="h-8 rounded-full px-3"><RefreshCw className="h-3.5 w-3.5"/></Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full text-xs" onClick={exportPDF}><FileText className="h-3.5 w-3.5"/>PDF</Button>
          <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full text-xs" onClick={exportExcel}><Download className="h-3.5 w-3.5"/>Excel</Button>
          <Dialog open={dialogOpen} onOpenChange={v=>{setDialogOpen(v);if(!v)resetForm();}}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1.5 rounded-full"><Plus className="h-3.5 w-3.5"/>Adjust Stock</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Stock Adjustment</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Product *</Label>
                  <Select value={form.product_id} onValueChange={v=>{
                    const p=products.find(x=>x.id===v);
                    setForm(f=>({...f,product_id:v,quantity:f.movement_type==="adjustment"?String(p?.stock_quantity||0):f.quantity}));
                    setSelectedProduct(p||null);
                  }}>
                    <SelectTrigger className="rounded-xl h-9"><SelectValue placeholder="Select product…"/></SelectTrigger>
                    <SelectContent>
                      {products.map(p=>(
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center justify-between gap-4 w-full">
                            <span>{p.name}</span>
                            <span className={`text-xs font-bold ${p.stock_quantity===0?"text-red-500":p.stock_quantity<=p.reorder_level?"text-amber-500":"text-emerald-600"}`}>
                              {p.stock_quantity} units
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedProduct&&(
                    <div className="flex gap-2 text-xs">
                      <span className="text-muted-foreground">Current stock:</span>
                      <span className={`font-bold ${selectedProduct.stock_quantity<=selectedProduct.reorder_level?"text-red-500":"text-emerald-600"}`}>{selectedProduct.stock_quantity}</span>
                      <span className="text-muted-foreground">| Reorder at: {selectedProduct.reorder_level}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Movement Type *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {id:"in",   label:"Stock In",  icon:ArrowUpCircle,   color:"emerald"},
                      {id:"out",  label:"Stock Out", icon:ArrowDownCircle, color:"red"},
                      {id:"adjustment",label:"Set To",icon:SlidersHorizontal,color:"blue"},
                    ].map(t=>{
                      const Icon=t.icon;
                      const sel=form.movement_type===t.id;
                      return (
                        <button key={t.id} type="button" onClick={()=>{
                          setForm(f=>({...f,movement_type:t.id,reason:"",custom_reason:"",
                            quantity:t.id==="adjustment"?String(selectedProduct?.stock_quantity||""):f.quantity}));
                        }}
                          className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-semibold transition-all ${sel?"border-primary bg-primary/5 text-primary shadow-sm":"border-border text-muted-foreground hover:border-primary/40"}`}>
                          <Icon className={`h-4 w-4 ${t.color==="emerald"?"text-emerald-500":t.color==="red"?"text-red-500":"text-blue-500"}`}/>
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {form.movement_type==="adjustment"?"Set Stock To *":"Quantity *"}
                  </Label>
                  <Input type="number" min="0" placeholder="0"
                    value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))}
                    className="rounded-xl h-9" required/>
                  {form.movement_type==="adjustment"&&selectedProduct&&form.quantity&&(
                    <p className="text-xs text-muted-foreground">
                      Change: {parseInt(form.quantity)-selectedProduct.stock_quantity>=0?"+":""}{parseInt(form.quantity)-selectedProduct.stock_quantity} units
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Reason *</Label>
                  <Select value={form.reason} onValueChange={v=>setForm(f=>({...f,reason:v,custom_reason:""}))}>
                    <SelectTrigger className="rounded-xl h-9"><SelectValue placeholder="Select reason…"/></SelectTrigger>
                    <SelectContent>
                      {(MOVEMENT_REASONS[form.movement_type as keyof typeof MOVEMENT_REASONS]||[]).map(r=>(
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                      <SelectItem value="__custom__">Other (type below)</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.reason==="__custom__"&&(
                    <Input placeholder="Enter custom reason…" value={form.custom_reason}
                      onChange={e=>setForm(f=>({...f,custom_reason:e.target.value}))} className="rounded-xl h-9 mt-1"/>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Notes (optional)</Label>
                  <Textarea rows={2} placeholder="Additional details…" value={form.notes}
                    onChange={e=>setForm(f=>({...f,notes:e.target.value}))} className="rounded-xl resize-none text-sm"/>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" className="rounded-full" onClick={()=>{setDialogOpen(false);resetForm();}}>Cancel</Button>
                  <Button type="submit" className="rounded-full">Save Movement</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[
          {label:"Total SKUs",      value:kpi.total,               color:"primary",  icon:Package},
          {label:"Stock Value",     value:fmt(kpi.totalCost),      color:"blue",     icon:DollarSign},
          {label:"Retail Value",    value:fmt(kpi.totalRetail),    color:"teal",     icon:TrendingUp},
          {label:"Potential Profit",value:fmt(kpi.potentialProfit),color:"emerald",  icon:TrendingUp},
          {label:"Low Stock",       value:kpi.lowStock,            color:kpi.lowStock>0?"amber":"slate",icon:AlertTriangle},
          {label:"Out of Stock",    value:kpi.outOfStock,          color:kpi.outOfStock>0?"red":"slate",icon:AlertTriangle},
        ].map(card=>{
          const Icon=card.icon;
          const cmap:Record<string,string>={primary:"text-primary bg-primary/10",blue:"text-blue-600 bg-blue-50",teal:"text-teal-600 bg-teal-50",emerald:"text-emerald-600 bg-emerald-50",amber:"text-amber-600 bg-amber-50",red:"text-red-600 bg-red-50",slate:"text-slate-500 bg-slate-100"};
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
        <TabsList className="rounded-xl">
          <TabsTrigger value="stock" className="text-xs">Stock Levels</TabsTrigger>
          <TabsTrigger value="valuation" className="text-xs">Valuation Chart</TabsTrigger>
          <TabsTrigger value="movements" className="text-xs">Movement History</TabsTrigger>
        </TabsList>

        {/* STOCK LEVELS */}
        <TabsContent value="stock" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
                  <Input placeholder="Search product or SKU…" value={search} onChange={e=>setSearch(e.target.value)} className="h-8 pl-8 w-48 text-xs rounded-full"/>
                </div>
                {["all","ok","low","out"].map(f=>(
                  <button key={f} onClick={()=>setStockFilter(f)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${stockFilter===f?"bg-primary text-primary-foreground":"bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                    {f==="all"?"All":f==="ok"?"In Stock":f==="low"?"Low Stock":"Out of Stock"}
                    <span className="ml-1 opacity-60">
                      ({f==="all"?products.length:f==="ok"?products.filter(p=>p.stock_quantity>p.reorder_level).length:f==="low"?kpi.lowStock:kpi.outOfStock})
                    </span>
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">Product</TableHead>
                    <TableHead className="text-xs">SKU</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs text-center">Stock</TableHead>
                    <TableHead className="text-xs text-center">Reorder</TableHead>
                    <TableHead className="text-xs text-center">Status</TableHead>
                    <TableHead className="text-xs text-right">Cost Value</TableHead>
                    <TableHead className="text-xs text-right">Retail Value</TableHead>
                    <TableHead className="text-xs text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length===0&&<TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">No products found</TableCell></TableRow>}
                  {filtered.map(p=>{
                    const out=p.stock_quantity===0;
                    const low=p.stock_quantity<=p.reorder_level&&p.stock_quantity>0;
                    const pct=p.reorder_level>0?Math.min(100,(p.stock_quantity/Math.max(p.reorder_level*2,1))*100):100;
                    return (
                      <TableRow key={p.id} className={`${out?"bg-red-50/30":low?"bg-amber-50/30":""}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {p.image_url
                              ?<img src={p.image_url} alt={p.name} className="h-8 w-8 rounded-lg object-cover shrink-0"/>
                              :<div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0"><Package className="h-4 w-4 text-muted-foreground"/></div>
                            }
                            <span className="text-sm font-medium truncate max-w-[180px]">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.sku||"—"}</code></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{(p as any).categories?.name||"—"}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-sm font-extrabold ${out?"text-red-600":low?"text-amber-600":"text-emerald-600"}`}>{p.stock_quantity}</span>
                            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${out?"bg-red-500":low?"bg-amber-400":"bg-emerald-500"}`} style={{width:`${pct}%`}}/>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">{p.reorder_level}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-[10px] border-0 ${out?"bg-red-100 text-red-700":low?"bg-amber-100 text-amber-700":"bg-emerald-100 text-emerald-700"}`}>
                            {out?"Out of Stock":low?"Low Stock":"In Stock"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">{fmt(p.stock_quantity*p.cost_price)}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{fmt(p.stock_quantity*p.price)}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm" className="h-7 text-xs rounded-full gap-1"
                            onClick={()=>{ setForm(f=>({...f,product_id:p.id,movement_type:"in",reason:""})); setSelectedProduct(p); setDialogOpen(true); }}>
                            <Plus className="h-3 w-3"/>Adjust
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="border-t px-4 py-3 flex justify-between text-xs text-muted-foreground">
                <span>{filtered.length} product{filtered.length!==1?"s":""}</span>
                <div className="flex gap-4 font-semibold">
                  <span className="text-blue-600">Cost: {fmt(filtered.reduce((s,p)=>s+p.stock_quantity*p.cost_price,0))}</span>
                  <span className="text-teal-600">Retail: {fmt(filtered.reduce((s,p)=>s+p.stock_quantity*p.price,0))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* VALUATION CHART */}
        <TabsContent value="valuation" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Top 10 Products by Inventory Value (Cost)</CardTitle></CardHeader>
            <CardContent>
              {chartData.length===0
                ?<div className="py-16 text-center text-muted-foreground">No data</div>
                :<ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData} layout="vertical" margin={{left:0,right:24,top:5,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false}/>
                    <XAxis type="number" tick={{fontSize:10}} stroke="hsl(var(--muted-foreground))" tickFormatter={v=>`$${v}`}/>
                    <YAxis type="category" dataKey="name" tick={{fontSize:10}} width={100} stroke="hsl(var(--muted-foreground))"/>
                    <Tooltip formatter={(v:any,_:any,props:any)=>[`${fmt(Number(v))} (${props.payload.qty} units)`,"Stock Value"]} contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:8,fontSize:12}}/>
                    <Bar dataKey="value" radius={[0,4,4,0]}>
                      {chartData.map((_,i)=><Cell key={i} fill={`hsl(${180-i*12} 65% ${45+i*2}%)`}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              }
            </CardContent>
          </Card>
        </TabsContent>

        {/* MOVEMENT HISTORY */}
        <TabsContent value="movements" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Stock Movement History</CardTitle>
                <span className="text-xs text-muted-foreground">Last 200 movements</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">Date & Time</TableHead>
                    <TableHead className="text-xs">Product</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs text-center">Qty Change</TableHead>
                    <TableHead className="text-xs">Reason</TableHead>
                    <TableHead className="text-xs">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length===0&&<TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No movements recorded</TableCell></TableRow>}
                  {movements.map(m=>{
                    const isIn=m.quantity>0;
                    return (
                      <TableRow key={m.id} className="hover:bg-muted/20">
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(m.created_at)}</TableCell>
                        <TableCell className="text-sm font-medium">{m.products?.name||"—"}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] border-0 capitalize flex items-center gap-1 w-fit ${m.movement_type==="in"?"bg-emerald-100 text-emerald-700":m.movement_type==="out"?"bg-red-100 text-red-700":"bg-blue-100 text-blue-700"}`}>
                            {m.movement_type==="in"?<TrendingUp className="h-2.5 w-2.5"/>:m.movement_type==="out"?<TrendingDown className="h-2.5 w-2.5"/>:<SlidersHorizontal className="h-2.5 w-2.5"/>}
                            {m.movement_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`text-sm font-bold ${isIn?"text-emerald-600":"text-red-500"}`}>
                            {isIn?"+":""}{m.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.reason||"—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">{m.notes||"—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
