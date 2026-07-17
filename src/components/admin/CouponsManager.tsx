import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Tag, Trash2, Copy } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_total: number;
  usage_limit: number | null;
  times_used: number;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

const EMPTY_FORM = {
  code: "",
  discount_type: "percent" as "percent" | "fixed",
  discount_value: "",
  min_order_total: "0",
  usage_limit: "",
  expires_at: "",
  active: true,
};

function generateCode() {
  return "TUPA" + Math.random().toString(36).toUpperCase().slice(2, 7);
}

export function CouponsManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load coupons"); return; }
    setCoupons(data || []);
    setLoading(false);
  };

  const saveCoupon = async () => {
    if (!form.code.trim()) { toast.error("Coupon code is required"); return; }
    if (!form.discount_value || parseFloat(form.discount_value) <= 0) { toast.error("Discount value must be positive"); return; }
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_order_total: parseFloat(form.min_order_total) || 0,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
        expires_at: form.expires_at || null,
        active: form.active,
      };
      const { error } = await supabase.from("coupons").insert(payload);
      if (error) throw error;
      toast.success("Coupon created!");
      setOpen(false);
      setForm(EMPTY_FORM);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || "Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("coupons").update({ active }).eq("id", id);
    setCoupons((prev) => prev.map((c) => c.id === id ? { ...c, active } : c));
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await supabase.from("coupons").delete().eq("id", id);
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    toast.success("Coupon deleted");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied "${code}" to clipboard`);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" /> Coupons & Discounts</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New Coupon</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Coupon</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Label>Code *</Label>
                  <Input
                    placeholder="TUPA20"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  />
                </div>
                <Button variant="outline" size="sm" className="mt-6 shrink-0" onClick={() => setForm({ ...form, code: generateCode() })}>
                  Generate
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Discount Type *</Label>
                  <Select value={form.discount_type} onValueChange={(v: any) => setForm({ ...form, discount_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Value *</Label>
                  <Input
                    type="number" min="0" step="0.01"
                    placeholder={form.discount_type === "percent" ? "20" : "5.00"}
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Min. Order Total ($)</Label>
                  <Input type="number" min="0" step="0.01" value={form.min_order_total} onChange={(e) => setForm({ ...form, min_order_total: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Usage Limit</Label>
                  <Input type="number" min="1" placeholder="Unlimited" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Expiry Date (optional)</Label>
                <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} />
              </div>

              <div className="flex items-center gap-3">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label>{form.active ? "Active" : "Inactive"}</Label>
              </div>

              <Button className="w-full" onClick={saveCoupon} disabled={saving}>
                {saving ? "Creating…" : "Create Coupon"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading…</p>
        ) : coupons.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No coupons yet.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Min. Order</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => {
                  const expired = c.expires_at && new Date(c.expires_at) < new Date();
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <button
                          className="flex items-center gap-1.5 font-mono font-bold text-primary hover:underline"
                          onClick={() => copyCode(c.code)}
                        >
                          {c.code} <Copy className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge className="text-xs bg-primary/10 text-primary border-0">
                          {c.discount_type === "percent" ? `${c.discount_value}%` : `$${c.discount_value.toFixed(2)}`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{c.min_order_total > 0 ? `$${c.min_order_total.toFixed(2)}` : "None"}</TableCell>
                      <TableCell className="text-sm">{c.times_used}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.expires_at
                          ? <span className={expired ? "text-red-500 font-medium" : ""}>{new Date(c.expires_at).toLocaleDateString()}{expired ? " (expired)" : ""}</span>
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <Switch checked={c.active && !expired} onCheckedChange={(v) => toggleActive(c.id, v)} disabled={!!expired} />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteCoupon(c.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
