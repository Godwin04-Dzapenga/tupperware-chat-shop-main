import heroImage from "@/assets/hero-tupperware.jpg";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, ShieldCheck, MessageSquare, MapPin, Droplets, Package2, ThermometerSun } from "lucide-react";

export const Hero = () => {
  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="group relative mb-8 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-xl [perspective:1200px]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-teal-950/40" />
      </div>

      <div className="relative z-10 flex min-h-[350px] flex-col justify-between p-4 transition-transform duration-500 group-hover:[transform:rotateX(2deg)_rotateY(-2deg)_translateY(-4px)] sm:p-6 md:p-10 lg:p-12">
        <div className="max-w-3xl text-left">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-teal-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Premium Drinkware &amp; Kitchenware
          </div>

          <h1 className="mb-3 text-2xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Organize every pour. <span className="bg-gradient-to-r from-teal-300 to-amber-200 bg-clip-text text-transparent">Elevate every kitchen ritual.</span>
          </h1>

          <p className="mb-6 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
            Discover reusable insulated bottles, pantry canisters, and meal-prep essentials designed for cleaner living, everyday hydration, and beautifully organized spaces.
          </p>

          <div className="mb-6 flex flex-wrap gap-2">
            {[
              "100% BPA-Free",
              "24hr Cold / 12hr Hot",
              "Leakproof Guarantee",
              "Lifetime Warranty",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/85 backdrop-blur-md"
              >
                {item}
              </span>
            ))}
          </div>

          <Button
            variant="default"
            size="default"
            onClick={scrollToProducts}
            className="w-full rounded-full bg-accent px-6 py-5 text-sm font-semibold text-accent-foreground shadow-md transition-all hover:scale-102 hover:bg-accent/90 sm:w-auto"
          >
            Shop Collection
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-xs text-white/80">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/20 text-teal-300">
              <Droplets className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-white">Hydration First</p>
              <p className="text-white/60">Clean, insulated, everyday-ready</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/80">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/20 text-teal-300">
              <Package2 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-white">Pantry Systems</p>
              <p className="text-white/60">Stackable storage that keeps it tidy</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/80">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/20 text-teal-300">
              <ThermometerSun className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-white">Temperature Control</p>
              <p className="text-white/60">Cold stays cold, hot stays hot</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};