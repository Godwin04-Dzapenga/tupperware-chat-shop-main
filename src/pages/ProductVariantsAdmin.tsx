import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Image, Package, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface Variant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  attributes: Record<string, string>;
  is_active: boolean;
  sort_order: number;
}

const blank = (): Variant => ({
  id: "new-" + Date.now(),
  product_id: "",
  name: "",
  sku: "",
  price: 0,
  stock_quantity: 0,
  image_url: "",
  attributes: {},
  is_active: true,
  sort_order: 0,
});

export default function ProductVariantsAdmin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<{ id: string; name: string; price: number; image_url: string | null } | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [productRes, variantsRes] = await Promise.all([
      supabase.from("products").select("id,name,price,image_url").eq("id", id).single(),
      supabase.from("product_variants").select("*").eq("product_id", id).order("sort_order").order("name"),
    ]);
    if (productRes.error || !productRes.data) {
      toast.error("Product not found");
      navigate("/admin");
      return;
    }
    setProduct(productRes.data);
    setVariants(((variantsRes.data || []) as Variant[]).map(v => ({ ...v, attributes: (v.attributes || {}) as Record<string, string> })));
    setLoading(false);
  };

  const updateVariant = (index: number, patch: Partial<Variant>) =>
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, ...patch } : v));

  const addVariant = () =>
    setVariants(prev => [...prev, { ...blank(), product_id: id || "", sort_order: prev.length }]);

  const save = async () => {
    if (!id) return;
    if (variants.some(v => !v.name.trim() || v.price < 0 || v.stock_quantity < 0)) {
      toast.error("Every variant needs a name, price and stock quantity.");
      return;
    }
    setSaving(true);
    try {
      const payload = variants.map((v, index) => ({
        ...(v.id.startsWith("new-") ? {} : { id: v.id }),
        product_id: id,
        name: v.name.trim(),
        sku: v.sku?.trim() || null,
        price: Number(v.price),
        stock_quantity: Number(v.stock_quantity),
        image_url: v.image_url?.trim() || null,
        attributes: v.attributes || {},
        is_active: v.is_active,
        sort_order: index,
      }));
      const { error } = await supabase.from("product_variants").upsert(payload, { onConflict: "id" });
      if (error) throw error;

      const savedIds = payload.filter(v => "id" in v).map(v => v.id);
      const existingIds = variants.filter(v => !v.id.startsWith("new-")).map(v => v.id);
      const removed = existingIds.filter(existingId => !savedIds.includes(existingId));
      if (removed.length) {
        const { error: deleteError } = await supabase.from("product_variants").delete().in("id", removed);
        if (deleteError) throw deleteError;
      }
      toast.success("Variants saved");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save variants");
    } finally {
      setSaving(false);
    }
  };

  const remove = (index: number) => setVariants(prev => prev.filter((_, i) => i !== index));

  const editAttributes = (index: number, value: string) => {
    try {
      const parsed = value.trim() ? JSON.parse(value) : {};
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) updateVariant(index, { attributes: parsed });
    } catch {
      // invalid JSON while the user is still typing — keep the previous attributes
    }
  };

  if (loading || !product) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading variants…</div>;
  }

  return (
    <div className="min-h-screen bg-bb-surface">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="container mx-auto flex h-16 items-center gap-3 px-4">
          <Button variant="ghost" onClick={() => navigate("/admin")}><ArrowLeft className="mr-2 h-4 w-4" /> Admin</Button>
          <div className="h-6 w-px bg-border" />
          <div><p className="text-sm font-black">Variant manager</p><p className="text-xs text-muted-foreground">{product.name}</p></div>
          <Button className="ml-auto rounded-md bg-bb-blue" onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving…" : "Save variants"}</Button>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-6 sm:flex-row">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
              {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" /> : <Package className="m-6 h-8 w-8 text-slate-300" />}
            </div>
            <div>
              <div className="flex items-center gap-2"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-bb-blue">Catalogue product</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">{variants.length} variants</span></div>
              <h1 className="mt-1 text-xl font-black">{product.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Create the options customers see on the product page. Use variants for capacity, power, voltage, size, colour or other meaningful configurations. Each option can have its own price, SKU, stock and image.</p>
            </div>
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Options</p><p className="mt-1 text-2xl font-black text-slate-950">{variants.length}</p></div><div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active options</p><p className="mt-1 text-2xl font-black text-emerald-600">{variants.filter(v => v.is_active).length}</p></div><div className="rounded-2xl border bg-white p-4 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Units in stock</p><p className="mt-1 text-2xl font-black text-slate-950">{variants.reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0)}</p></div></div>

        <div className="mb-4 flex items-center justify-between">
          <div><h2 className="text-lg font-black">Variants</h2><p className="text-xs text-slate-500">{variants.length} configured options</p></div>
          <Button variant="outline" className="rounded-md" onClick={addVariant}><Plus className="mr-2 h-4 w-4" /> Add variant</Button>
        </div>

        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div key={variant.id} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">Option {index + 1}</span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-semibold">Active <Switch checked={variant.is_active} onCheckedChange={value => updateVariant(index, { is_active: value })} /></label>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-2 space-y-1.5"><Label>Variant name</Label><Input placeholder="5kVA / 48V / 200Ah" value={variant.name} onChange={e => updateVariant(index, { name: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>SKU</Label><Input placeholder="INV-5K-48" value={variant.sku || ""} onChange={e => updateVariant(index, { sku: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Price (USD)</Label><Input type="number" min="0" step="0.01" value={variant.price} onChange={e => updateVariant(index, { price: Number(e.target.value) })} /></div>
                <div className="space-y-1.5"><Label>Stock</Label><Input type="number" min="0" value={variant.stock_quantity} onChange={e => updateVariant(index, { stock_quantity: Number(e.target.value) })} /></div>
                <div className="md:col-span-3 space-y-1.5"><Label>Variant image URL</Label><Input placeholder="https://…" value={variant.image_url || ""} onChange={e => updateVariant(index, { image_url: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Sort order</Label><Input type="number" min="0" value={variant.sort_order} onChange={e => updateVariant(index, { sort_order: Number(e.target.value) })} /></div>
                <div className="md:col-span-4 space-y-1.5">
                  <Label>Technical attributes (JSON)</Label>
                  <Textarea rows={3} value={JSON.stringify(variant.attributes || {}, null, 2)} onChange={e => editAttributes(index, e.target.value)} className="font-mono text-xs" />
                  <p className="text-[10px] text-slate-500">Example: {"{\"power\":\"5kVA\",\"voltage\":\"48V\"}"}</p>
                </div>
              </div>
            </div>
          ))}

          {!variants.length && (
            <div className="rounded-xl border border-dashed bg-white px-6 py-16 text-center">
              <Image className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 font-black">No variants yet</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Add options such as 450W / 550W panels, 3.2kVA / 5kVA inverters, or 100Ah / 200Ah batteries.</p>
              <Button className="mt-4 rounded-md bg-bb-blue" onClick={addVariant}><Plus className="mr-2 h-4 w-4" /> Add first variant</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
