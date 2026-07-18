import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { z } from "zod";
import {
  Plus, Download, Edit, Trash2, TrendingUp, TrendingDown,
  DollarSign, FileText, Filter, Search, ArrowUpRight,
  ArrowDownRight, Receipt, Wallet, PieChart as PieIcon,
  BarChart2, RefreshCw, ChevronDown, Tag, AlertCircle,
  CheckCircle2, Clock, X
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────
interface Transaction {
  id: string;
  transaction_type: "income" | "expense";
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  reference?: string | null;
  payment_method?: string | null;
  status?: string;
  created_at?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────
const INCOME_CATEGORIES = [
  "Product Sales", "Wholesale", "Delivery Fees", "Refund Recovery",
  "Consulting / Services", "Interest Income", "Other Income",
];
const EXPENSE_CATEGORIES = [
  "Inventory Purchase", "Salaries & Wages", "Rent & Lease",
  "Utilities", "Marketing & Advertising", "Transport & Delivery",
  "Packaging", "Bank Charges", "Tax & Duties", "Equipment",
  "Software & Subscriptions", "Repairs & Maintenance",
  "Insurance", "Other Expense",
];
const PAYMENT_METHODS = ["Cash", "EcoCash", "OneMoney", "Bank Transfer", "Paynow", "Visa/Mastercard", "Other"];
const STATUSES = ["completed", "pending", "cancelled"];
const COLORS = ["#0d9488","#06b6d4","#f59e0b","#8b5cf6","#ec4899","#10b981","#f97316","#64748b"];

const STATUS_BADGE: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  pending:   "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
};

const transactionSchema = z.object({
  transaction_type: z.enum(["income","expense"]),
  category: z.string().trim().min(1,"Category required"),
  amount: z.number().positive("Amount must be positive"),
  description: z.string().max(500).optional().nullable(),
  transaction_date: z.string().min(1,"Date required"),
  reference: z.string().max(100).optional().nullable(),
  payment_method: z.string().optional().nullable(),
  status: z.string().optional(),
});

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
const monthKey = (d: string) => new Date(d).toLocaleDateString("en-GB", { month:"short", year:"numeric" });

export const AccountingManager = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [period, setPeriod] = useState("month");

  const [form, setForm] = useState({
    transaction_type: "income",
    category: "",
    amount: "",
    description: "",
    transaction_date: new Date().toISOString().split("T")[0],
    reference: "",
    payment_method: "",
    status: "completed",
  });

  useEffect(() => { applyPeriod(period); }, [period]);
  useEffect(() => { fetchTransactions(); }, [dateFrom, dateTo]);

  const applyPeriod = (p: string) => {
    const now = new Date();
    const to = now.toISOString().split("T")[0];
    let from = to;
    if (p === "week")  { const d = new Date(now); d.setDate(d.getDate()-7);   from = d.toISOString().split("T")[0]; }
    if (p === "month") { const d = new Date(now); d.setDate(1);               from = d.toISOString().split("T")[0]; }
    if (p === "quarter"){ const d = new Date(now); d.setMonth(d.getMonth()-3); from = d.toISOString().split("T")[0]; }
    if (p === "year")  { const d = new Date(now); d.setMonth(0,1);            from = d.toISOString().split("T")[0]; }
    if (p === "all")   { from = "2020-01-01"; }
    setDateFrom(from); setDateTo(to);
  };

  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .gte("transaction_date", dateFrom)
      .lte("transaction_date", dateTo + "T23:59:59")
      .order("transaction_date", { ascending: false });
    if (error) toast.error("Failed to load transactions");
    else setTransactions(data || []);
    setLoading(false);
  };

  // ── Filtered rows ──────────────────────────────────────────────────────
  const filtered = useMemo(() => transactions.filter(t => {
    if (typeFilter !== "all" && t.transaction_type !== typeFilter) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (statusFilter !== "all" && (t.status || "completed") !== statusFilter) return false;
    if (search && !t.description?.toLowerCase().includes(search.toLowerCase()) &&
        !t.category.toLowerCase().includes(search.toLowerCase()) &&
        !t.reference?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [transactions, typeFilter, categoryFilter, statusFilter, search]);

  // ── KPIs ──────────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const income  = filtered.filter(t => t.transaction_type === "income"  && (t.status||"completed") === "completed").reduce((s,t) => s+t.amount, 0);
    const expense = filtered.filter(t => t.transaction_type === "expense" && (t.status||"completed") === "completed").reduce((s,t) => s+t.amount, 0);
    const pending = filtered.filter(t => (t.status||"completed") === "pending").reduce((s,t) => s+t.amount, 0);
    const profit  = income - expense;
    const margin  = income > 0 ? (profit/income)*100 : 0;
    return { income, expense, profit, margin, pending, count: filtered.length };
  }, [filtered]);

  // ── Chart data ────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const map: Record<string, { income:number; expense:number }> = {};
    filtered.forEach(t => {
      const k = monthKey(t.transaction_date);
      if (!map[k]) map[k] = { income:0, expense:0 };
      if ((t.status||"completed") === "completed") map[k][t.transaction_type] += t.amount;
    });
    return Object.entries(map).reverse().map(([month, v]) => ({ month, ...v, profit: v.income - v.expense }));
  }, [filtered]);

  const categoryChartIncome = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.transaction_type === "income" && (t.status||"completed") === "completed").forEach(t => { map[t.category] = (map[t.category]||0)+t.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filtered]);

  const categoryChartExpense = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.transaction_type === "expense" && (t.status||"completed") === "completed").forEach(t => { map[t.category] = (map[t.category]||0)+t.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filtered]);

  const allCategories = useMemo(() => [...new Set(transactions.map(t => t.category))], [transactions]);

  // ── CRUD ──────────────────────────────────────────────────────────────
  const resetForm = () => {
    setForm({ transaction_type:"income", category:"", amount:"", description:"", transaction_date: new Date().toISOString().split("T")[0], reference:"", payment_method:"", status:"completed" });
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = transactionSchema.parse({
        transaction_type: form.transaction_type as "income"|"expense",
        category: form.category,
        amount: parseFloat(form.amount),
        description: form.description || null,
        transaction_date: new Date(form.transaction_date).toISOString(),
        reference: form.reference || null,
        payment_method: form.payment_method || null,
        status: form.status || "completed",
      });
      const { error } = editing
        ? await supabase.from("transactions").update(payload).eq("id", editing.id)
        : await supabase.from("transactions").insert([payload]);
      if (error) throw error;
      toast.success(editing ? "Transaction updated!" : "Transaction recorded!");
      setDialogOpen(false); resetForm(); fetchTransactions();
    } catch (err: any) {
      toast.error(err instanceof z.ZodError ? err.errors[0].message : err.message);
    }
  };

  const handleEdit = (t: Transaction) => {
    setEditing(t);
    setForm({
      transaction_type: t.transaction_type, category: t.category,
      amount: t.amount.toString(), description: t.description || "",
      transaction_date: t.transaction_date.split("T")[0],
      reference: t.reference || "", payment_method: t.payment_method || "",
      status: t.status || "completed",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction? This cannot be undone.")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Deleted"); fetchTransactions(); }
  };

  // ── Exports ───────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows = [
      ["Date","Type","Category","Reference","Payment Method","Amount","Status","Description"],
      ...filtered.map(t => [
        fmtDate(t.transaction_date), t.transaction_type, t.category,
        t.reference||"", t.payment_method||"", t.amount.toFixed(2),
        t.status||"completed", t.description||"",
      ]),
    ];
    const blob = new Blob([rows.map(r=>r.join(",")).join("\n")], { type:"text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `tuppafrica-accounts-${dateFrom}-to-${dateTo}.csv`; a.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("TuppAfrica — Financial Report", 14, 16);
    doc.setFontSize(10); doc.setTextColor(100);
    doc.text(`Period: ${fmtDate(dateFrom)} to ${fmtDate(dateTo)}   Generated: ${new Date().toLocaleString()}`, 14, 24);
    doc.setFontSize(11); doc.setTextColor(0);
    doc.text(`Income: ${fmt(kpi.income)}   Expenses: ${fmt(kpi.expense)}   Net Profit: ${fmt(kpi.profit)}   Margin: ${kpi.margin.toFixed(1)}%`, 14, 32);
    autoTable(doc, {
      head: [["Date","Type","Category","Reference","Method","Amount","Status","Description"]],
      body: filtered.map(t => [
        fmtDate(t.transaction_date), t.transaction_type, t.category,
        t.reference||"", t.payment_method||"", `$${t.amount.toFixed(2)}`,
        t.status||"completed", t.description||"",
      ]),
      startY: 38,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [13,148,136] },
      alternateRowStyles: { fillColor: [245,255,254] },
    });
    doc.save(`tuppafrica-report-${dateFrom}-${dateTo}.pdf`);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(t => ({
      Date: fmtDate(t.transaction_date), Type: t.transaction_type, Category: t.category,
      Reference: t.reference||"", "Payment Method": t.payment_method||"",
      Amount: t.amount, Status: t.status||"completed", Description: t.description||"",
    })));
    // Summary sheet
    const summary = XLSX.utils.json_to_sheet([
      { Metric:"Total Income",  Value: kpi.income  },
      { Metric:"Total Expenses",Value: kpi.expense },
      { Metric:"Net Profit",    Value: kpi.profit  },
      { Metric:"Profit Margin", Value: `${kpi.margin.toFixed(1)}%` },
      { Metric:"Transactions",  Value: kpi.count   },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.utils.book_append_sheet(wb, summary, "Summary");
    XLSX.writeFile(wb, `tuppafrica-accounts-${dateFrom}-${dateTo}.xlsx`);
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ── HEADER BAR ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /> Accounting</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Full financial ledger — income, expenses, profit & loss</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-8 w-32 text-xs rounded-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="h-8 w-36 text-xs rounded-full" />
          <span className="self-center text-xs text-muted-foreground">to</span>
          <Input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="h-8 w-36 text-xs rounded-full" />
          <Button size="sm" variant="outline" onClick={fetchTransactions} className="h-8 rounded-full px-3"><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label:"Revenue", value:fmt(kpi.income),  sub:`${filtered.filter(t=>t.transaction_type==="income").length} entries`, icon:TrendingUp, color:"emerald" },
          { label:"Expenses", value:fmt(kpi.expense), sub:`${filtered.filter(t=>t.transaction_type==="expense").length} entries`, icon:TrendingDown, color:"red" },
          { label:"Net Profit", value:fmt(kpi.profit), sub:kpi.profit>=0?"Profitable":"Loss making", icon:DollarSign, color:kpi.profit>=0?"teal":"red" },
          { label:"Margin", value:`${kpi.margin.toFixed(1)}%`, sub:"Profit margin", icon:BarChart2, color:"blue" },
          { label:"Pending", value:fmt(kpi.pending), sub:"Awaiting completion", icon:Clock, color:"amber" },
          { label:"Transactions", value:kpi.count.toString(), sub:"In period", icon:Receipt, color:"purple" },
        ].map(card => {
          const Icon = card.icon;
          const colors: Record<string,string> = { emerald:"text-emerald-600 bg-emerald-50", red:"text-red-500 bg-red-50", teal:"text-teal-600 bg-teal-50", blue:"text-blue-600 bg-blue-50", amber:"text-amber-600 bg-amber-50", purple:"text-purple-600 bg-purple-50" };
          return (
            <Card key={card.label} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{card.label}</p>
                    <p className={`text-lg font-extrabold mt-0.5 ${colors[card.color]?.split(" ")[0]}`}>{card.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
                  </div>
                  <div className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center ${colors[card.color]}`}><Icon className="h-4 w-4" /></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── MAIN TABS ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 rounded-xl">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="ledger"   className="text-xs">Ledger</TabsTrigger>
          <TabsTrigger value="charts"   className="text-xs">Charts</TabsTrigger>
          <TabsTrigger value="pl"       className="text-xs">P&amp;L Report</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Income vs Expense area chart */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Income vs Expenses (Monthly)</CardTitle></CardHeader>
              <CardContent>
                {chartData.length === 0
                  ? <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No data for period</div>
                  : <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData} margin={{top:5,right:5,left:0,bottom:5}}>
                        <defs>
                          <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/><stop offset="95%" stopColor="#0d9488" stopOpacity={0}/></linearGradient>
                          <linearGradient id="gExpense" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/><stop offset="95%" stopColor="#f87171" stopOpacity={0}/></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{fontSize:10}} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{fontSize:10}} stroke="hsl(var(--muted-foreground))" tickFormatter={v=>`$${v}`} />
                        <Tooltip formatter={(v:any)=>[`$${Number(v).toFixed(2)}`]} contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:8,fontSize:12}} />
                        <Legend iconSize={10} wrapperStyle={{fontSize:11}} />
                        <Area type="monotone" dataKey="income" name="Income" stroke="#0d9488" strokeWidth={2} fill="url(#gIncome)" />
                        <Area type="monotone" dataKey="expense" name="Expenses" stroke="#f87171" strokeWidth={2} fill="url(#gExpense)" />
                      </AreaChart>
                    </ResponsiveContainer>
                }
              </CardContent>
            </Card>

            {/* Profit bar */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Net Profit</CardTitle></CardHeader>
              <CardContent>
                {chartData.length === 0
                  ? <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">No data for period</div>
                  : <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData} margin={{top:5,right:5,left:0,bottom:5}}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{fontSize:10}} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{fontSize:10}} stroke="hsl(var(--muted-foreground))" tickFormatter={v=>`$${v}`} />
                        <Tooltip formatter={(v:any)=>[`$${Number(v).toFixed(2)}`, "Net Profit"]} contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:8,fontSize:12}} />
                        <Bar dataKey="profit" name="Net Profit" radius={[4,4,0,0]}>
                          {chartData.map((entry,i) => <Cell key={i} fill={entry.profit>=0?"#0d9488":"#f87171"} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                }
              </CardContent>
            </Card>
          </div>

          {/* Top income / expense categories */}
          <div className="grid gap-4 lg:grid-cols-2">
            {[
              { title:"Top Income Categories", data:categoryChartIncome, color:"#0d9488" },
              { title:"Top Expense Categories", data:categoryChartExpense, color:"#f87171" },
            ].map(({ title, data, color }) => (
              <Card key={title}>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
                <CardContent>
                  {data.length === 0
                    ? <div className="text-center py-6 text-sm text-muted-foreground">No data</div>
                    : <div className="space-y-2">
                        {data.slice(0,6).map((item, i) => {
                          const total = data.reduce((s,d)=>s+d.value,0);
                          const pct = total > 0 ? (item.value/total)*100 : 0;
                          return (
                            <div key={item.name} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-medium truncate max-w-[180px]">{item.name}</span>
                                <span className="font-bold">{fmt(item.value)}</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{width:`${pct}%`, background:COLORS[i%COLORS.length]}} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                  }
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── LEDGER ── */}
        <TabsContent value="ledger" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} className="h-8 pl-8 w-40 text-xs rounded-full" />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-8 w-28 text-xs rounded-full"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-8 w-36 text-xs rounded-full"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 w-28 text-xs rounded-full"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full text-xs" onClick={exportCSV}><Download className="h-3.5 w-3.5"/>CSV</Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full text-xs" onClick={exportPDF}><FileText className="h-3.5 w-3.5"/>PDF</Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full text-xs" onClick={exportExcel}><Download className="h-3.5 w-3.5"/>Excel</Button>
                  <Dialog open={dialogOpen} onOpenChange={v=>{ setDialogOpen(v); if(!v) resetForm(); }}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-8 gap-1.5 rounded-full text-xs" onClick={resetForm}><Plus className="h-3.5 w-3.5"/>Add</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader><DialogTitle>{editing?"Edit Transaction":"New Transaction"}</DialogTitle></DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Type *</Label>
                            <Select value={form.transaction_type} onValueChange={v=>setForm({...form,transaction_type:v,category:""})}>
                              <SelectTrigger className="rounded-xl h-9"><SelectValue/></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="income">💰 Income</SelectItem>
                                <SelectItem value="expense">💸 Expense</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Category *</Label>
                            <Select value={form.category} onValueChange={v=>setForm({...form,category:v})}>
                              <SelectTrigger className="rounded-xl h-9"><SelectValue placeholder="Select…"/></SelectTrigger>
                              <SelectContent>
                                {(form.transaction_type==="income"?INCOME_CATEGORIES:EXPENSE_CATEGORIES).map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Amount (USD) *</Label>
                            <Input type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} className="rounded-xl h-9" required />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Date *</Label>
                            <Input type="date" value={form.transaction_date} onChange={e=>setForm({...form,transaction_date:e.target.value})} className="rounded-xl h-9" required />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Payment Method</Label>
                            <Select value={form.payment_method} onValueChange={v=>setForm({...form,payment_method:v})}>
                              <SelectTrigger className="rounded-xl h-9"><SelectValue placeholder="Select…"/></SelectTrigger>
                              <SelectContent>{PAYMENT_METHODS.map(m=><SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Status</Label>
                            <Select value={form.status} onValueChange={v=>setForm({...form,status:v})}>
                              <SelectTrigger className="rounded-xl h-9"><SelectValue/></SelectTrigger>
                              <SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Reference / Invoice #</Label>
                          <Input placeholder="INV-2026-001" value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})} className="rounded-xl h-9" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Description / Notes</Label>
                          <Textarea rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="rounded-xl resize-none text-sm" />
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                          <Button type="button" variant="outline" className="rounded-full" onClick={()=>{setDialogOpen(false);resetForm();}}>Cancel</Button>
                          <Button type="submit" className="rounded-full">{editing?"Update":"Save Transaction"}</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? <div className="py-16 text-center text-muted-foreground animate-pulse">Loading ledger…</div>
              : filtered.length === 0 ? <div className="py-16 text-center text-muted-foreground"><Receipt className="h-10 w-10 mx-auto mb-3 opacity-30"/><p>No transactions found</p></div>
              : <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-xs">Reference</TableHead>
                        <TableHead className="text-xs">Method</TableHead>
                        <TableHead className="text-xs">Description</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs text-right">Amount</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(t => (
                        <TableRow key={t.id} className="hover:bg-muted/20">
                          <TableCell className="text-xs whitespace-nowrap">{fmtDate(t.transaction_date)}</TableCell>
                          <TableCell>
                            <span className={`flex items-center gap-1 text-xs font-semibold ${t.transaction_type==="income"?"text-emerald-600":"text-red-500"}`}>
                              {t.transaction_type==="income"?<ArrowUpRight className="h-3 w-3"/>:<ArrowDownRight className="h-3 w-3"/>}
                              {t.transaction_type}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs font-medium">{t.category}</TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">{t.reference||"—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{t.payment_method||"—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">{t.description||"—"}</TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] border-0 ${STATUS_BADGE[t.status||"completed"]}`}>{t.status||"completed"}</Badge>
                          </TableCell>
                          <TableCell className={`text-right text-sm font-bold ${t.transaction_type==="income"?"text-emerald-600":"text-red-500"}`}>
                            {t.transaction_type==="income"?"+":"-"}{fmt(t.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>handleEdit(t)}><Edit className="h-3.5 w-3.5"/></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={()=>handleDelete(t.id)}><Trash2 className="h-3.5 w-3.5"/></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              }
              {filtered.length > 0 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-xs text-muted-foreground">{filtered.length} transaction{filtered.length!==1?"s":""}</p>
                  <div className="flex gap-4 text-xs font-semibold">
                    <span className="text-emerald-600">Income: {fmt(kpi.income)}</span>
                    <span className="text-red-500">Expenses: {fmt(kpi.expense)}</span>
                    <span className={kpi.profit>=0?"text-teal-600":"text-red-600"}>Net: {fmt(kpi.profit)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CHARTS ── */}
        <TabsContent value="charts" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Income by Category</CardTitle></CardHeader>
              <CardContent>
                {categoryChartIncome.length===0 ? <div className="py-12 text-center text-sm text-muted-foreground">No income data</div>
                : <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={categoryChartIncome} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name,percent})=>`${name.split(" ")[0]} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                        {categoryChartIncome.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Pie>
                      <Tooltip formatter={(v:any)=>[fmt(Number(v))]} contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:8,fontSize:12}}/>
                    </PieChart>
                  </ResponsiveContainer>
                }
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Expense by Category</CardTitle></CardHeader>
              <CardContent>
                {categoryChartExpense.length===0 ? <div className="py-12 text-center text-sm text-muted-foreground">No expense data</div>
                : <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={categoryChartExpense} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({name,percent})=>`${name.split(" ")[0]} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                        {categoryChartExpense.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Pie>
                      <Tooltip formatter={(v:any)=>[fmt(Number(v))]} contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:8,fontSize:12}}/>
                    </PieChart>
                  </ResponsiveContainer>
                }
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── P&L REPORT ── */}
        <TabsContent value="pl" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Profit & Loss Statement</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(dateFrom)} — {fmtDate(dateTo)}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1.5 rounded-full text-xs h-8" onClick={exportPDF}><FileText className="h-3.5 w-3.5"/>Export PDF</Button>
                <Button size="sm" variant="outline" className="gap-1.5 rounded-full text-xs h-8" onClick={exportExcel}><Download className="h-3.5 w-3.5"/>Export Excel</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-w-xl space-y-4">
                {/* Income section */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 mb-2">Revenue</h3>
                  {categoryChartIncome.length===0 ? <p className="text-sm text-muted-foreground pl-4">No income recorded</p>
                  : categoryChartIncome.map(item => (
                      <div key={item.name} className="flex justify-between py-1.5 text-sm border-b border-dashed border-border/50">
                        <span className="text-muted-foreground pl-4">{item.name}</span>
                        <span className="font-semibold">{fmt(item.value)}</span>
                      </div>
                    ))
                  }
                  <div className="flex justify-between py-2 font-bold text-sm text-emerald-600 border-t mt-1">
                    <span>Total Revenue</span><span>{fmt(kpi.income)}</span>
                  </div>
                </div>

                <Separator />

                {/* Expense section */}
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-red-500 mb-2">Expenses</h3>
                  {categoryChartExpense.length===0 ? <p className="text-sm text-muted-foreground pl-4">No expenses recorded</p>
                  : categoryChartExpense.map(item => (
                      <div key={item.name} className="flex justify-between py-1.5 text-sm border-b border-dashed border-border/50">
                        <span className="text-muted-foreground pl-4">{item.name}</span>
                        <span className="font-semibold">{fmt(item.value)}</span>
                      </div>
                    ))
                  }
                  <div className="flex justify-between py-2 font-bold text-sm text-red-500 border-t mt-1">
                    <span>Total Expenses</span><span>{fmt(kpi.expense)}</span>
                  </div>
                </div>

                <Separator />

                {/* Bottom line */}
                <div className={`rounded-2xl p-5 ${kpi.profit>=0?"bg-emerald-50 border border-emerald-200":"bg-red-50 border border-red-200"}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Net {kpi.profit>=0?"Profit":"Loss"}</p>
                      <p className={`text-3xl font-extrabold mt-1 ${kpi.profit>=0?"text-emerald-600":"text-red-600"}`}>{fmt(Math.abs(kpi.profit))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Profit Margin</p>
                      <p className={`text-2xl font-extrabold ${kpi.profit>=0?"text-emerald-600":"text-red-600"}`}>{kpi.margin.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
