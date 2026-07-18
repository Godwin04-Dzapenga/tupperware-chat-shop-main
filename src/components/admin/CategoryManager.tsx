import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { z } from "zod";
import {
  Plus, Edit, Trash2, Tag, Search, Image, Link,
  Eye, EyeOff, Package, ArrowUp, ArrowDown,
  CheckCircle2, Grid3X3, List, RefreshCw
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
  product_count?: number;
}

interface CategoryManagerProps {
  categories: Category[];
  onUpdate: () => void;
}

const categorySchema = z.object({
  name: z.string().trim().min(1,"Name required").max(100),
  slug: z.string().trim().min(1,"Slug required").max(100).regex(/^[a-z0-9-]+$/,"Slug: lowercase letters, numbers and hyphens only"),
  description: z.string().max(500).optional().nullable(),
  image_url: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
});

const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");

const EMPTY_FORM = { name:"", slug:"", description:"", image_url:"", is_active:true, sort_order:0 };

export const CategoryManager = ({ categories, onUpdate }: CategoryManagerProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"table"|"grid">("table");
  const [productCounts, setProductCounts] = useState<Record<string,number>>({});
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => { fetchProductCounts(); }, [categories]);

  const fetchProductCounts = async () => {
    if (!categories.length) return;
    const { data } = await supabase.from("products").select("category_id");
    const counts: Record<string,number> = {};
    (data||[]).forEach((p:any) => { if(p.category_id) counts[p.category_id] = (counts[p.category_id]||0)+1; });
    setProductCounts(counts);
  };

  const filtered = useMemo(() =>
    categories.filter(c =>
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase())
    ), [categories, search]);

  const resetForm = () => { setForm(EMPTY_FORM); setEditing(null); setSlugEdited(false); };

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: slugEdited ? f.slug : generateSlug(name) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = categorySchema.parse({
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        image_url: form.image_url || null,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
      });

      const { error } = editing
        ? await supabase.from("categories").update(payload).eq("id", editing.id)
        : await supabase.from("categories").insert([payload]);

      if (error) {
        if (error.message.includes("unique")) throw new Error("A category with this slug already exists");
        throw error;
      }

      toast.success(editing ? "Category updated!" : "Category created!");
      setDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (err: any) {
      toast.error(err instanceof z.ZodError ? err.errors[0].message : err.message);
    } finally { setSaving(false); }
  };

  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name, slug: cat.slug,
      description: cat.description || "",
      image_url: cat.image_url || "",
      is_active: cat.is_active !== false,
      sort_order: cat.sort_order || 0,
    });
    setSlugEdited(true);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const count = productCounts[id] || 0;
    const msg = count > 0
      ? `"${name}" has ${count} product${count!==1?"s":""} assigned. Deleting it will unassign them. Continue?`
      : `Delete "${name}"? This cannot be undone.`;
    if (!confirm(msg)) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error("Failed to delete category");
    else { toast.success("Category deleted"); onUpdate(); }
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    await supabase.from("categories").update({ is_active }).eq("id", id);
    toast.success(is_active ? "Category activated" : "Category hidden");
    onUpdate();
  };

  const moveOrder = async (id: string, direction: "up"|"down") => {
    const idx = categories.findIndex(c => c.id === id);
    const swap = direction === "up" ? categories[idx-1] : categories[idx+1];
    if (!swap) return;
    const catA = categories[idx];
    await supabase.from("categories").update({ sort_order: swap.sort_order||0 }).eq("id", catA.id);
    await supabase.from("categories").update({ sort_order: catA.sort_order||0 }).eq("id", swap.id);
    onUpdate();
  };

  const totalProducts = Object.values(productCounts).reduce((s,v)=>s+v,0);
  const activeCount   = categories.filter(c => c.is_active !== false).length;

  return (
    <div className="space-y-5">

      {/* ── HEADER ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /> Category Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Organise products into browsable collections</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={v=>{ setDialogOpen(v); if(!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 rounded-full" onClick={resetForm}><Plus className="h-4 w-4"/>New Category</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing?"Edit Category":"New Category"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Category Name *</Label>
                <Input placeholder="e.g. Kitchen Essentials" value={form.name} onChange={e=>handleNameChange(e.target.value)} className="rounded-xl h-9" required />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Link className="h-3 w-3"/>URL Slug *</Label>
                <div className="flex gap-2">
                  <Input placeholder="kitchen-essentials" value={form.slug}
                    onChange={e=>{ setSlugEdited(true); setForm(f=>({...f,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"")})); }}
                    className="rounded-xl h-9 font-mono text-sm" required />
                  <Button type="button" variant="outline" size="sm" className="h-9 rounded-xl shrink-0"
                    onClick={()=>{ setForm(f=>({...f,slug:generateSlug(f.name)})); setSlugEdited(false); }}>
                    <RefreshCw className="h-3.5 w-3.5"/>
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">Used in URLs: /category/<strong>{form.slug||"slug"}</strong></p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Description (optional)</Label>
                <Textarea rows={2} placeholder="Describe this category…" value={form.description}
                  onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="rounded-xl resize-none text-sm" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Image className="h-3 w-3"/>Cover Image URL (optional)</Label>
                <Input placeholder="https://images.unsplash.com/…" value={form.image_url}
                  onChange={e=>setForm(f=>({...f,image_url:e.target.value}))} className="rounded-xl h-9 text-sm" />
                {form.image_url && (
                  <img src={form.image_url} alt="preview" className="h-20 w-full object-cover rounded-xl border mt-1" onError={e=>(e.currentTarget.style.display="none")} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sort Order</Label>
                  <Input type="number" min="0" value={form.sort_order}
                    onChange={e=>setForm(f=>({...f,sort_order:parseInt(e.target.value)||0}))} className="rounded-xl h-9" />
                  <p className="text-[10px] text-muted-foreground">Lower = appears first</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Visibility</Label>
                  <div className="flex items-center gap-3 h-9">
                    <Switch checked={form.is_active} onCheckedChange={v=>setForm(f=>({...f,is_active:v}))} />
                    <span className={`text-sm font-semibold ${form.is_active?"text-emerald-600":"text-muted-foreground"}`}>
                      {form.is_active?"Visible":"Hidden"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <Button type="button" variant="outline" className="rounded-full" onClick={()=>{setDialogOpen(false);resetForm();}}>Cancel</Button>
                <Button type="submit" className="rounded-full" disabled={saving}>{saving?"Saving…":editing?"Update":"Create Category"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── STAT BADGES ── */}
      <div className="flex flex-wrap gap-3">
        {[
          { label:"Total Categories", value:categories.length, color:"bg-primary/10 text-primary" },
          { label:"Active", value:activeCount, color:"bg-emerald-100 text-emerald-700" },
          { label:"Hidden", value:categories.length-activeCount, color:"bg-slate-100 text-slate-600" },
          { label:"Total Products Assigned", value:totalProducts, color:"bg-amber-100 text-amber-700" },
        ].map(s => (
          <div key={s.label} className={`rounded-full px-4 py-1.5 text-xs font-bold ${s.color}`}>
            {s.value} {s.label}
          </div>
        ))}
      </div>

      {/* ── FILTER BAR ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"/>
          <Input placeholder="Search categories…" value={search} onChange={e=>setSearch(e.target.value)} className="pl-9 h-8 rounded-full text-xs"/>
        </div>
        <div className="flex gap-1 rounded-full border p-0.5 bg-muted/40">
          <button onClick={()=>setViewMode("table")} className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${viewMode==="table"?"bg-card shadow text-foreground":"text-muted-foreground"}`}><List className="h-3.5 w-3.5"/></button>
          <button onClick={()=>setViewMode("grid")}  className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${viewMode==="grid" ?"bg-card shadow text-foreground":"text-muted-foreground"}`}><Grid3X3 className="h-3.5 w-3.5"/></button>
        </div>
      </div>

      {/* ── TABLE VIEW ── */}
      {viewMode === "table" && (
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Tag className="h-10 w-10 mx-auto mb-3 opacity-30"/>
                <p>{search ? "No categories match your search" : "No categories yet"}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs w-10">Order</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Slug</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs text-center">Products</TableHead>
                    <TableHead className="text-xs text-center">Visible</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((cat, idx) => (
                    <TableRow key={cat.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <button disabled={idx===0} onClick={()=>moveOrder(cat.id,"up")} className="disabled:opacity-20 hover:text-primary transition-colors"><ArrowUp className="h-3 w-3"/></button>
                          <button disabled={idx===filtered.length-1} onClick={()=>moveOrder(cat.id,"down")} className="disabled:opacity-20 hover:text-primary transition-colors"><ArrowDown className="h-3 w-3"/></button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {cat.image_url ? (
                            <img src={cat.image_url} alt={cat.name} className="h-9 w-9 rounded-lg object-cover border shrink-0"/>
                          ) : (
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Tag className="h-4 w-4 text-primary"/></div>
                          )}
                          <span className="font-semibold text-sm">{cat.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded-md text-muted-foreground">{cat.slug}</code>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{cat.description||"—"}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-primary/10 text-primary border-0 text-xs">
                          <Package className="h-2.5 w-2.5 mr-1"/>{productCounts[cat.id]||0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={cat.is_active !== false}
                          onCheckedChange={v=>toggleActive(cat.id,v)}
                          className="data-[state=checked]:bg-emerald-500"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>handleEdit(cat)}><Edit className="h-3.5 w-3.5"/></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={()=>handleDelete(cat.id,cat.name)}><Trash2 className="h-3.5 w-3.5"/></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── GRID VIEW ── */}
      {viewMode === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <Tag className="h-10 w-10 mx-auto mb-3 opacity-30"/>
              <p>{search ? "No categories match" : "No categories yet"}</p>
            </div>
          )}
          {filtered.map(cat => (
            <div key={cat.id} className={`group rounded-2xl border bg-card overflow-hidden shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${cat.is_active===false?"opacity-60":""}`}>
              {/* Cover image */}
              <div className="relative h-24 bg-gradient-to-br from-primary/10 to-cyan-500/10 overflow-hidden">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"/>
                ) : (
                  <div className="h-full w-full flex items-center justify-center"><Tag className="h-8 w-8 text-primary/30"/></div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  {cat.is_active === false && <Badge className="bg-slate-800/80 text-white border-0 text-[9px]"><EyeOff className="h-2.5 w-2.5 mr-0.5"/>Hidden</Badge>}
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate">{cat.name}</h3>
                    <code className="text-[10px] text-muted-foreground">{cat.slug}</code>
                  </div>
                  <Badge className="shrink-0 bg-primary/10 text-primary border-0 text-[10px]">
                    {productCounts[cat.id]||0} <Package className="h-2.5 w-2.5 ml-0.5"/>
                  </Badge>
                </div>

                {cat.description && <p className="text-[11px] text-muted-foreground line-clamp-2">{cat.description}</p>}

                <div className="flex items-center justify-between pt-1">
                  <Switch checked={cat.is_active!==false} onCheckedChange={v=>toggleActive(cat.id,v)} className="data-[state=checked]:bg-emerald-500 scale-90"/>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={()=>handleEdit(cat)}><Edit className="h-3.5 w-3.5"/></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={()=>handleDelete(cat.id,cat.name)}><Trash2 className="h-3.5 w-3.5"/></Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
