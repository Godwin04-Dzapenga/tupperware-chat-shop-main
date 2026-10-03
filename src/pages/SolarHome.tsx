import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BatteryCharging,
  Bolt,
  CheckCircle2,
  Flame,
  Lightbulb,
  MapPin,
  PackageCheck,
  Phone,
  Mail,
  Plug,
  Send,
  ShieldCheck,
  Star,
  Sun,
  Truck,
  Wrench,
  Zap,
  Cpu,
} from "lucide-react";
import { toast } from "sonner";
import { useProducts, useCategories } from "@/hooks/useCatalog";
import { useStoreUI } from "@/hooks/useStoreUI";
import { useStoreActions, WHATSAPP_NUMBER } from "@/hooks/useStoreActions";
import { ProductCard } from "@/components/ProductCard";
import { DealOfTheDay } from "@/components/DealOfTheDay";
import { SystemSizer } from "@/components/SystemSizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SizerPreset, getProductMedia } from "@/data/solarProducts";

const HERO_CATEGORIES = [
  {
    slug: "solar-panels",
    icon: Sun,
    title: "Solar Panels",
    desc: "450W • 550W • 600W Tier-1",
  },
  {
    slug: "inverters",
    icon: Bolt,
    title: "Hybrid Inverters",
    desc: "3.2kVA • 5kVA • 8kVA 48V",
  },
  {
    slug: "batteries",
    icon: BatteryCharging,
    title: "Lithium LiFePO4",
    desc: "5.12kWh • 10.24kWh Storage",
  },
  {
    slug: "solar-kits",
    icon: ShieldCheck,
    title: "Complete Kits",
    desc: "Turnkey home & office kits",
  },
];

const CATEGORY_ICONS: Record<string, typeof Sun> = {
  "solar-panels": Sun,
  inverters: Zap,
  batteries: BatteryCharging,
  "solar-kits": ShieldCheck,
  lighting: Lightbulb,
  electrical: Plug,
  electronics: Cpu,
  "solar-accessories": Wrench,
};

const SolarHome = () => {
  const navigate = useNavigate();
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { compareProducts, toggleCompare, setQuickViewProduct } = useStoreUI();
  const { addProduct, orderViaWhatsApp } = useStoreActions();

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const topDeals = useMemo(
    () => [...products].sort((a, b) => b.savings - a.savings).slice(0, 10),
    [products]
  );

  const featured = useMemo(() => {
    const featuredItems = products.filter((p) => p.is_featured);
    return (featuredItems.length ? featuredItems : products).slice(0, 8);
  }, [products]);

  const scrollToFeatured = () => {
    document.getElementById("featured")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleAddSizerPreset = (preset: SizerPreset) => {
    const message = encodeURIComponent(
      `Hello Tech Innovation, I would like a quotation for the ${preset.title} solar package.
Estimated package value: ${preset.estimatedPrice.toFixed(2)}.
Please confirm the exact Medusa products/variants available and prepare the package for me.`
    );
    window.open(`https://wa.me/263778158984?text=${message}`, "_blank");
  };

  const handleConsultWhatsApp = (preset: SizerPreset) => {
    const text = encodeURIComponent(
      `Hello Tech Innovation Engineer,\n\nI would like a quotation for the *${preset.title} Package* ($${preset.estimatedPrice.toLocaleString()}).\n\nIncluded Components:\n• Inverter: ${preset.recommendedInverter}\n• Battery: ${preset.recommendedBattery}\n• Solar Panels: ${preset.recommendedPanels}\n\nPlease advise on site inspection and installation schedule.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank");
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubmitted(true);
    toast.success("Thank you for subscribing! Your $10 coupon code is: POWER10");
  };

  return (
    <div>
      {/* ── 1. Hero Promo Banner ── */}
      <section className="bg-gradient-to-r from-bb-blue-ink via-bb-blue-darker to-bb-blue text-white overflow-hidden relative">
        <div className="store-shell py-12 lg:py-16 grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="max-w-2xl z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-bb-yellow px-3.5 py-1 text-xs font-black uppercase tracking-wider text-bb-ink shadow-sm">
              <Flame className="h-4 w-4 fill-bb-ink" /> Zimbabwe National Power Sale
            </div>

            <h1 className="mt-4 text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
              Quality solar systems & electronics designed to last.
            </h1>

            <p className="mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-white/85">
              Shop tier-1 monocrystalline panels, Deye & Sunsynk hybrid inverters, long-life LiFePO4
              batteries and complete turnkey packages with official warranty and Harare in-store pickup.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                onClick={scrollToFeatured}
                className="h-12 rounded-lg bg-bb-yellow hover:bg-bb-yellow-dark px-7 font-black text-black text-sm shadow-xl"
              >
                Shop All Solar Gear <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link
                to="/search?deals=1"
                className="flex h-12 items-center rounded-lg bg-bb-red px-6 text-sm font-black text-white shadow-lg transition-colors hover:bg-bb-red-dark"
              >
                Shop Top Deals
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold text-white/80">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-bb-yellow" /> Genuine Tier-1 Hardware
              </span>
              <span className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-bb-yellow" /> Professional Installation
              </span>
              <span className="flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-bb-yellow" /> Harare Showroom Pickup
              </span>
            </div>
          </div>

          {/* Hero Quick Category Cards */}
          <div className="grid grid-cols-2 gap-3 z-10">
            {HERO_CATEGORIES.map(({ slug, icon: Icon, title, desc }) => (
              <Link
                key={slug}
                to={`/c/${slug}`}
                className="group relative overflow-hidden rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-md hover:bg-white/20 transition-all shadow-lg"
              >
                <Icon className="h-6 w-6 text-bb-yellow mb-2" />
                <p className="text-sm font-black text-white group-hover:text-bb-yellow transition-colors">
                  {title}
                </p>
                <p className="text-[11px] text-white/70 mt-0.5">{desc}</p>
                <span className="text-[10px] font-bold text-bb-yellow mt-3 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Explore <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Value Props Bar ── */}
      <section className="bg-white border-b border-slate-200">
        <div className="store-shell py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          {[
            {
              icon: Truck,
              bg: "bg-blue-50",
              color: "text-bb-blue",
              title: "Harare & Nationwide Delivery",
              desc: "Free delivery on orders over $50",
            },
            {
              icon: MapPin,
              bg: "bg-amber-50",
              color: "text-amber-700",
              title: "Showroom Pickup in 2 Hours",
              desc: "Inspect and test before leaving",
            },
            {
              icon: ShieldCheck,
              bg: "bg-emerald-50",
              color: "text-emerald-700",
              title: "Official 1–5 Year Warranty",
              desc: "Direct manufacturer backed",
            },
            {
              icon: Wrench,
              bg: "bg-purple-50",
              color: "text-purple-700",
              title: "Expert Engineering Support",
              desc: "WhatsApp & on-site technicians",
            },
          ].map(({ icon: Icon, bg, color, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900">{title}</p>
                <p className="text-slate-500 text-[11px]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Top Deals Horizontal Row ── */}
      <section className="store-shell py-8">
        <div className="mb-4 flex items-end justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-bb-ink sm:text-2xl">
              <Flame className="h-5 w-5 fill-bb-red text-bb-red" /> Top Deals This Week
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Biggest savings on tier-1 solar hardware — while stock lasts.
            </p>
          </div>
          <Link
            to="/search?deals=1"
            className="hidden shrink-0 items-center gap-1 text-xs font-bold text-bb-blue hover:underline sm:flex"
          >
            See all deals <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="-mx-2 flex snap-x gap-3 overflow-x-auto px-2 pb-2 scrollbar-none">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-44 shrink-0 animate-pulse rounded-xl border border-slate-200 bg-white p-3 snap-start"
                >
                  <div className="aspect-square rounded-lg bg-slate-100" />
                  <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
                  <div className="mt-2 h-5 w-1/3 rounded bg-slate-100" />
                </div>
              ))
            : topDeals.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="group w-44 shrink-0 rounded-xl border border-slate-200 bg-white p-3 snap-start transition-all hover:border-bb-blue/40 hover:shadow-lg"
                >
                  <div className="aspect-square overflow-hidden rounded-lg bg-slate-50">
                    <img
                      src={product.image_url || getProductMedia(product).imageUrl}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  {product.savings > 0 && (
                    <p className="mt-2 text-xs font-black text-bb-red">Save ${product.savings}</p>
                  )}
                  <p className="mt-1 line-clamp-2 text-xs font-bold leading-snug text-bb-ink group-hover:text-bb-blue">
                    {product.name}
                  </p>
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span className="text-base font-black text-bb-ink">${product.price.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 line-through">
                      ${product.original_price.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                    <CheckCircle2 className="h-3 w-3" /> Pickup today
                  </p>
                </Link>
              ))}
        </div>
      </section>

      {/* ── 4. Deal of the Day ── */}
      <div className="store-shell">
        <DealOfTheDay
          onAddToCart={addProduct}
          onOrderViaWhatsApp={orderViaWhatsApp}
          onSelectProduct={(id) => navigate(`/product/${id}`)}
        />
      </div>

      {/* ── 5. Shop by Department ── */}
      <section className="store-shell py-8">
        <div className="mb-4 border-b border-slate-200 pb-3">
          <h2 className="text-xl font-black tracking-tight text-bb-ink sm:text-2xl">
            Shop by Department
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Everything for backup power, solar and smart living — in one place.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug] || Plug;
            return (
              <Link
                key={category.id}
                to={`/c/${category.slug}`}
                className="group flex flex-col items-center rounded-xl border border-slate-200 bg-white p-5 text-center transition-all hover:border-bb-blue/40 hover:shadow-md"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-bb-blue transition-colors group-hover:bg-bb-blue group-hover:text-white">
                  <Icon className="h-7 w-7" />
                </div>
                <p className="mt-3 text-sm font-bold text-bb-ink group-hover:text-bb-blue">
                  {category.name}
                </p>
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 group-hover:text-bb-blue">
                  Shop now <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 6. Solar System Sizer (Solution Finder) ── */}
      <div className="store-shell">
        <SystemSizer onAddPresetToCart={handleAddSizerPreset} onConsultWhatsApp={handleConsultWhatsApp} />
      </div>

      {/* ── 7. Featured Products Grid ── */}
      <section id="featured" className="store-shell py-8">
        <div className="mb-6 flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-bb-blue">
              Featured Catalog
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black text-bb-ink tracking-tight">
              Solar, Backup Power & Electronics
            </h2>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {isLoading ? "Loading…" : `${products.length} products available`}
            </p>
          </div>
          <Link
            to="/search?q=solar"
            className="shrink-0 text-xs font-bold text-bb-blue hover:underline"
          >
            Browse the full catalog <ArrowRight className="ml-1 inline h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="aspect-square rounded-lg bg-slate-100" />
                <div className="mt-3 h-3 w-1/3 rounded bg-slate-100" />
                <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
                <div className="mt-2 h-5 w-1/2 rounded bg-slate-100" />
                <div className="mt-4 h-10 w-full rounded-md bg-slate-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOrder={orderViaWhatsApp}
                onAddToCart={addProduct}
                onQuickView={setQuickViewProduct}
                isCompared={compareProducts.some((cp) => cp.id === product.id)}
                onToggleCompare={toggleCompare}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── 8. Why Shop With Tech Innovation ── */}
      <section className="bg-white border-t border-slate-200 py-16">
        <div className="store-shell">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-bb-blue">
              Total Customer Confidence
            </span>
            <h2 className="text-3xl font-black text-bb-ink mt-1">
              Why Thousands Choose Tech Innovation
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              We combine genuine tier-1 solar products with experienced local technical engineers to
              deliver reliable, long-term power solutions.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: ShieldCheck,
                title: "Genuine Manufacturer Warranty",
                desc: "All panels come with 12–25 year performance warranties, and inverters & batteries come with 3–5 year replacement coverage.",
              },
              {
                icon: Wrench,
                title: "Certified Engineering & COC",
                desc: "Our licensed electrical engineers provide full site surveys, wiring design, surge protection, and compliant commissioning.",
              },
              {
                icon: MapPin,
                title: "Harare Showroom & Warehouse",
                desc: "Visit our physical showroom to inspect, test, and collect your hardware in person with direct engineer assistance.",
              },
              {
                icon: Truck,
                title: "Nationwide Zimbabwe Freight",
                desc: "Fast, insured freight dispatch to Bulawayo, Mutare, Gweru, Masvingo, Victoria Falls and all rural farming districts.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-xl bg-bb-blue/10 text-bb-blue flex items-center justify-center mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h4 className="text-base font-black text-bb-ink">{title}</h4>
                <p className="text-xs leading-relaxed text-slate-600 mt-2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Verified Customer Reviews ── */}
      <section className="bg-slate-50 border-t border-slate-200 py-16">
        <div className="store-shell">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-bb-blue">
                Real Customer Experiences
              </span>
              <h2 className="text-3xl font-black text-bb-ink mt-1">
                Trusted Across Homes & Businesses
              </h2>
            </div>
            <div className="mt-3 md:mt-0 flex items-center gap-2 text-sm font-bold text-slate-700">
              <div className="flex items-center text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-amber-400" />
                ))}
              </div>
              <span>4.9 / 5.0 Average Rating (180+ Zimbabwe Reviews)</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Tinashe Moyo",
                location: "Borrowdale, Harare",
                system: "5kVA Deye + 5.12kWh Lithium Battery + 6x 550W Panels",
                comment:
                  "Installed two months ago. We haven't experienced a single second of blackout since. Inverter powers the borehole pump and all household fridges seamlessly.",
              },
              {
                name: "Dr. Farai Chikwanha",
                location: "Bulawayo Medical Centre",
                system: "8kVA Hybrid System + 10.24kWh Battery Bank",
                comment:
                  "Tech Innovation delivered the hardware promptly to Bulawayo. The build quality and genuine warranty paperwork gave us full confidence for our clinic.",
              },
              {
                name: "Grace Mutasa",
                location: "Gweru Commercial Farm",
                system: "Solar Borehole Pumping Inverter & 3.2kVA Starter Kit",
                comment:
                  "The solar system sizer tool was spot on. Engineer assisted on WhatsApp and installation was done cleanly. Excellent after-sales service.",
              },
            ].map(({ name, location, system, comment }) => (
              <div
                key={name}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-4 w-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="mt-4 text-xs font-bold text-bb-blue uppercase tracking-wide">{system}</p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-700 italic">"{comment}"</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-bb-ink">{name}</p>
                    <p className="text-[11px] text-slate-500">{location}</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 text-[10px] font-bold border-0">
                    Verified Buyer
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. Newsletter Discount Bar ── */}
      <section className="bg-bb-blue-night text-white py-10">
        <div className="store-shell max-w-4xl text-center">
          <h3 className="text-2xl font-black">Get $10 Off Your First Solar Purchase</h3>
          <p className="text-xs text-white/80 mt-1 max-w-md mx-auto">
            Join our newsletter for exclusive solar deals, load shedding alerts, and new equipment
            arrivals in Zimbabwe.
          </p>
          {newsletterSubmitted ? (
            <div className="mt-4 p-3 bg-emerald-600/30 border border-emerald-400/40 rounded-lg text-xs font-bold text-emerald-200 inline-block">
              Success! Use coupon code <strong className="text-white">POWER10</strong> at checkout for $10 off.
            </div>
          ) : (
            <form
              onSubmit={handleNewsletterSubmit}
              className="mt-5 flex flex-col sm:flex-row gap-2 justify-center max-w-md mx-auto"
            >
              <Input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className="h-11 bg-white text-slate-900 text-xs rounded-lg"
              />
              <Button
                type="submit"
                className="h-11 bg-bb-yellow hover:bg-bb-yellow-dark text-black font-extrabold text-xs px-6 rounded-lg shrink-0"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" /> Get $10 Voucher
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* ── 11. Contact strip ── */}
      <section className="bg-white py-6 border-t border-slate-200">
        <div className="store-shell flex flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
          <p className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-bb-blue" /> 0778158984 / 0784721912
          </p>
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-bb-blue" /> infotitechinnovations@gmail.com
          </p>
          <Link to="/about" className="flex items-center gap-2 font-bold text-bb-blue hover:underline">
            <MapPin className="h-4 w-4" /> Harare Showroom & Distribution Hub
          </Link>
        </div>
      </section>
    </div>
  );
};

export default SolarHome;
