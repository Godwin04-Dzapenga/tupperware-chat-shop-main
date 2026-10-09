import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Search,
  Heart,
  UserRound,
  MapPin,
  Menu,
  X,
  ChevronDown,
  Layers,
  Zap,
  Smartphone,
  Tv,
  Cpu,
  Cable,
  Camera,
  Gamepad2,
  Headphones,
  Laptop,
  ShieldCheck,
  Flame,
  Wrench,
  MessageCircle,
  ArrowRight,
  LogOut,
  Package,
  Phone,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Cart } from "@/components/Cart";
import { useAuth } from "@/lib/auth";
import { useWishlist } from "@/hooks/useWishlist";
import { useCategories, useProducts } from "@/hooks/useCatalog";
import { useStoreUI } from "@/hooks/useStoreUI";
import { useStoreActions, WHATSAPP_NUMBER } from "@/hooks/useStoreActions";

const CATEGORY_ICONS = [Laptop, Smartphone, Tv, Headphones, Gamepad2, Camera, Cable, Cpu];

export const StoreHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts();
  const { compareProducts, setCompareModalOpen, setStoreModalOpen } = useStoreUI();
  const { orderViaWhatsApp } = useStoreActions();

  const [query, setQuery] = useState("");
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

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

  // Reset transient state when navigating between pages
  useEffect(() => {
    setMegaMenuOpen(false);
    setSearchFocused(false);
    setAccountMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  const searchResults = query.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.brand.toLowerCase().includes(query.toLowerCase()) ||
            p.product_type.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const popularSearches = [...new Set(products.map((product) => product.brand).filter((brand) => brand && brand !== "Other"))].slice(0, 5);

  const submitSearch = (term: string) => {
    const q = term.trim();
    setSearchFocused(false);
    setMobileSearchOpen(false);
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const activeCategorySlug = location.pathname.startsWith("/c/") ? location.pathname.split("/")[2] : null;

  return (
    <>
      {/* ── 1. Top Utility Bar ── */}
      <div className="bg-bb-blue-deep text-white text-xs border-b border-white/10">
        <div className="container mx-auto px-4 flex min-h-9 items-center justify-between gap-4">
          <button
            onClick={() => setStoreModalOpen(true)}
            className="flex items-center gap-1.5 hover:text-bb-yellow font-semibold transition-colors py-1 text-left"
          >
            <MapPin className="h-3.5 w-3.5 text-bb-yellow shrink-0" />
            <span>
              <strong>Tech Innovation Zimbabwe</strong> •{" "}
              <span className="text-bb-yellow underline font-bold">Store & Pickup Info</span>
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-3 text-white/80">
            <span>Delivery options at checkout</span>
            <span>•</span>
            <span>Product details and warranty shown on listings</span>
            <span>•</span>
            <span>Shop laptops, phones and smart devices</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/orders" className="hidden sm:inline-block hover:underline text-white/90">
              Track Order
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello Tech Innovation, I have a question about a product in your online store.")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-bb-yellow font-bold text-white transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5 text-wa" />
              <span className="hidden sm:inline">WhatsApp Help:</span> 0778158984
            </a>
          </div>
        </div>
      </div>

      {/* ── 2. Main Blue Header ── */}
      <header className="sticky top-0 z-50 bg-bb-blue text-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 sm:h-[72px] items-center gap-3 sm:gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 select-none group">
              <span className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg bg-bb-yellow text-bb-ink shadow-md font-black transition-transform group-hover:scale-105">
                <Cpu className="h-6 w-6 text-bb-ink" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-bb-yellow rotate-45" />
              </span>
              <div className="text-left">
                <span className="block text-base sm:text-lg font-black tracking-tight leading-none text-white">
                  TECH INNOVATION
                </span>
                <span className="mt-1 block text-[9px] font-black uppercase tracking-[0.22em] text-bb-yellow">
                  Electronics & Smart Devices
                </span>
              </div>
            </Link>

            {/* Departments Button */}
            <button
              onClick={() => setMegaMenuOpen(!megaMenuOpen)}
              className="hidden lg:flex items-center gap-2 h-11 px-4 rounded-md bg-bb-blue-darker hover:bg-bb-blue-night font-black text-sm tracking-wide transition-colors shrink-0 shadow-inner border border-white/15"
            >
              <Menu className="h-4 w-4" />
              <span>Departments</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${megaMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Desktop Search */}
            <div ref={searchContainerRef} className="relative hidden md:block flex-1 max-w-2xl mx-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitSearch(query);
                }}
                className="relative flex items-center"
              >
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="What can we help you find today?"
                  className="h-11 w-full rounded-l-md rounded-r-none border-0 bg-white text-slate-900 pl-4 pr-10 text-sm placeholder:text-slate-400 focus-visible:ring-0 shadow-inner"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-14 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="submit"
                  aria-label="Search"
                  className="h-11 px-4 bg-bb-yellow hover:bg-bb-yellow-dark text-black font-extrabold flex items-center justify-center rounded-r-md transition-colors shadow-sm shrink-0"
                >
                  <Search className="h-5 w-5 stroke-[2.5]" />
                </button>
              </form>

              {/* Instant Suggestions */}
              {searchFocused && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white text-slate-900 rounded-lg shadow-2xl border border-slate-200 overflow-hidden z-50">
                  {searchResults.length > 0 ? (
                    <div className="p-3">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 px-2">
                        Matching Equipment
                      </div>
                      <div className="space-y-1">
                        {searchResults.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              navigate(`/product/${item.id}`);
                              setSearchFocused(false);
                            }}
                            className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-100 cursor-pointer transition-colors"
                          >
                            <img
                              src={item.image_url || undefined}
                              alt={item.name}
                              className="h-10 w-10 object-cover rounded bg-slate-50 border shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                              <p className="text-[10px] text-slate-500 uppercase">{item.brand}</p>
                            </div>
                            <span className="text-xs font-extrabold text-bb-blue shrink-0">
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => submitSearch(query)}
                        className="mt-2 w-full rounded-md bg-slate-100 hover:bg-slate-200 py-2 text-xs font-bold text-slate-700 transition-colors"
                      >
                        See all results for "{query}"
                      </button>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="text-[11px] font-bold text-slate-500 mb-2">Popular brands:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {popularSearches.map((term) => (
                          <button
                            key={term}
                            onClick={() => submitSearch(term)}
                            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-bb-blue hover:text-white transition-colors"
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

            {/* Right Actions */}
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              {compareProducts.length > 0 && (
                <button
                  onClick={() => setCompareModalOpen(true)}
                  className="relative flex items-center gap-1 h-10 px-2.5 sm:px-3 rounded-md bg-bb-blue-darker hover:bg-bb-blue-night text-xs font-bold text-white transition-colors"
                  title="Compare Products"
                >
                  <Layers className="h-4 w-4 text-bb-yellow" />
                  <span className="hidden sm:inline">Compare</span>
                  <Badge className="bg-bb-yellow text-black hover:bg-bb-yellow font-black text-[10px] h-4 min-w-4 px-1 rounded-full border-0">
                    {compareProducts.length}
                  </Badge>
                </button>
              )}

              <button
                onClick={() => navigate(user ? "/account" : "/auth")}
                className="relative hidden sm:flex items-center justify-center h-10 w-10 rounded-md hover:bg-white/10 text-white transition-colors"
                title="Saved Items"
              >
                <Heart className="h-5 w-5" />
                {wishlistItems.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-bb-yellow" />
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
                          onClick={() => {
                            navigate("/account");
                            setAccountMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-slate-100 rounded-md text-left mt-1"
                        >
                          <UserRound className="h-4 w-4 text-slate-500" /> My Account
                        </button>
                        <button
                          onClick={() => {
                            navigate("/orders");
                            setAccountMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-slate-100 rounded-md text-left"
                        >
                          <Package className="h-4 w-4 text-slate-500" /> My Orders & Tracking
                        </button>
                        <button
                          onClick={() => {
                            signOut();
                            setAccountMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-md text-left border-t mt-1"
                        >
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="p-3 text-center border-b">
                          <Button
                            onClick={() => {
                              navigate("/auth");
                              setAccountMenuOpen(false);
                            }}
                            className="w-full bg-bb-blue hover:bg-bb-blue-dark text-white font-bold text-xs h-9"
                          >
                            Sign In / Register
                          </Button>
                        </div>
                        <button
                          onClick={() => {
                            navigate("/orders");
                            setAccountMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold hover:bg-slate-100 rounded-md text-left mt-1"
                        >
                          <Package className="h-4 w-4 text-slate-500" /> Track Guest Order
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <Cart />

              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="flex md:hidden items-center justify-center h-10 w-10 rounded-md hover:bg-white/10 text-white"
                title="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              <button
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                className="flex lg:hidden items-center justify-center h-10 w-10 rounded-md hover:bg-white/10 text-white"
                title="Menu"
              >
                {megaMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          {mobileSearchOpen && (
            <div className="pb-3 md:hidden">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitSearch(query);
                }}
                className="flex items-center"
              >
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search laptops, phones, brands and model numbers..."
                  className="h-10 rounded-l-md rounded-r-none bg-white text-slate-900 text-xs focus-visible:ring-0"
                />
                <button type="submit" className="h-10 px-3 bg-bb-yellow text-black font-bold rounded-r-md">
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      {/* ── 3. Sub-Nav ── */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-16 sm:top-[72px] z-40">
        <div className="container mx-auto px-4 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-4 py-2 min-w-max text-xs font-bold text-slate-700">
            <Link
              to="/deals"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bb-red text-white hover:bg-bb-red-dark transition-colors shadow-sm"
            >
              <Flame className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span>Top Deals</span>
            </Link>

            <Link
              to="/search"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-bb-blue hover:bg-blue-100 transition-colors border border-blue-200 font-extrabold"
            >
              <Tag className="h-3.5 w-3.5" />
              <span>Shop All Products</span>
            </Link>

            <Link
              to="/#how-it-works"
              className="px-3 py-1.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 hover:text-bb-blue hover:border-blue-200 transition-colors"
            >
              How to Shop
            </Link>

            <span className="h-4 w-px bg-slate-200 mx-1" />

            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/c/${cat.slug}`}
                className={`px-3 py-1.5 rounded-md hover:text-bb-blue transition-colors ${
                  activeCategorySlug === cat.slug ? "text-bb-blue bg-blue-50" : ""
                }`}
              >
                {cat.name}
              </Link>
            ))}

            <Link
              to="/#why-us"
              className="px-3 py-1.5 rounded-md hover:text-bb-blue transition-colors ml-auto text-slate-500 hover:text-slate-900"
            >
              Why Tech Innovation
            </Link>
            <Link
              to="/about"
              className="px-3 py-1.5 rounded-md hover:text-bb-blue transition-colors text-slate-500 hover:text-slate-900"
            >
              About & Services
            </Link>
          </div>
        </div>
      </nav>

      {/* ── 4. Departments Drawer ── */}
      {megaMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-start">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200">
            <div className="bg-bb-blue text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-lg">
                <Sun className="h-5 w-5 text-bb-yellow" />
                <span>All Departments</span>
              </div>
              <button
                onClick={() => setMegaMenuOpen(false)}
                className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1">
                Product Departments
              </div>

              {categories.map((cat, index) => {
                const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      navigate(`/c/${cat.slug}`);
                      setMegaMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 text-left text-sm font-bold text-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-bb-blue" />
                      {cat.name}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                );
              })}

              <div className="pt-4 border-t my-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 py-1">
                  Customer Tools & Services
                </div>
                <button
                  onClick={() => {
                    navigate("/search");
                    setMegaMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 text-left text-sm font-bold text-bb-blue"
                >
                  <span className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-bb-blue" /> Browse all products
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    setStoreModalOpen(true);
                    setMegaMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 text-left text-sm font-bold text-slate-800"
                >
                  <span className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-emerald-600" /> Harare Showroom & Pickup
                  </span>
                </button>

                <button
                  onClick={() => orderViaWhatsApp({ name: "a product enquiry", price: 0 })}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-emerald-50 text-left text-sm font-bold text-emerald-700"
                >
                  <span className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4 text-wa" /> Chat on WhatsApp
                  </span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t text-xs text-slate-600">
              <p className="font-bold text-slate-900">Tech Innovation Zimbabwe</p>
              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                <Phone className="h-3 w-3" /> 0778158984 • 0784721912
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
