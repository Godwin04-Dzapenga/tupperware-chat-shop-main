import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus, Edit, Trash2, LogOut, Package, ShoppingBag, Tag,
  Search, BarChart2, Users, Wallet, Grid, List, Image,
  Video, RefreshCw, Eye, Star, AlertTriangle, CheckCircle2,
  Store, ChevronRight, Bell, Settings, ArrowUpRight, Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { InventoryManager } from "@/components/admin/InventoryManager";
import { AccountingManager } from "@/components/admin/AccountingManager";
import { UserManager } from "@/components/admin/UserManager";
import { OrdersManager } from "@/components/admin/OrdersManager";
import { CouponsManager } from "@/components/admin/CouponsManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { z } from "zod";

// ── Schema ─────────────────────────────────────────────────────────────────
const productSchema = z.object({
  name: z.string().trim().min(1,"Name required").max(200),
  description: z.string().max(2000).optional().nullable(),
  price: z.number().min(0,"Price must be positive"),
  cost_price: z.number().min(0),
  stock_quantity: z.number().int().min(0),
  reorder_level: z.number().int().min(0),
  sku: z.string().max(100).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  image_url: z.string().url().optional().nullable().or(z.literal("")),
  video_url: z.string().url().optional().nullable().or(z.literal("")),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

interface Product {
  id: string; name: string; description: string | null;
  price: number; cost_price: number; category_id: string | null;
  image_url: string | null; video_url: string | null;
  stock_quantity: number; reorder_level: number;
  sku: string | null; is_featured?: boolean; is_active?: boolean;
  avg_rating?: number; review_count?: number;
}
interface Category { id: string; name: string; slug: string; }

const EMPTY_FORM = {
  name:"", description:"", price:"", cost_price:"0",
  category_id:"", image_url:"", video_url:"",
  stock_quantity:"0", reorder_level:"10", sku:"",
  is_featured: false, is_active: true,
};

const fmt = (n: number) => `$${n.toLocaleString("en-US",{minimumFractionDigits:2})}`;

const Admin = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product|null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"table"|"grid">("table");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File|null>(null);
  const [videoFile, setVideoFile] = useState<File|null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from("products").select("*").order("created_at",{ascending:false}),
        supabase.from("categories").select("*").order("name"),
      ]);
      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      setProducts(productsRes.data||[]);
      setCategories(categoriesRes.data||[]);
    } catch(err:any) { toast.error(err.message||"Failed to load data"); }
    finally { setLoading(false); }
  };

  const uploadFile = async (file: File, type:"image"|"video"): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${type}s/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-media").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("product-media").getPublicUrl(path).data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = formData.image_url;
      let videoUrl = formData.video_url;
      if (imageFile) imageUrl = await uploadFile(imageFile,"image");
      if (videoFile) videoUrl = await uploadFile(videoFile,"video");

      const payload = productSchema.parse({
        name: formData.name.trim(),
        description: formData.description.trim()||null,
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.cost_price)||0,
        category_id: formData.category_id||null,
        image_url: imageUrl||null,
        video_url: videoUrl||null,
        stock_quantity: parseInt(formData.stock_quantity)||0,
        reorder_level: parseInt(formData.reorder_level)||10,
        sku: formData.sku.trim()||null,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
      });

      const { error } = editingProduct
        ? await supabase.from("products").update(payload).eq("id",editingProduct.id)
        : await supabase.from("products").insert([payload]);
      if (error) throw error;

      toast.success(editingProduct?"Product updated!":"Product added!");
      setDialogOpen(false); resetForm(); fetchData();
    } catch(err:any) {
      toast.error(err instanceof z.ZodError ? err.errors[0].message : err.message||"Failed to save");
    } finally { setUploading(false); }
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name:p.name, description:p.description||"",
      price:p.price.toString(), cost_price:p.cost_price.toString(),
      category_id:p.category_id||"", image_url:p.image_url||"",
      video_url:p.video_url||"", stock_quantity:p.stock_quantity.toString(),
      reorder_level:p.reorder_level.toString(), sku:p.sku||"",
      is_featured:p.is_featured??false, is_active:p.is_active??true,
    });
    setImageFile(null); setVideoFile(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id",id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Product deleted"); fetchData(); }
  };

  const toggleFeatured = async (id: string, is_featured: boolean) => {
    await supabase.from("products").update({is_featured}).eq("id",id);
    setProducts(prev=>prev.map(p=>p.id===id?{...p,is_featured}:p));
    toast.success(is_featured?"Marked as featured":"Removed from featured");
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    await supabase.from("products").update({is_active}).eq("id",id);
    setProducts(prev=>prev.map(p=>p.id===id?{...p,is_active}:p));
    toast.success(is_active?"Product activated":"Product hidden");
  };

  const resetForm = () => { setFormData(EMPTY_FORM); setImageFile(null); setVideoFile(null); setEditingProduct(null); };

  // Filtered products
  const filtered = useMemo(()=>products.filter(p=>{
    const q=searchQuery.toLowerCase();
    if (q && !p.name.toLowerCase().includes(q) && !p.sku?.toLowerCase().includes(q) && !p.description?.toLowerCase().includes(q)) return false;
    if (categoryFilter!=="all" && p.category_id!==categoryFilter) return false;
    if (stockFilter==="low") return p.stock_quantity<=p.reorder_level && p.stock_quantity>0;
    if (stockFilter==="out") return p.stock_quantity===0;
    if (stockFilter==="ok")  return p.stock_quantity>p.reorder_level;
    return true;
  }),[products,searchQuery,categoryFilter,stockFilter]);

  // Admin KPIs
  const kpi = useMemo(()=>({
    products: products.length,
    lowStock: products.filter(p=>p.stock_quantity<=p.reorder_level&&p.stock_quantity>0).length,
    outStock: products.filter(p=>p.stock_quantity===0).length,
    totalRetail: products.reduce((s,p)=>s+p.stock_quantity*p.price,0),
    categories: categories.length,
    featured: products.filter(p=>p.is_featured).length,
  }),[products,categories]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"/>
    </div>
  );

  // ── Product form dialog ────────────────────────────────────────────────
  const ProductDialog = () => (
    <Dialog open={dialogOpen} onOpenChange={v=>{setDialogOpen(v);if(!v)resetForm();}}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 rounded-full" onClick={resetForm}>
          <Plus className="h-4 w-4"/>Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editingProduct?"Edit Product":"Add New Product"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Product Name *</Label>
            <Input placeholder="e.g. Eco Bottle 1L" value={formData.name} onChange={e=>setFormData(f=>({...f,name:e.target.value}))} className="rounded-xl h-9" required/>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Description</Label>
            <Textarea rows={3} placeholder="Describe the product…" value={formData.description} onChange={e=>setFormData(f=>({...f,description:e.target.value}))} className="rounded-xl resize-none text-sm"/>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sell Price (USD) *</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={formData.price} onChange={e=>setFormData(f=>({...f,price:e.target.value}))} className="rounded-xl h-9" required/>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Cost Price (USD)</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={formData.cost_price} onChange={e=>setFormData(f=>({...f,cost_price:e.target.value}))} className="rounded-xl h-9"/>
              {formData.price && formData.cost_price && parseFloat(formData.price)>0 && (
                <p className="text-[10px] text-emerald-600 font-semibold">
                  Margin: {(((parseFloat(formData.price)-parseFloat(formData.cost_price))/parseFloat(formData.price))*100).toFixed(1)}%
                </p>
              )}
            </div>
          </div>

          {/* Category + SKU */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Category</Label>
              <Select value={formData.category_id} onValueChange={v=>setFormData(f=>({...f,category_id:v}))}>
                <SelectTrigger className="rounded-xl h-9"><SelectValue placeholder="Select…"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">SKU</Label>
              <Input placeholder="TUP-001" value={formData.sku} onChange={e=>setFormData(f=>({...f,sku:e.target.value}))} className="rounded-xl h-9 font-mono text-sm"/>
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Stock Quantity *</Label>
              <Input type="number" min="0" value={formData.stock_quantity} onChange={e=>setFormData(f=>({...f,stock_quantity:e.target.value}))} className="rounded-xl h-9" required/>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Reorder Level</Label>
              <Input type="number" min="0" value={formData.reorder_level} onChange={e=>setFormData(f=>({...f,reorder_level:e.target.value}))} className="rounded-xl h-9"/>
              <p className="text-[10px] text-muted-foreground">Alert fires when stock hits this</p>
            </div>
          </div>

          {/* Image */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Image className="h-3 w-3"/>Product Image</Label>
            <Input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f){setImageFile(f);setFormData(fd=>({...fd,image_url:URL.createObjectURL(f)}));}}} className="rounded-xl h-9 text-xs"/>
            <div className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground">Or paste an image URL:</p>
              <Input placeholder="https://…" value={formData.image_url} onChange={e=>setFormData(f=>({...f,image_url:e.target.value}))} className="rounded-xl h-9 text-sm"/>
            </div>
            {formData.image_url && (
              <img src={formData.image_url} alt="Preview" className="h-28 w-full object-cover rounded-xl border mt-1" onError={e=>e.currentTarget.style.display="none"}/>
            )}
          </div>

          {/* Video */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Video className="h-3 w-3"/>Product Video (optional)</Label>
            <Input type="file" accept="video/*" onChange={e=>{const f=e.target.files?.[0];if(f){setVideoFile(f);setFormData(fd=>({...fd,video_url:URL.createObjectURL(f)}));}}} className="rounded-xl h-9 text-xs"/>
            <Input placeholder="Or paste video URL…" value={formData.video_url} onChange={e=>setFormData(f=>({...f,video_url:e.target.value}))} className="rounded-xl h-9 text-sm mt-1"/>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-xs font-semibold">Featured</p>
                <p className="text-[10px] text-muted-foreground">Show in featured section</p>
              </div>
              <Switch checked={formData.is_featured} onCheckedChange={v=>setFormData(f=>({...f,is_featured:v}))}/>
            </div>
            <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-xs font-semibold">Active</p>
                <p className="text-[10px] text-muted-foreground">Visible in store</p>
              </div>
              <Switch checked={formData.is_active} onCheckedChange={v=>setFormData(f=>({...f,is_active:v}))}/>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={()=>{setDialogOpen(false);resetForm();}}>Cancel</Button>
            <Button type="submit" className="rounded-full" disabled={uploading}>
              {uploading?"Uploading…":editingProduct?"Update Product":"Add Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen bg-muted/20">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-50 border-b bg-card/98 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 py-0">
          <div className="flex items-center gap-4 h-14">
            {/* Logo + title */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
                <Shield className="h-4 w-4"/>
              </div>
              <div>
                <p className="text-sm font-extrabold leading-none">TuppAfrica</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Admin Dashboard</p>
              </div>
            </div>

            <Separator orientation="vertical" className="h-6 mx-1"/>

            {/* Quick nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {[
                {id:"analytics",label:"Analytics",icon:BarChart2},
                {id:"products",label:"Products",icon:Package},
                {id:"orders",label:"Orders",icon:ShoppingBag},
                {id:"inventory",label:"Inventory",icon:Grid},
                {id:"accounting",label:"Accounting",icon:Wallet},
                {id:"users",label:"Users",icon:Users},
              ].map(item=>{
                const Icon=item.icon;
                return (
                  <button key={item.id} onClick={()=>setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab===item.id?"bg-primary text-primary-foreground shadow-sm":"text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                    <Icon className="h-3.5 w-3.5"/>{item.label}
                  </button>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-2">
              {/* Quick stats */}
              <div className="hidden lg:flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Package className="h-3.5 w-3.5"/>{kpi.products} products
                </span>
                {kpi.outStock>0&&(
                  <span className="flex items-center gap-1 text-red-500 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5"/>{kpi.outStock} out of stock
                  </span>
                )}
                {kpi.lowStock>0&&(
                  <span className="flex items-center gap-1 text-amber-500 font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5"/>{kpi.lowStock} low stock
                  </span>
                )}
              </div>

              <Separator orientation="vertical" className="h-6 hidden lg:block"/>

              <div className="flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1">
                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center uppercase">
                  {(user?.email||"A")[0]}
                </div>
                <span className="text-xs font-medium hidden sm:inline max-w-[120px] truncate text-muted-foreground">{user?.email}</span>
              </div>

              <Button variant="outline" size="sm" className="h-8 rounded-full gap-1.5 text-xs" onClick={()=>navigate("/")}>
                <Store className="h-3.5 w-3.5"/>View Store
              </Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-full gap-1.5 text-xs text-muted-foreground hover:text-destructive" onClick={signOut}>
                <LogOut className="h-3.5 w-3.5"/>Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Top KPI strip */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {[
            {label:"Products",    value:kpi.products,             icon:Package,      color:"primary"},
            {label:"Categories",  value:kpi.categories,           icon:Tag,          color:"blue"},
            {label:"Featured",    value:kpi.featured,             icon:Star,         color:"amber"},
            {label:"Low Stock",   value:kpi.lowStock,             icon:AlertTriangle,color:kpi.lowStock>0?"amber":"slate"},
            {label:"Out of Stock",value:kpi.outStock,             icon:AlertTriangle,color:kpi.outStock>0?"red":"slate"},
            {label:"Retail Value",value:`$${(kpi.totalRetail/1000).toFixed(1)}k`,icon:ShoppingBag,color:"emerald"},
          ].map(card=>{
            const Icon=card.icon;
            const cmap:Record<string,string>={primary:"text-primary bg-primary/10",blue:"text-blue-600 bg-blue-50",amber:"text-amber-600 bg-amber-50",red:"text-red-600 bg-red-50",slate:"text-slate-500 bg-slate-100",emerald:"text-emerald-600 bg-emerald-50"};
            return (
              <Card key={card.label} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={()=>{
                if(card.label==="Products"||card.label.includes("Stock")) setActiveTab("products");
                if(card.label==="Categories") setActiveTab("categories");
                if(card.label==="Retail Value") setActiveTab("inventory");
              }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{card.label}</p>
                      <p className={`text-xl font-extrabold mt-0.5 ${cmap[card.color]?.split(" ")[0]}`}>{card.value}</p>
                    </div>
                    <div className={`h-8 w-8 shrink-0 rounded-xl flex items-center justify-center ${cmap[card.color]}`}><Icon className="h-4 w-4"/></div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Mobile tab selector */}
          <div className="md:hidden mb-4">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="rounded-xl"><SelectValue/></SelectTrigger>
              <SelectContent>
                {["analytics","products","orders","categories","inventory","coupons","accounting","users"].map(t=>(
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Desktop tabs */}
          <TabsList className="hidden md:grid w-full grid-cols-8 rounded-xl mb-0">
            <TabsTrigger value="analytics"  className="text-xs">Analytics</TabsTrigger>
            <TabsTrigger value="products"   className="text-xs">Products</TabsTrigger>
            <TabsTrigger value="orders"     className="text-xs">Orders</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs">Categories</TabsTrigger>
            <TabsTrigger value="inventory"  className="text-xs">Inventory</TabsTrigger>
            <TabsTrigger value="coupons"    className="text-xs">Coupons</TabsTrigger>
            <TabsTrigger value="accounting" className="text-xs">Accounting</TabsTrigger>
            <TabsTrigger value="users"      className="text-xs">Users</TabsTrigger>
          </TabsList>

          {/* ── ANALYTICS ── */}
          <TabsContent value="analytics" className="mt-4"><AnalyticsDashboard/></TabsContent>

          {/* ── PRODUCTS ── */}
          <TabsContent value="products" className="mt-4">
            <div className="space-y-4">
              {/* Products header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-extrabold flex items-center gap-2"><Package className="h-5 w-5 text-primary"/>Product Management</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{products.length} products · {kpi.featured} featured</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={fetchData} className="h-8 rounded-full px-3"><RefreshCw className="h-3.5 w-3.5"/></Button>
                  <div className="flex gap-1 rounded-full border p-0.5 bg-muted/40">
                    <button onClick={()=>setViewMode("table")} className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${viewMode==="table"?"bg-card shadow text-foreground":"text-muted-foreground"}`}><List className="h-3.5 w-3.5"/></button>
                    <button onClick={()=>setViewMode("grid")} className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${viewMode==="grid"?"bg-card shadow text-foreground":"text-muted-foreground"}`}><Grid className="h-3.5 w-3.5"/></button>
                  </div>
                  <ProductDialog/>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
                  <Input placeholder="Search products, SKU…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="h-8 pl-8 w-48 text-xs rounded-full"/>
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 w-36 text-xs rounded-full"><SelectValue placeholder="Category"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {["all","ok","low","out"].map(f=>(
                  <button key={f} onClick={()=>setStockFilter(f)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${stockFilter===f?"bg-primary text-primary-foreground":"bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                    {f==="all"?"All Stock":f==="ok"?"In Stock":f==="low"?"Low Stock":"Out of Stock"}
                  </button>
                ))}
              </div>

              {filtered.length===0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto mb-3 opacity-30"/>
                  <p>{searchQuery?"No products match your search":"No products yet"}</p>
                </div>
              ) : viewMode==="table" ? (
                /* TABLE VIEW */
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="text-xs w-12">Image</TableHead>
                          <TableHead className="text-xs">Product</TableHead>
                          <TableHead className="text-xs">SKU</TableHead>
                          <TableHead className="text-xs">Category</TableHead>
                          <TableHead className="text-xs text-right">Cost</TableHead>
                          <TableHead className="text-xs text-right">Price</TableHead>
                          <TableHead className="text-xs text-right">Margin</TableHead>
                          <TableHead className="text-xs text-center">Stock</TableHead>
                          <TableHead className="text-xs text-center">Status</TableHead>
                          <TableHead className="text-xs text-center">Featured</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map(p=>{
                          const cat=categories.find(c=>c.id===p.category_id);
                          const out=p.stock_quantity===0;
                          const low=p.stock_quantity<=p.reorder_level&&p.stock_quantity>0;
                          const margin=p.cost_price>0?((p.price-p.cost_price)/p.price*100):null;
                          return (
                            <TableRow key={p.id} className={`hover:bg-muted/20 ${out?"bg-red-50/20":low?"bg-amber-50/20":""}`}>
                              <TableCell>
                                <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted border">
                                  {p.image_url
                                    ?<img src={p.image_url} alt={p.name} className="h-full w-full object-cover"/>
                                    :<div className="h-full w-full flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground"/></div>
                                  }
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm font-semibold max-w-[200px] truncate">{p.name}</p>
                                  {p.description&&<p className="text-xs text-muted-foreground max-w-[200px] truncate">{p.description}</p>}
                                </div>
                              </TableCell>
                              <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.sku||"—"}</code></TableCell>
                              <TableCell className="text-xs text-muted-foreground">{cat?.name||"—"}</TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">{fmt(p.cost_price)}</TableCell>
                              <TableCell className="text-right text-sm font-bold text-primary">{fmt(p.price)}</TableCell>
                              <TableCell className="text-right">
                                {margin!==null
                                  ?<span className={`text-xs font-bold ${margin>=30?"text-emerald-600":margin>=15?"text-amber-600":"text-red-500"}`}>{margin.toFixed(1)}%</span>
                                  :<span className="text-xs text-muted-foreground">—</span>
                                }
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className={`text-sm font-bold ${out?"text-red-600":low?"text-amber-600":"text-emerald-600"}`}>{p.stock_quantity}</span>
                                  <Badge className={`text-[9px] border-0 px-1 ${out?"bg-red-100 text-red-700":low?"bg-amber-100 text-amber-700":"bg-emerald-100 text-emerald-700"}`}>
                                    {out?"Out":low?"Low":"OK"}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch checked={p.is_active!==false} onCheckedChange={v=>toggleActive(p.id,v)} className="data-[state=checked]:bg-emerald-500 scale-75"/>
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch checked={p.is_featured===true} onCheckedChange={v=>toggleFeatured(p.id,v)} className="data-[state=checked]:bg-amber-400 scale-75"/>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>navigate(`/product/${p.id}`)} title="View"><Eye className="h-3.5 w-3.5"/></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>handleEdit(p)} title="Edit"><Edit className="h-3.5 w-3.5"/></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={()=>handleDelete(p.id,p.name)} title="Delete"><Trash2 className="h-3.5 w-3.5"/></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <div className="border-t px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{filtered.length} product{filtered.length!==1?"s":""}</span>
                      <div className="flex gap-4 font-semibold">
                        <span className="text-blue-600">Total Stock Value: {fmt(filtered.reduce((s,p)=>s+p.stock_quantity*p.cost_price,0))}</span>
                        <span className="text-teal-600">Retail Value: {fmt(filtered.reduce((s,p)=>s+p.stock_quantity*p.price,0))}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* GRID VIEW */
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map(p=>{
                    const cat=categories.find(c=>c.id===p.category_id);
                    const out=p.stock_quantity===0;
                    const low=p.stock_quantity<=p.reorder_level&&p.stock_quantity>0;
                    return (
                      <div key={p.id} className={`group rounded-2xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 ${out?"border-red-200":low?"border-amber-200":""}`}>
                        <div className="relative h-36 bg-muted overflow-hidden">
                          {p.image_url
                            ?<img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                            :<div className="h-full w-full flex items-center justify-center"><Package className="h-10 w-10 text-muted-foreground/30"/></div>
                          }
                          {out&&<div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="rounded-full bg-red-500 text-white text-xs font-bold px-3 py-1">Out of Stock</span></div>}
                          {low&&!out&&<div className="absolute top-2 left-2 rounded-full bg-amber-500 text-white text-[9px] font-bold px-2 py-0.5">Low Stock</div>}
                          {p.is_featured&&<div className="absolute top-2 right-2 rounded-full bg-amber-400 text-amber-900 text-[9px] font-bold px-2 py-0.5 flex items-center gap-0.5"><Star className="h-2.5 w-2.5"/>Featured</div>}
                          <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={()=>navigate(`/product/${p.id}`)} className="h-7 w-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><Eye className="h-3.5 w-3.5"/></button>
                            <button onClick={()=>handleEdit(p)} className="h-7 w-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-primary hover:text-white transition-colors"><Edit className="h-3.5 w-3.5"/></button>
                            <button onClick={()=>handleDelete(p.id,p.name)} className="h-7 w-7 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"><Trash2 className="h-3.5 w-3.5"/></button>
                          </div>
                        </div>
                        <div className="p-3 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold line-clamp-2 flex-1">{p.name}</p>
                            <p className="text-sm font-extrabold text-primary shrink-0">{fmt(p.price)}</p>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{cat?.name||"Uncategorised"}</span>
                            <span className={`font-bold ${out?"text-red-600":low?"text-amber-600":"text-emerald-600"}`}>{p.stock_quantity} units</span>
                          </div>
                          {p.sku&&<code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{p.sku}</code>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders"     className="mt-4"><OrdersManager/></TabsContent>
          <TabsContent value="categories" className="mt-4"><CategoryManager categories={categories} onUpdate={fetchData}/></TabsContent>
          <TabsContent value="inventory"  className="mt-4"><InventoryManager/></TabsContent>
          <TabsContent value="coupons"    className="mt-4"><CouponsManager/></TabsContent>
          <TabsContent value="accounting" className="mt-4"><AccountingManager/></TabsContent>
          <TabsContent value="users"      className="mt-4"><UserManager/></TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
