import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  Heart,
  UserRound,
  MapPin,
  Menu,
  X,
  ChevronDown,
  Layers,
  Zap,
  Sun,
  BatteryCharging,
  ShieldCheck,
  Flame,
  Wrench,
  Truck,
  Phone,
  MessageCircle,
  Clock,
  ArrowRight,
  LogOut,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Cart } from "@/components/Cart";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { getProductMedia } from "@/data/solarProducts";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
  product_type?: string;
  brand?: string | null;
  image_url?: string | null;
}

interface BestBuyHeaderProps {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  search: string;
  onSearchChange: (query: string) => void;
  onOpenStoreModal: () => void;
  compareCount: number;
  onOpenCompareModal: () => void;
  products: ProductItem[];
}

const WHATSAPP = "263778158984";

export const BestBuyHeader = ({
  categories,
  activeCategory,
  onSelectCategory,
  search,
  onSearchChange,
  onOpenStoreModal,
  compareCount,
  onOpenCompareModal,
  products,
}: BestBuyHeaderProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { totalItems, totalPrice } = useCart();
  const { items: wishlistItems } = useWishlist();

  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter products for live search preview
  const searchResults = search.trim()
    ? products
        .filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
          (p.product_type && p.product_type.toLowerCase().includes(search.toLowerCase()))
        )
        .slice(0, 5)
    : [];

  const popularSearches = ["5kVA Inverter", "Lithium Battery", "550W Panel", "Solar Kit", "Floodlight"];

  // Filter out any leftover legacy categories (like Tupperware lunch boxes or bottles)
  const relevantCategories = categories.filter((c) => {
    const name = c.name.toLowerCase();
    return !name.includes("bottle") && !name.includes("container") && !name.includes("lunch") && !name.includes("bowl");
  });

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* ── 1. Top Utility Header ── */}
      <div className="bg-[#002d73] text-white text-xs border-b border-white/10">
        <div className="container mx-auto px-4 flex min-h-9 items-center justify-between gap-4">
          {/* Store / Showroom Selector */}
          <button
            onClick={onOpenStoreModal}
            className="flex items-center gap-1.5 hover:text-[#ffe000] font-semibold transition-colors py-1 text-left"
          >
            <MapPin className="h-3.5 w-3.5 text-[#ffe000] shrink-0" />
            <span>
              <strong>Harare Showroom:</strong> Open today until 5:30 PM •{" "}
              <span className="text-[#ffe000] underline font-bold">Store & Pickup Info</span>
            </span>
          </button>

          {/* Center Promo ticker */}
          <div className="hidden lg:flex items-center gap-3 text-white/80">
            <span>⚡ Same-day dispatch in Harare</span>
            <span>•</span>
            <span>12–36 Month Official Warranty</span>
            <span>•</span>
            <span>Free Delivery on Orders $50+</span>
          </div>

          {/* Right Utility Links */}
          <div className="flex items-center gap-4 text-xs">
            <Link to="/orders" className="hidden sm:inline-block hover:underline text-white/90">
              Track Order
            </Link>
            <button
              onClick={() => window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hello Tech Innovation, I need sizing assistance with a solar system.")}`, "_blank")}
              className="flex items-center gap-1 hover:text-[#ffe000] font-bold text-white transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
              <span className="hidden sm:inline">WhatsApp Help:</span> 0778158984
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Main Best Buy Blue Header ── */}
      <header className="sticky top-0 z-50 bg-[#0046be] text-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 sm:h-[72px] items-center gap-3 sm:gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 select-none group">
              <span className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-[#ffe000] text-[#111820] shadow-md font-black transition-transform group-hover:scale-105">
                <Sun className="h-6 w-6 fill-[#111820] text-[#111820]" />
                {/* Yellow price tag corner triangle */}
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-[#ffe000] rotate-45" />
              </span>
              <div className="text-left">
                <span className="block text-base sm:text-lg font-black tracking-tight leading-none text-white">
                  TECH INNOVATION
                </span>
                <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.22em] text-[#ffe000]">
                  Best Buy Solar & Tech
                </span>
              </div>
            </Link>

            {/* "Menu / Departments" Best Buy Button */}
            <button
              onClick={() => setMegaMenuOpen(!megaMenuOpen)}
              className="hidden lg:flex items-center gap-2 h-11 px-4 rounded-md bg-[#003494] hover:bg-[#002870] font-black text-sm tracking-wide transition-colors shrink-0 shadow-inner border border-white/15"
            >
              <Menu className="h-4 w-4" />
              <span>Departments</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${megaMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Desktop Search Bar */}
            <div ref={searchContainerRef} className="relative hidden md:block flex-1 max-w-2xl mx-2">
              <div className="relative flex items-center">
                <Input
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="What can we help you find today? (e.g. 5kVA Inverter, Lithium Battery)"
                  className="h-11 w-full rounded-l-md rounded-r-none border-0 bg-white text-slate-900 pl-4 pr-10 text-sm placeholder:text-slate-400 focus-visible:ring-0 shadow-inner"
                />
                {search && (
                  <button
                    onClick={() => onSearchChange("")}
                    className="absolute right-14 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {/* Best Buy Yellow Search Button */}
                <button
                  type="button"
                  onClick={() => scrollToSection("products")}
                  className="h-11 px-4 bg-[#ffe000] hover:bg-[#ffd200] text-black font-extrabold flex items-center justify-center rounded-r-md transition-colors shadow-sm shrink-0"
                >
                  <Search className="h-5 w-5 stroke-[2.5]" />
                </button>
              </div>

              {/* Instant Search Suggestions Dropdown */}
              {searchFocused && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-200 overflow-hidden z-50">
                  {searchResults.length > 0 ? (
                    <div className="p-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-2">
                        Matching Equipment
                      </div>
                      <div className="space-y-1">
                        {searchResults.map((item) => {
                          const media = getProductMedia(item);
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                navigate(`/product/${item.id}`);
                                setSearchFocused(false);
                              }}
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
                            >
                              <img
                                src={media.imageUrl}
                                alt={item.name}
                                className="h-10 w-10 object-cover rounded bg-slate-50 border shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                                <p className="text-[10px] text-slate-500 uppercase">{item.brand || "Tech Innovation"}</p>
                              </div>
                              <span className="text-xs font-extrabold text-[#0046be] shrink-0">
                                ${item.price.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="text-[11px] font-bold text-slate-500 mb-2">
                        Popular Solar Searches:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {popularSearches.map((term) => (
                          <button
                            key={term}
                            onClick={() => {
                              onSearchChange(term);
                              setSearchFocused(false);
                              scrollToSection("products");
                            }}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-[#0046be] hover:text-white transition-colors"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Action Icons (Compare, Saved, Account, Cart) */}
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              {/* Compare Button */}
              {compareCount > 0 && (
                <button
                  onClick={onOpenCompareModal}
                  className="relative flex items-center gap-1 h-10 px-2.5 sm:px-3 rounded-md bg-[#003494] hover:bg-[#002870] text-xs font-bold text-white transition-colors"
                  title="Compare Products"
                >
                  <Layers className="h-4 w-4 text-[#ffe000]" />
                  <span className="hidden sm:inline">Compare</span>
                  <Badge className="bg-[#ffe000] text-black hover:bg-[#ffe000] font-black text-[10px] h-4 min-w-4 px-1 rounded-full border-0">
                    {compareCount}
                  </Badge>
                </button>
              )}

              {/* Saved / Wishlist */}
              <button
                onClick={() => navigate(user ? "/account" : "/auth")}
                className="relative hidden sm:flex items-center justify-center h-10 w-10 rounded-md hover:bg-white/10 text-white transition-colors"
                title="Saved Items"
              >
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ffe000]" />
                )}
              </button>

              {/* Account Dropdown */}
              <div ref={accountRef} className="relative hidden sm:block">
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="flex items-center gap-1.5 h-10 px-2.5 rounded-md hover:bg-white/10 text-white text-xs font-semibold transition-colors"
                >
                  <UserRound className="h-5 w-5 text-white/90" />
                  <span className="max-w-[100px] truncate">
                    {user?.email ? user.email.split("@")[0] : "Account"}
                  </span>
                  <ChevronDown className="h-3 w-3 text-white/70" />
                </button>

                {accountMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 rounded-xl bg-white p-2 text-slate-900 shadow-2xl border border-slate-200 z-50 animate-in fade-in-50 duration-150">
                    {user ? (
                      <>
                        <div className="px-3 py-2 border-b">
                          <p className="text-xs font-bold truncate">{user.email}</p>
                          <p className="text-[10px] text-slate-500">Signed In Customer</p>
                        </div>
                        <button
                          onClick={() => { navigate("/account"); setAccountMenuOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-slate-100 rounded-md text-left mt-1"
                        >
                          <UserRound className="h-4 w-4 text-slate-500" /> My Account
                        </button>
                        <button
                          onClick={() => { navigate("/orders"); setAccountMenuOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-slate-100 rounded-md text-left"
                        >
                          <Package className="h-4 w-4 text-slate-500" /> My Orders & Tracking
                        </button>
                        <button
                          onClick={() => { signOut(); setAccountMenuOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-md text-left border-t mt-1"
                        >
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="p-3 text-center border-b">
                          <Button
                            onClick={() => { navigate("/auth"); setAccountMenuOpen(false); }}
                            className="w-full bg-[#0046be] hover:bg-[#003b95] text-white font-bold text-xs h-9"
                          >
                            Sign In / Register
                          </Button>
                        </div>
                        <button
                          onClick={() => { navigate("/orders"); setAccountMenuOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-slate-100 rounded-md text-left mt-1"
                        >
                          <Package className="h-4 w-4 text-slate-500" /> Track Guest Order
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Cart Drawer Trigger */}
              <div className="flex items-center">
                <Cart />
              </div>

              {/* Mobile Search Toggle */}
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="flex md:hidden items-center justify-center h-10 w-10 rounded-md hover:bg-white/10 text-white"
                title="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                className="flex lg:hidden items-center justify-center h-10 w-10 rounded-md hover:bg-white/10 text-white"
                title="Menu"
              >
                {megaMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar Expand */}
          {mobileSearchOpen && (
            <div className="pb-3 md:hidden">
              <div className="flex items-center">
                <Input
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search solar panels, inverters, batteries..."
                  className="h-10 rounded-l-md rounded-r-none bg-white text-slate-900 text-xs focus-visible:ring-0"
                />
                <button
                  onClick={() => {
                    scrollToSection("products");
                    setMobileSearchOpen(false);
                  }}
                  className="h-10 px-3 bg-[#ffe000] text-black font-bold rounded-r-md"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── 3. Secondary Best Buy Sub-Nav Bar ── */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-16 sm:top-[72px] z-40">
        <div className="container mx-auto px-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-4 py-2 min-w-max text-xs font-bold text-slate-700">
            {/* Deal of the Day Tab */}
            <button
              onClick={() => scrollToSection("deal-of-the-day")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#bb0620] text-white hover:bg-[#a1051b] transition-colors shadow-sm"
            >
              <Flame className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span>Deal of the Day</span>
            </button>

            {/* System Sizer Finder */}
            <button
              onClick={() => scrollToSection("system-sizer")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-[#0046be] hover:bg-blue-100 transition-colors border border-blue-200 font-extrabold"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Solar System Finder</span>
            </button>

            <span className="h-4 w-px bg-slate-200 mx-1" />

            {/* Main Categories in Sub-nav */}
            <button
              onClick={() => {
                onSelectCategory("all");
                scrollToSection("products");
              }}
              className={`px-3 py-1.5 rounded-md hover:text-[#0046be] transition-colors ${
                activeCategory === "all" ? "text-[#0046be] bg-blue-50" : ""
              }`}
            >
              All Solar Gear
            </button>

            {relevantCategories.slice(0, 6).map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  scrollToSection("products");
                }}
                className={`px-3 py-1.5 rounded-md hover:text-[#0046be] transition-colors ${
                  activeCategory === cat.id ? "text-[#0046be] bg-blue-50" : ""
                }`}
              >
                {cat.name}
              </button>
            ))}

            <button
              onClick={() => scrollToSection("why-us")}
              className="px-3 py-1.5 rounded-md hover:text-[#0046be] transition-colors ml-auto text-slate-500 hover:text-slate-900"
            >
              Why Tech Innovation
            </button>
            <Link
              to="/about"
              className="px-3 py-1.5 rounded-md hover:text-[#0046be] transition-colors text-slate-500 hover:text-slate-900"
            >
              About & Services
            </Link>
          </div>
        </div>
      </nav>

      {/* ── 4. Best Buy Mega-Menu / Departments Drawer ── */}
      {megaMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-start">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="bg-[#0046be] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-lg">
                <Sun className="h-5 w-5 text-[#ffe000]" />
                <span>All Departments</span>
              </div>
              <button
                onClick={() => setMegaMenuOpen(false)}
                className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Department List */}
            <div className="p-4 overflow-y-auto flex-1 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1">
                Solar & Power Equipment
              </div>

              {[
                { title: "Solar Panels & Photovoltaic", icon: Sun, categoryId: "75aaa2f1-99eb-4ec1-8ada-7a8bdf19999a" },
                { title: "Hybrid & Solar Inverters", icon: Zap, categoryId: "39755c99-54b3-4b0c-b2d0-a0dc01281dd0" },
                { title: "Lithium & Backup Batteries", icon: BatteryCharging, categoryId: "d36b75fa-d7aa-49c6-8791-6f8da23a49f5" },
                { title: "Complete Solar Home Kits", icon: Layers, categoryId: "d2c49002-0a60-4ff6-84b1-33b2df1824ee" },
                { title: "Electrical Protection & Breakers", icon: ShieldCheck, categoryId: "51895d86-7b8a-4ad0-8578-57c91d833e02" },
                { title: "Solar Floodlights & Security", icon: Flame, categoryId: "5232e9e7-cfb0-43b5-9a6a-4948cbd36ac5" },
                { title: "Solar Cables & MC4 Connectors", icon: Wrench, categoryId: "62e268b4-2abf-424b-8e5d-980609b91088" },
                { title: "Smart Wi-Fi Energy Monitors", icon: Zap, categoryId: "5411437c-11c3-4206-82ab-8e77ac8ac98b" },
              ].map(({ title, icon: Icon, categoryId }) => (
                <button
                  key={title}
                  onClick={() => {
                    onSelectCategory(categoryId);
                    setMegaMenuOpen(false);
                    scrollToSection("products");
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 text-left text-sm font-bold text-slate-800 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-[#0046be]" />
                    {title}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </button>
              ))}

              <div className="pt-4 border-t my-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1">
                  Customer Tools & Services
                </div>
                <button
                  onClick={() => {
                    scrollToSection("system-sizer");
                    setMegaMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 text-left text-sm font-bold text-[#0046be]"
                >
                  <span className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-[#0046be]" /> Solar Sizer Calculator
                  </span>
                  <Badge className="bg-[#ffe000] text-black text-[10px] border-0">Interactive</Badge>
                </button>

                <button
                  onClick={() => {
                    onOpenStoreModal();
                    setMegaMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 text-left text-sm font-bold text-slate-800"
                >
                  <span className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-emerald-600" /> Harare Showroom & Pickup
                  </span>
                </button>

                <button
                  onClick={() => {
                    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Hello Tech Innovation, I need an engineer quote for solar.")}`, "_blank");
                    setMegaMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-emerald-50 text-left text-sm font-bold text-emerald-700"
                >
                  <span className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4 text-[#25D366]" /> Chat on WhatsApp
                  </span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t text-xs text-slate-600">
              <p className="font-bold text-slate-900">Tech Innovation Zimbabwe</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Call: 0778158984 • 0784721912</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
