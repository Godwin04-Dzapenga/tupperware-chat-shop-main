import { Link } from "react-router-dom";
import { Sun, MapPin, Phone, Mail, MessageCircle, Truck, ShieldCheck, Wrench, PackageCheck } from "lucide-react";
import { useCategories } from "@/hooks/useCatalog";
import { WHATSAPP_NUMBER } from "@/hooks/useStoreActions";

export const StoreFooter = () => {
  const { data: categories = [] } = useCategories();

  return (
    <footer className="bg-bb-footer text-white pt-12 pb-8 border-t border-white/10 text-xs">
      <div className="container mx-auto px-4 grid gap-8 md:grid-cols-5">
        {/* Brand & Contact */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2 font-black text-base">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bb-yellow text-bb-ink">
              <Sun className="h-5 w-5 fill-bb-ink text-bb-ink" />
            </span>
            <span>TECH INNOVATION</span>
          </div>
          <p className="text-white/60 leading-relaxed max-w-sm">
            Zimbabwe's trusted destination for tier-1 solar panels, hybrid inverters, lithium batteries, backup
            electrical equipment and certified professional installations.
          </p>
          <div className="space-y-1.5 text-white/80 pt-2">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-bb-yellow" /> Harare Showroom & Distribution Hub, Zimbabwe
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-bb-yellow" /> 0778158984 / 0784721912
            </p>
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-bb-yellow" /> infotitechinnovations@gmail.com
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-3 text-white/60">
            <span className="flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-bb-yellow" /> Nationwide Delivery
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-bb-yellow" /> Official Warranty
            </span>
            <span className="flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5 text-bb-yellow" /> Certified Installers
            </span>
            <span className="flex items-center gap-1.5">
              <PackageCheck className="h-3.5 w-3.5 text-bb-yellow" /> Showroom Pickup
            </span>
          </div>
        </div>

        {/* Shop Departments */}
        <div>
          <h4 className="font-bold text-white text-sm">Shop Solar</h4>
          <ul className="mt-3 space-y-2 text-white/60">
            {categories.slice(0, 6).map((cat) => (
              <li key={cat.id}>
                <Link to={`/c/${cat.slug}`} className="hover:text-white">
                  {cat.name}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/search?deals=1" className="hover:text-white">
                Top Deals
              </Link>
            </li>
          </ul>
        </div>

        {/* Services & Support */}
        <div>
          <h4 className="font-bold text-white text-sm">Services & Support</h4>
          <ul className="mt-3 space-y-2 text-white/60">
            <li>
              <Link to="/orders" className="hover:text-white">
                Track Your Order
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-white">
                Installation & Engineering
              </Link>
            </li>
            <li>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("I need warranty support or technical service.")}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                Warranty & Returns
              </a>
            </li>
            <li>
              <Link to="/about" className="hover:text-white">
                About Tech Innovation
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-white">
                Sign In / Register
              </Link>
            </li>
          </ul>
        </div>

        {/* Payments */}
        <div>
          <h4 className="font-bold text-white text-sm">Accepted Payments</h4>
          <p className="mt-3 text-white/60 leading-relaxed">
            We accept USD Cash on Delivery, EcoCash via Paynow, Bank Transfer, Zipit, and Card Payments.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold text-white">USD Cash</span>
            <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold text-white">EcoCash</span>
            <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold text-white">Paynow</span>
            <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold text-white">Zipit / Bank</span>
            <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold text-white">Visa / MC</span>
          </div>
          <div className="mt-5 pt-3 border-t border-white/10">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="w-full h-9 rounded bg-wa hover:bg-wa-dark text-white font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp Support
            </a>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-white/40 text-[11px] gap-2">
        <p>© {new Date().getFullYear()} Tech Innovation Zimbabwe. All rights reserved.</p>
        <div className="flex gap-4">
          <Link to="/about" className="hover:text-white">
            Privacy Policy
          </Link>
          <Link to="/about" className="hover:text-white">
            Terms of Sale
          </Link>
          <Link to="/about" className="hover:text-white">
            Warranty Guidelines
          </Link>
        </div>
      </div>
    </footer>
  );
};
