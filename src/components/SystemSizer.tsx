import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Home,
  Building,
  BatteryCharging,
  Sun,
  ShieldCheck,
  CheckCircle2,
  ShoppingCart,
  MessageCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { SYSTEM_SIZER_PRESETS, SizerPreset } from "@/data/solarProducts";

interface SystemSizerProps {
  onAddPresetToCart: (preset: SizerPreset) => void;
  onConsultWhatsApp: (preset: SizerPreset) => void;
}

const WHATSAPP = "263778158984";

export const SystemSizer = ({ onAddPresetToCart, onConsultWhatsApp }: SystemSizerProps) => {
  const [selectedLoad, setSelectedLoad] = useState<string>("family");
  const [backupGoal, setBackupGoal] = useState<"night" | "full" | "offgrid">("night");

  const currentPreset = SYSTEM_SIZER_PRESETS.find((p) => p.id === selectedLoad) || SYSTEM_SIZER_PRESETS[1];

  // Adjust price slightly based on backup goal
  const adjustedPrice = backupGoal === "night"
    ? currentPreset.estimatedPrice
    : backupGoal === "full"
    ? Math.round(currentPreset.estimatedPrice * 1.25)
    : Math.round(currentPreset.estimatedPrice * 1.55);

  return (
    <section id="system-sizer" className="my-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-bb-blue/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-bb-blue">
          <Sparkles className="h-3.5 w-3.5" /> Solar System Finder
        </div>
        <h2 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Find Your Ideal Solar Setup in 2 Easy Steps
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Not sure what capacity you need? Select your typical property appliances to get an instant matched inverter, battery, and panel recommendation.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        {/* Step 1 & 2 Controls */}
        <div className="space-y-6">
          {/* Step 1: Property size */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">
              Step 1: Choose Your Typical Appliances & Power Load
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { id: "essentials", label: "Starter Home", desc: "Lights, TV, Wi-Fi, Fridge", icon: Home },
                { id: "family", label: "Family Home", desc: "+ Deep Freezer, Microwave, Pressure pump", icon: Zap },
                { id: "executive", label: "Executive Villa", desc: "+ Borehole pump, Aircon, Large property", icon: Building },
              ].map(({ id, label, desc, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedLoad(id)}
                  className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all ${
                    selectedLoad === id
                      ? "border-bb-blue bg-blue-50/50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <Icon className={`h-6 w-6 ${selectedLoad === id ? "text-bb-blue" : "text-slate-400"}`} />
                  <span className="font-bold text-sm text-slate-900 mt-2">{label}</span>
                  <span className="text-[11px] text-slate-500 mt-1 leading-normal">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Backup Duration */}
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-slate-500">
              Step 2: Desired Backup Duration & Solar Goal
            </label>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                { key: "night", label: "Load Shedding", sub: "6–10 hrs overnight" },
                { key: "full", label: "24/7 Power", sub: "Seamless day & night" },
                { key: "offgrid", label: "100% Off-Grid", sub: "Complete independence" },
              ].map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setBackupGoal(g.key as any)}
                  className={`py-3 px-3 rounded-lg border text-center transition-all ${
                    backupGoal === g.key
                      ? "border-bb-blue bg-bb-blue text-white font-bold shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-700 font-semibold hover:bg-slate-100"
                  }`}
                >
                  <p className="text-xs">{g.label}</p>
                  <p className={`text-[10px] ${backupGoal === g.key ? "text-white/80" : "text-slate-500"}`}>{g.sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Appliance breakdown for active selection */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Appliances Supported:
            </h4>
            <p className="mt-1.5 text-xs text-slate-700 leading-relaxed font-medium">
              {currentPreset.appliances}
            </p>
          </div>
        </div>

        {/* Recommended System Card */}
        <div className="rounded-2xl border-2 border-bb-blue bg-gradient-to-b from-blue-50/40 to-white p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-bb-blue">
                Recommended Match
              </span>
              <Badge className="bg-bb-yellow text-black hover:bg-bb-yellow font-black text-[10px] border-0">
                Turnkey Complete
              </Badge>
            </div>

            <h3 className="text-xl font-black text-slate-900 mt-2">
              {currentPreset.title} Package
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentPreset.bestFor}
            </p>

            {/* Spec breakdown */}
            <div className="mt-5 space-y-3">
              <div className="flex items-start gap-2.5 text-xs">
                <div className="h-6 w-6 rounded-md bg-bb-blue/10 text-bb-blue flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900">Inverter: </span>
                  <span className="text-slate-700">{currentPreset.recommendedInverter}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <div className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <BatteryCharging className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900">Storage: </span>
                  <span className="text-slate-700">{currentPreset.recommendedBattery}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <div className="h-6 w-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Sun className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900">Solar Array: </span>
                  <span className="text-slate-700">{currentPreset.recommendedPanels}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <div className="h-6 w-6 rounded-md bg-blue-100 text-bb-blue flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="font-bold text-slate-900">Included: </span>
                  <span className="text-slate-700">DC combiner, surge arrestor, fuses, roof mounting rails & solar cabling</span>
                </div>
              </div>
            </div>

            {/* Price section */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-semibold">Estimated System Price</span>
                  <div className="text-3xl font-black text-bb-ink">
                    ${adjustedPrice.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded">
                    Save ~${currentPreset.monthlySavings}/mo on bills
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                *Includes genuine warranty and technical sizing consultation. Professional installation available upon request.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 space-y-2">
            <Button
              onClick={() => onAddPresetToCart({ ...currentPreset, estimatedPrice: adjustedPrice })}
              className="w-full bg-bb-yellow hover:bg-bb-yellow-dark text-black font-extrabold text-sm h-11 rounded-lg shadow-sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" /> Add Package to Cart
            </Button>
            <Button
              variant="outline"
              onClick={() => onConsultWhatsApp({ ...currentPreset, estimatedPrice: adjustedPrice })}
              className="w-full border-slate-300 font-bold text-xs h-10 hover:bg-slate-100 text-slate-800"
            >
              <MessageCircle className="h-4 w-4 mr-1.5 text-wa" /> Chat with Solar Engineer on WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
