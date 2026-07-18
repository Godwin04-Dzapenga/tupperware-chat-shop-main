import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import logoImage from "@/assets/tuppafrica-logo.jpg";
import {
  ArrowLeft, User, MapPin, Package, Heart, Settings,
  Edit2, Check, X, Plus, Trash2, LogOut, ShoppingBag, Star
} from "lucide-react";

interface Profile { full_name: string | null; phone: string | null; email: string | null; }
interface Address { id: string; label: string | null; recipient_name: string; phone: string; line1: string; city: string; country: string; is_default: boolean; }
interface Order { id: string; order_number: string; status: string; total: number; created_at: string; order_items: { product_name: string; quantity: number }[]; }

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700", confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-purple-100 text-purple-700", shipped: "bg-cyan-100 text-cyan-700",
  delivered: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-700",
};

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "wishlist", label: "Wishlist", icon: Heart },
];

export default function Account() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState<Profile>({ full_name: "", phone: "", email: "" });
  const [editingProfile, setEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: "", recipient_name: "", phone: "", line1: "", city: "Harare", country: "Zimbabwe" });

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    const [profileRes, ordersRes, addressesRes, wishlistRes] = await Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
      supabase.from("orders").select("*, order_items(product_name, quantity)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }),
      supabase.from("wishlist_items").select("product_id, products(id, name, price, image_url)").eq("user_id", user.id),
    ]);

    if (profileRes.data) setProfile({ ...profileRes.data, email: user.email || "" });
    else setProfile({ full_name: user.user_metadata?.full_name || "", phone: "", email: user.email || "" });
    setOrders((ordersRes.data as Order[]) || []);
    setAddresses((addressesRes.data as Address[]) || []);
    setWishlist(wishlistRes.data?.map((w: any) => w.products).filter(Boolean) || []);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, full_name: profile.full_name, phone: profile.phone, updated_at: new Date().toISOString() });
    if (error) { toast.error("Failed to save profile"); } else { toast.success("Profile updated!"); setEditingProfile(false); }
    setSaving(false);
  };

  const saveAddress = async () => {
    if (!user || !newAddress.recipient_name || !newAddress.phone || !newAddress.line1) { toast.error("Please fill required fields"); return; }
    const { error } = await supabase.from("addresses").insert({ ...newAddress, user_id: user.id, is_default: addresses.length === 0 });
    if (error) { toast.error("Failed to save address"); return; }
    toast.success("Address saved!");
    setAddingAddress(false);
    setNewAddress({ label: "", recipient_name: "", phone: "", line1: "", city: "Harare", country: "Zimbabwe" });
    fetchAll();
  };

  const deleteAddress = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    setAddresses(prev => prev.filter(a => a.id !== id));
    toast.success("Address removed");
  };

  const setDefault = async (id: string) => {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user!.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    fetchAll();
    toast.success("Default address updated");
  };

  const removeWishlist = async (productId: string) => {
    await supabase.from("wishlist_items").delete().eq("user_id", user!.id).eq("product_id", productId);
    setWishlist(prev => prev.filter((p: any) => p.id !== productId));
    toast.success("Removed from wishlist");
  };

  const initials = (profile.full_name || profile.email || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b bg-card/98 backdrop-blur-md shadow-sm">
        <div className="container mx-auto flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Shop
          </Button>
          <div className="h-4 w-px bg-border" />
          <img src={logoImage} alt="TuppAfrica" className="h-8 w-auto" />
          <span className="text-sm font-semibold text-muted-foreground hidden sm:inline">/ My Account</span>
          <Button variant="ghost" size="sm" onClick={signOut} className="ml-auto gap-1.5 text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Profile hero */}
        <div className="mb-6 flex items-center gap-4 rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-cyan-400 text-white text-2xl font-extrabold shadow-lg">
            {initials}
          </div>
          <div>
            <h1 className="text-xl font-extrabold">{profile.full_name || "My Account"}</h1>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="mt-1 flex gap-2">
              <Badge className="text-[10px] bg-primary/10 text-primary border-0">{orders.length} orders</Badge>
              <Badge className="text-[10px] bg-red-50 text-red-600 border-0">{wishlist.length} wishlist items</Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar nav */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-2">
                {TABS.map(t => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} onClick={() => setTab(t.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                      <Icon className="h-4 w-4 shrink-0" /> {t.label}
                    </button>
                  );
                })}
                <Separator className="my-2" />
                <button onClick={() => navigate("/orders")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors text-left">
                  <Package className="h-4 w-4" /> All Orders
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">

            {/* PROFILE TAB */}
            {tab === "profile" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Personal Information</CardTitle>
                  {!editingProfile
                    ? <Button variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={() => setEditingProfile(true)}><Edit2 className="h-3.5 w-3.5" /> Edit</Button>
                    : <div className="flex gap-2">
                        <Button size="sm" className="gap-1.5 rounded-full" onClick={saveProfile} disabled={saving}><Check className="h-3.5 w-3.5" /> Save</Button>
                        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setEditingProfile(false)}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                  }
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Full Name</Label>
                      <Input value={profile.full_name || ""} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} readOnly={!editingProfile} className={`rounded-xl ${!editingProfile ? "bg-muted/40 cursor-default" : ""}`} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Phone</Label>
                      <Input value={profile.phone || ""} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} readOnly={!editingProfile} placeholder="+263 77..." className={`rounded-xl ${!editingProfile ? "bg-muted/40 cursor-default" : ""}`} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Email</Label>
                    <Input value={profile.email || ""} readOnly className="rounded-xl bg-muted/40 cursor-not-allowed" />
                    <p className="text-[10px] text-muted-foreground">Email cannot be changed here</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ORDERS TAB */}
            {tab === "orders" && (
              <Card>
                <CardHeader><CardTitle className="text-base">Recent Orders</CardTitle></CardHeader>
                <CardContent>
                  {orders.length === 0
                    ? <div className="text-center py-12 text-muted-foreground"><ShoppingBag className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No orders yet</p><Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => navigate("/")}>Start Shopping</Button></div>
                    : <div className="space-y-3">
                        {orders.map(order => (
                          <div key={order.id} className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate("/orders")}>
                            <div>
                              <p className="font-bold text-sm text-primary">{order.order_number}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {order.order_items?.length} item{order.order_items?.length !== 1 ? "s" : ""}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">${order.total.toFixed(2)}</p>
                              <Badge className={`${STATUS_COLORS[order.status] || ""} border-0 text-[10px] mt-1`}>{order.status}</Badge>
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" className="w-full rounded-full" onClick={() => navigate("/orders")}>View All Orders</Button>
                      </div>
                  }
                </CardContent>
              </Card>
            )}

            {/* ADDRESSES TAB */}
            {tab === "addresses" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Saved Addresses</CardTitle>
                  <Button size="sm" className="gap-1.5 rounded-full" onClick={() => setAddingAddress(true)}><Plus className="h-3.5 w-3.5" /> Add New</Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {addingAddress && (
                    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
                      <h4 className="text-sm font-bold text-primary">New Address</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div><Label className="text-xs font-semibold text-muted-foreground">Label (optional)</Label><Input placeholder="Home, Work..." value={newAddress.label} onChange={e => setNewAddress(p => ({ ...p, label: e.target.value }))} className="mt-1 rounded-xl h-9" /></div>
                        <div><Label className="text-xs font-semibold text-muted-foreground">Recipient Name *</Label><Input value={newAddress.recipient_name} onChange={e => setNewAddress(p => ({ ...p, recipient_name: e.target.value }))} className="mt-1 rounded-xl h-9" /></div>
                        <div><Label className="text-xs font-semibold text-muted-foreground">Phone *</Label><Input value={newAddress.phone} onChange={e => setNewAddress(p => ({ ...p, phone: e.target.value }))} className="mt-1 rounded-xl h-9" /></div>
                        <div><Label className="text-xs font-semibold text-muted-foreground">Street Address *</Label><Input value={newAddress.line1} onChange={e => setNewAddress(p => ({ ...p, line1: e.target.value }))} className="mt-1 rounded-xl h-9" /></div>
                        <div><Label className="text-xs font-semibold text-muted-foreground">City</Label><Input value={newAddress.city} onChange={e => setNewAddress(p => ({ ...p, city: e.target.value }))} className="mt-1 rounded-xl h-9" /></div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" className="rounded-full gap-1.5" onClick={saveAddress}><Check className="h-3.5 w-3.5" /> Save Address</Button>
                        <Button size="sm" variant="outline" className="rounded-full" onClick={() => setAddingAddress(false)}>Cancel</Button>
                      </div>
                    </div>
                  )}
                  {addresses.length === 0 && !addingAddress
                    ? <div className="text-center py-10 text-muted-foreground"><MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>No saved addresses</p></div>
                    : addresses.map(addr => (
                        <div key={addr.id} className={`rounded-xl border p-4 ${addr.is_default ? "border-primary/30 bg-primary/5" : ""}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {addr.label && <span className="text-xs font-bold uppercase tracking-wide text-primary">{addr.label}</span>}
                                {addr.is_default && <Badge className="text-[9px] bg-primary/10 text-primary border-0">Default</Badge>}
                              </div>
                              <p className="text-sm font-semibold">{addr.recipient_name}</p>
                              <p className="text-xs text-muted-foreground">{addr.line1}, {addr.city}, {addr.country}</p>
                              <p className="text-xs text-muted-foreground">{addr.phone}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              {!addr.is_default && <Button variant="ghost" size="sm" className="h-7 text-xs rounded-full" onClick={() => setDefault(addr.id)}>Set Default</Button>}
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => deleteAddress(addr.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </div>
                        </div>
                      ))
                  }
                </CardContent>
              </Card>
            )}

            {/* WISHLIST TAB */}
            {tab === "wishlist" && (
              <Card>
                <CardHeader><CardTitle className="text-base">My Wishlist ({wishlist.length})</CardTitle></CardHeader>
                <CardContent>
                  {wishlist.length === 0
                    ? <div className="text-center py-12 text-muted-foreground"><Heart className="h-10 w-10 mx-auto mb-3 opacity-30" /><p>Your wishlist is empty</p><Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => navigate("/")}>Browse Products</Button></div>
                    : <div className="grid gap-3 sm:grid-cols-2">
                        {wishlist.map((item: any) => (
                          <div key={item.id} className="flex gap-3 rounded-xl border p-3 bg-card">
                            <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                              {item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-2xl">📦</div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold line-clamp-2 cursor-pointer hover:text-primary" onClick={() => navigate(`/product/${item.id}`)}>{item.name}</p>
                              <p className="text-sm font-bold text-primary mt-0.5">${item.price.toFixed(2)}</p>
                            </div>
                            <button onClick={() => removeWishlist(item.id)} className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-destructive shrink-0">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                  }
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
