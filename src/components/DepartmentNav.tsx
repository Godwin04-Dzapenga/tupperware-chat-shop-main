import { ChevronDown, Headphones, Menu, Package, Search, ShieldCheck, SolarPanel, Wrench, X, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const departments = [
  {
    title: "Solar & Energy",
    items: [
      ["Solar Panels", "/c/solar-panels"],
      ["Inverters", "/c/inverters"],
      ["Batteries", "/c/batteries"],
      ["Solar Kits", "/c/solar-kits"],
      ["Electrical", "/c/electrical"],
      ["Lighting", "/c/lighting"],
      ["Solar Accessories", "/c/solar-accessories"],
    ],
  },
  {
    title: "Electronics & Smart Tech",
    items: [
      ["Electronics", "/c/electronics"],
      ["Smart Home & Security", "/search?q=smart"],
      ["Networking & Wi-Fi", "/search?q=networking"],
      ["Computers & Accessories", "/search?q=computers"],
      ["Mobile & Charging", "/search?q=mobile"],
      ["Audio & Speakers", "/search?q=audio"],
    ],
  },
];

export const DepartmentNav = () => {
  const [open, setOpen] = useState(false);

  return (
    <section className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
      <div className="store-shell">
        <div className="flex min-h-12 items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex shrink-0 items-center gap-2 rounded-md bg-bb-blue px-4 py-2.5 text-xs font-black text-white hover:bg-bb-blue-dark"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            Shop by Department
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          <Link className="shrink-0 px-4 py-2 text-xs font-bold text-bb-ink hover:text-bb-blue" to="/search?deals=1">Top Deals</Link>
          <Link className="shrink-0 px-4 py-2 text-xs font-bold text-bb-ink hover:text-bb-blue" to="/search?q=solar">Solar Solutions</Link>
          <Link className="shrink-0 px-4 py-2 text-xs font-bold text-bb-ink hover:text-bb-blue" to="/search?q=electronics">Electronics</Link>
          <Link className="shrink-0 px-4 py-2 text-xs font-bold text-bb-ink hover:text-bb-blue" to="/about">Services & Support</Link>
          <Link className="ml-auto hidden shrink-0 items-center gap-1 px-3 py-2 text-xs font-bold text-bb-blue md:flex" to="/search">
            <Search className="h-3.5 w-3.5" /> Browse all products
          </Link>
        </div>

        {open && (
          <div className="grid gap-6 border-t border-slate-100 py-5 md:grid-cols-2">
            {departments.map((department) => (
              <div key={department.title}>
                <h3 className="flex items-center gap-2 text-sm font-black text-bb-ink">
                  {department.title === "Solar & Energy" ? <Zap className="h-4 w-4 text-bb-blue" /> : <Headphones className="h-4 w-4 text-bb-blue" />}
                  {department.title}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {department.items.map(([label, href]) => (
                    <Link key={href} onClick={() => setOpen(false)} to={href} className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:border-bb-blue/40 hover:bg-blue-50 hover:text-bb-blue">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="md:col-span-2 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3">
              <div className="flex gap-2"><ShieldCheck className="h-4 w-4 text-bb-blue shrink-0" /><span className="text-[11px] text-slate-600">Warranty and product support</span></div>
              <div className="flex gap-2"><Wrench className="h-4 w-4 text-bb-blue shrink-0" /><span className="text-[11px] text-slate-600">Installation and site assessment</span></div>
              <div className="flex gap-2"><Package className="h-4 w-4 text-bb-blue shrink-0" /><span className="text-[11px] text-slate-600">Pickup and delivery options</span></div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};