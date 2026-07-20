import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  Users, Calendar, Activity, Download, FileText,
  Search, RefreshCw, UserCheck, Globe, Smartphone,
  TrendingUp, Eye, Clock, Filter, MessageCircle
} from "lucide-react";

interface Profile { id: string; email: string|null; full_name: string|null; phone: string|null; created_at: string; }
interface VisitorLog { id: string; user_id: string|null; session_id: string; page_path: string|null; visited_at: string; user_agent: string|null; }
interface OrderSummary { user_id: string; total_orders: number; total_spent: number; }

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
const fmtDateTime = (d: string) => new Date(d).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});

export const UserManager = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [orderSummaries, setOrderSummaries] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, logsRes, ordersRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at",{ascending:false}),
      supabase.from("visitor_logs").select("*").order("visited_at",{ascending:false}).limit(500),
      supabase.from("orders").select("user_id, total").not("user_id","is",null),
    ]);
    setProfiles(profilesRes.data||[]);
    setLogs(logsRes.data||[]);

    // Aggregate orders per user
    const map: Record<string,{total_orders:number;total_spent:number}> = {};
    (ordersRes.data||[]).forEach((o:any)=>{
      if(!map[o.user_id]) map[o.user_id]={total_orders:0,total_spent:0};
      map[o.user_id].total_orders++;
      map[o.user_id].total_spent+=o.total;
    });
    setOrderSummaries(Object.entries(map).map(([user_id,v])=>({user_id,...v})));
    setLoading(false);
  };

  // KPIs
  const kpi = useMemo(()=>{
    const today=new Date().toDateString();
    const uniqueSessions=new Set(logs.map(l=>l.session_id));
    const todayLogs=logs.filter(l=>new Date(l.visited_at).toDateString()===today);
    const registeredVisits=logs.filter(l=>l.user_id);
    const thisWeek=new Date(); thisWeek.setDate(thisWeek.getDate()-7);
    const newThisWeek=profiles.filter(p=>new Date(p.created_at)>=thisWeek).length;
    return {
      totalUsers:profiles.length, uniqueVisitors:uniqueSessions.size,
      todayVisits:todayLogs.length, registeredVisits:registeredVisits.length,
      newThisWeek, totalLogged:logs.length,
    };
  },[profiles,logs]);

  // Signups by day for chart
  const signupChart = useMemo(()=>{
    const map: Record<string,number>={};
    for(let i=29;i>=0;i--){
      const d=new Date(); d.setDate(d.getDate()-i);
      map[d.toLocaleDateString("en-GB",{day:"numeric",month:"short"})]=0;
    }
    profiles.forEach(p=>{
      const k=new Date(p.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"});
      if(k in map) map[k]++;
    });
    return Object.entries(map).map(([date,signups])=>({date,signups}));
  },[profiles]);

  // Visits by day
  const visitsChart = useMemo(()=>{
    const map: Record<string,number>={};
    for(let i=13;i>=0;i--){
      const d=new Date(); d.setDate(d.getDate()-i);
      map[d.toLocaleDateString("en-GB",{day:"numeric",month:"short"})]=0;
    }
    logs.forEach(l=>{
      const k=new Date(l.visited_at).toLocaleDateString("en-GB",{day:"numeric",month:"short"});
      if(k in map) map[k]++;
    });
    return Object.entries(map).map(([date,visits])=>({date,visits}));
  },[logs]);

  // Filtered users
  const filteredUsers = useMemo(()=>profiles.filter(p=>
    search===""||
    p.email?.toLowerCase().includes(search.toLowerCase())||
    p.full_name?.toLowerCase().includes(search.toLowerCase())||
    p.phone?.includes(search)
  ),[profiles,search]);

  // User device breakdown
  const deviceBreakdown = useMemo(()=>{
    let mobile=0,desktop=0,other=0;
    logs.forEach(l=>{
      const ua=(l.user_agent||"").toLowerCase();
      if(ua.includes("mobile")||ua.includes("android")||ua.includes("iphone")) mobile++;
      else if(ua.includes("mozilla")||ua.includes("chrome")||ua.includes("safari")) desktop++;
      else other++;
    });
    return {mobile,desktop,other};
  },[logs]);

  const exportCSV = () => {
    const rows=[["Email","Full Name","Phone","Joined","Orders","Total Spent"],
      ...filteredUsers.map(p=>{
        const ord=orderSummaries.find(o=>o.user_id===p.id);
        return [p.email||"",p.full_name||"",p.phone||"",fmtDate(p.created_at),ord?.total_orders||0,`$${(ord?.total_spent||0).toFixed(2)}`];
      })];
    const blob=new Blob([rows.map(r=>r.join(",")).join("\n")],{type:"text/csv"});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download=`users-${new Date().toISOString().split("T")[0]}.csv`; a.click();
  };

  const exportPDF = () => {
    const doc=new jsPDF();
    doc.setFontSize(14); doc.text("TuppAfrica — User Report",14,14);
    doc.setFontSize(9); doc.setTextColor(100);
    doc.text(`Total Users: ${kpi.totalUsers}   Generated: ${new Date().toLocaleString()}`,14,20);
    autoTable(doc,{
      head:[["Email","Full Name","Phone","Joined","Orders","Spent"]],
      body:filteredUsers.map(p=>{
        const ord=orderSummaries.find(o=>o.user_id===p.id);
        return [p.email||"—",p.full_name||"—",p.phone||"—",fmtDate(p.created_at),ord?.total_orders||0,`$${(ord?.total_spent||0).toFixed(2)}`];
      }),
      startY:24, styles:{fontSize:8}, headStyles:{fillColor:[13,148,136]},
    });
    doc.save(`users-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const exportExcel = () => {
    const ws=XLSX.utils.json_to_sheet(filteredUsers.map(p=>{
      const ord=orderSummaries.find(o=>o.user_id===p.id);
      return {Email:p.email||"",Name:p.full_name||"",Phone:p.phone||"",Joined:fmtDate(p.created_at),Orders:ord?.total_orders||0,"Total Spent":ord?.total_spent||0};
    }));
    const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,"Users");
    XLSX.writeFile(wb,`users-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const whatsappUser = (phone: string, name: string) => {
    const msg=encodeURIComponent(`Hi ${name?.split(" ")[0]||""}! 👋\n\nThis is a message from TuppAfrica Zimbabwe. How can we help you today?\n\n— TuppAfrica Team 🇿🇼`);
    window.open(`https://wa.me/${phone.replace(/\D/g,"")}?text=${msg}`,"_blank");
  };

  if (loading) return <div className="py-20 text-center text-muted-foreground animate-pulse">Loading users…</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2"><Users className="h-5 w-5 text-primary"/>Customer & Traffic Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Registered users, visitor analytics & device breakdown</p>
        </div>
        <Button size="sm" variant="outline" onClick={fetchData} className="h-8 rounded-full px-3 gap-1.5"><RefreshCw className="h-3.5 w-3.5"/>Refresh</Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {[
          {label:"Registered Users", value:kpi.totalUsers,       icon:UserCheck, color:"primary"},
          {label:"New This Week",    value:kpi.newThisWeek,      icon:TrendingUp,color:"emerald"},
          {label:"Unique Visitors",  value:kpi.uniqueVisitors,   icon:Globe,     color:"blue"},
          {label:"Today's Visits",   value:kpi.todayVisits,      icon:Eye,       color:"purple"},
          {label:"Mobile Visitors",  value:deviceBreakdown.mobile,icon:Smartphone,color:"teal"},
          {label:"Total Page Views", value:kpi.totalLogged,      icon:Activity,  color:"amber"},
        ].map(card=>{
          const Icon=card.icon;
          const cmap:Record<string,string>={primary:"text-primary bg-primary/10",emerald:"text-emerald-600 bg-emerald-50",blue:"text-blue-600 bg-blue-50",purple:"text-purple-600 bg-purple-50",teal:"text-teal-600 bg-teal-50",amber:"text-amber-600 bg-amber-50"};
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-xl">
          <TabsTrigger value="users"     className="text-xs">Registered Users ({kpi.totalUsers})</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">Traffic Analytics</TabsTrigger>
          <TabsTrigger value="activity"  className="text-xs">Recent Activity</TabsTrigger>
        </TabsList>

        {/* USERS TABLE */}
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
                  <Input placeholder="Search email, name, phone…" value={search} onChange={e=>setSearch(e.target.value)} className="h-8 pl-8 w-56 text-xs rounded-full"/>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full text-xs" onClick={exportCSV}><Download className="h-3.5 w-3.5"/>CSV</Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full text-xs" onClick={exportPDF}><FileText className="h-3.5 w-3.5"/>PDF</Button>
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-full text-xs" onClick={exportExcel}><Download className="h-3.5 w-3.5"/>Excel</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">User</TableHead>
                    <TableHead className="text-xs">Phone</TableHead>
                    <TableHead className="text-xs text-center">Orders</TableHead>
                    <TableHead className="text-xs text-right">Spent</TableHead>
                    <TableHead className="text-xs">Joined</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length===0&&<TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No users found</TableCell></TableRow>}
                  {filteredUsers.map(p=>{
                    const ord=orderSummaries.find(o=>o.user_id===p.id);
                    const initials=((p.full_name||p.email||"?").split(" ").map((n:string)=>n[0]).join("").toUpperCase().slice(0,2));
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white text-xs font-bold flex items-center justify-center shrink-0">{initials}</div>
                            <div>
                              <p className="text-sm font-medium">{p.full_name||"—"}</p>
                              <p className="text-xs text-muted-foreground">{p.email||"—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.phone||"—"}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`text-xs border-0 ${ord?.total_orders??"0">=1?"bg-primary/10 text-primary":"bg-muted text-muted-foreground"}`}>
                            {ord?.total_orders||0}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm font-bold">{ord?.total_spent?`$${ord.total_spent.toFixed(2)}`:"—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(p.created_at)}</TableCell>
                        <TableCell className="text-right">
                          {p.phone&&(
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" title="WhatsApp" onClick={()=>whatsappUser(p.phone!,p.full_name||"")}>
                              <MessageCircle className="h-3.5 w-3.5"/>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="border-t px-4 py-3 text-xs text-muted-foreground">{filteredUsers.length} user{filteredUsers.length!==1?"s":""}</div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS */}
        <TabsContent value="analytics" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">New Signups (Last 30 Days)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={signupChart} margin={{top:5,right:5,left:0,bottom:5}}>
                    <defs><linearGradient id="gSignup" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0d9488" stopOpacity={0.3}/><stop offset="95%" stopColor="#0d9488" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                    <XAxis dataKey="date" tick={{fontSize:9}} stroke="hsl(var(--muted-foreground))" interval={6}/>
                    <YAxis tick={{fontSize:10}} stroke="hsl(var(--muted-foreground))" allowDecimals={false}/>
                    <Tooltip contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:8,fontSize:12}}/>
                    <Area type="monotone" dataKey="signups" name="Signups" stroke="#0d9488" strokeWidth={2} fill="url(#gSignup)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Page Views (Last 14 Days)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={visitsChart} margin={{top:5,right:5,left:0,bottom:5}}>
                    <defs><linearGradient id="gVisits" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                    <XAxis dataKey="date" tick={{fontSize:9}} stroke="hsl(var(--muted-foreground))"/>
                    <YAxis tick={{fontSize:10}} stroke="hsl(var(--muted-foreground))" allowDecimals={false}/>
                    <Tooltip contentStyle={{background:"hsl(var(--card))",border:"1px solid hsl(var(--border))",borderRadius:8,fontSize:12}}/>
                    <Area type="monotone" dataKey="visits" name="Page Views" stroke="#8b5cf6" strokeWidth={2} fill="url(#gVisits)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          {/* Device breakdown */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Device Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  {label:"Desktop",value:deviceBreakdown.desktop,color:"bg-primary",icon:Globe},
                  {label:"Mobile", value:deviceBreakdown.mobile, color:"bg-teal-500", icon:Smartphone},
                  {label:"Other",  value:deviceBreakdown.other,  color:"bg-slate-400",icon:Activity},
                ].map(item=>{
                  const total=deviceBreakdown.desktop+deviceBreakdown.mobile+deviceBreakdown.other;
                  const pct=total>0?Math.round(item.value/total*100):0;
                  const Icon=item.icon;
                  return (
                    <div key={item.label} className="text-center space-y-2">
                      <Icon className={`h-8 w-8 mx-auto ${item.color.replace("bg-","text-")}`}/>
                      <p className="text-2xl font-extrabold">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.label} ({pct}%)</p>
                      <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={`h-full rounded-full ${item.color}`} style={{width:`${pct}%`}}/></div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ACTIVITY LOG */}
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Recent Page Activity</CardTitle>
                <span className="text-xs text-muted-foreground">Last 500 visits</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">Date & Time</TableHead>
                    <TableHead className="text-xs">Page</TableHead>
                    <TableHead className="text-xs">Visitor Type</TableHead>
                    <TableHead className="text-xs">Session</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.slice(0,100).map(log=>(
                    <TableRow key={log.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(log.visited_at)}</TableCell>
                      <TableCell className="text-xs font-mono">{log.page_path||"/"}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] border-0 ${log.user_id?"bg-primary/10 text-primary":"bg-muted text-muted-foreground"}`}>
                          {log.user_id?"Registered":"Guest"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{log.session_id.slice(0,12)}…</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
