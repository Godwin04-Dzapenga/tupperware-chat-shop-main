import {
  ArrowLeft,
  ArrowUpRight,
  BatteryCharging,
  Bolt,
  CheckCircle2,
  ChevronRight,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Sun,
  Wrench,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const WHATSAPP = "263778158984";

const services = [
  {
    icon: Sun,
    eyebrow: "01",
    title: "Solar power",
    text: "Solar panels, complete kits and practical power solutions for homes and businesses.",
  },
  {
    icon: BatteryCharging,
    eyebrow: "02",
    title: "Energy storage",
    text: "Battery options for backup power, energy storage and dependable everyday use.",
  },
  {
    icon: Bolt,
    eyebrow: "03",
    title: "Power electronics",
    text: "Inverters, electrical equipment and accessories selected around your system needs.",
  },
  {
    icon: Wrench,
    eyebrow: "04",
    title: "Technical support",
    text: "System sizing, installation coordination, testing guidance and after-sales support.",
  },
];

const principles = [
  "Clear technical guidance before you buy",
  "Equipment matched to the intended application",
  "Practical support from selection to installation",
  "Straightforward communication and quotations",
];

const process = [
  {
    number: "01",
    title: "Understand",
    text: "We start with your appliances, load requirements, budget and the problem you need to solve.",
  },
  {
    number: "02",
    title: "Recommend",
    text: "We help identify compatible equipment and a practical system configuration for the requirement.",
  },
  {
    number: "03",
    title: "Supply",
    text: "Choose the equipment you need and arrange the next step for delivery or collection.",
  },
  {
    number: "04",
    title: "Support",
    text: "We remain available for installation coordination, testing guidance and future maintenance needs.",
  },
];

function openWhatsApp() {
  window.open(`https://wa.me/${WHATSAPP}`, "_blank", "noopener,noreferrer");
}

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 text-slate-950 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="rounded-full px-3 text-slate-700 hover:bg-slate-100 hover:text-slate-950"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Back to shop</span>
            <span className="sm:hidden">Back</span>
          </Button>

          <div className="ml-auto flex items-center gap-2 text-sm font-black tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-amber-300">
              <Sun className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">TECH INNOVATION</span>
          </div>

          <Button
            onClick={openWhatsApp}
            className="ml-2 rounded-full bg-slate-950 px-4 font-bold text-white hover:bg-slate-800"
          >
            <MessageCircle className="mr-2 h-4 w-4 text-amber-300" />
            <span className="hidden sm:inline">Get a quote</span>
            <span className="sm:hidden">Quote</span>
          </Button>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_80%_20%,rgba(245,158,11,.22),transparent_28%),linear-gradient(135deg,#020617_0%,#0f172a_55%,#172033_100%)]">
          <div className="absolute -right-32 top-20 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-cyan-400/5 blur-3xl" />

          <div className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.22em] text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                About Tech Innovation
              </div>

              <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-[-.04em] sm:text-6xl lg:text-7xl">
                Powering better decisions with practical technology.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                We bring solar power, backup energy and electronics together in one place — with clear product information, practical technical guidance and support when you need it.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  onClick={openWhatsApp}
                  className="h-12 rounded-full bg-amber-400 px-6 font-black text-slate-950 shadow-lg shadow-amber-500/10 hover:bg-amber-300"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Talk to us
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="h-12 rounded-full border-white/15 bg-white/5 px-6 font-bold text-white hover:bg-white/10 hover:text-white"
                >
                  Explore equipment
                </Button>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
                {["Solar systems", "Backup power", "Electronics", "Technical support"].map((item) => (
                  <span key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-300" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
              <div className="rounded-[2rem] border border-white/10 bg-white/[.06] p-3 shadow-2xl shadow-black/30 backdrop-blur">
                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/80 p-6 sm:p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[.2em] text-slate-500">Power ecosystem</p>
                      <h2 className="mt-2 text-2xl font-black">One place. Multiple solutions.</h2>
                    </div>
                    <div className="rounded-2xl bg-amber-300/10 p-3 text-amber-300">
                      <Sun className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-3">
                    {[
                      { icon: Sun, title: "Solar", label: "Generation" },
                      { icon: BatteryCharging, title: "Battery", label: "Storage" },
                      { icon: Bolt, title: "Inverter", label: "Conversion" },
                      { icon: Wrench, title: "Support", label: "Installation" },
                    ].map(({ icon: Icon, title, label }) => (
                      <div key={title} className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                        <Icon className="h-5 w-5 text-amber-300" />
                        <p className="mt-5 font-black">{title}</p>
                        <p className="mt-1 text-xs text-slate-500">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-300/10 bg-amber-300/[.06] p-4">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-amber-300" />
                    <p className="text-sm leading-6 text-slate-300">
                      We focus on helping customers understand what they are buying and how it fits the intended system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-14 text-slate-950 sm:py-20">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[.25em] text-amber-600">What we do</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Technology that solves real power needs.</h2>
              <p className="mt-4 text-base leading-7 text-slate-500">
                From individual components to complete solutions, our catalogue is built around practical energy and electronics requirements.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {services.map(({ icon: Icon, eyebrow, title, text }) => (
                <article key={title} className="group rounded-3xl border border-slate-200 bg-slate-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-amber-200 hover:bg-white hover:shadow-xl hover:shadow-slate-200/60">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-amber-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-black text-slate-300">{eyebrow}</span>
                  </div>
                  <h3 className="mt-7 text-xl font-black">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
                  <div className="mt-6 flex items-center text-sm font-bold text-slate-900">
                    Learn more
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-100 py-14 text-slate-950 sm:py-20">
          <div className="mx-auto grid max-w-[1440px] gap-12 px-4 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[.25em] text-amber-600">Why our approach</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Buy with more clarity.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                Power equipment works best when the components match the requirement. Our approach puts the application first, then the equipment.
              </p>
              <Button onClick={() => navigate("/")} className="mt-7 rounded-full bg-slate-950 px-5 font-bold text-white hover:bg-slate-800">
                Browse the catalogue
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {principles.map((item, index) => (
                <div key={item} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-sm font-black text-amber-700">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-black">{item}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      A straightforward approach designed to make the next step easier.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-14 text-slate-950 sm:py-20">
          <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[.25em] text-amber-600">Our process</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">From requirement to working system.</h2>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-4">
              {process.map(({ number, title, text }, index) => (
                <div key={number} className="relative rounded-3xl border border-slate-200 p-6">
                  <span className="text-5xl font-black tracking-tight text-slate-100">{number}</span>
                  <h3 className="mt-5 text-xl font-black">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
                  {index < process.length - 1 && (
                    <ChevronRight className="absolute -right-5 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 rounded-full border border-slate-200 bg-white p-1.5 text-slate-400 lg:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-7 sm:p-10 lg:p-12">
              <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.25em] text-amber-300">Ready when you are</p>
                  <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
                    Need a solar quote, battery, inverter or technical advice?
                  </h2>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
                    Talk directly with Tech Innovation and tell us what you need. We can help you work through the next step.
                  </p>
                </div>

                <Button onClick={openWhatsApp} className="h-12 rounded-full bg-amber-400 px-7 font-black text-slate-950 hover:bg-amber-300">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp for a quote
                </Button>
              </div>

              <div className="mt-10 grid gap-3 border-t border-white/10 pt-7 sm:grid-cols-2 lg:grid-cols-4">
                <a href="tel:0778158984" className="rounded-2xl border border-white/10 bg-white/[.03] p-4 transition hover:bg-white/[.06]">
                  <Phone className="h-4 w-4 text-amber-300" />
                  <p className="mt-3 text-xs text-slate-500">Call / WhatsApp</p>
                  <p className="mt-1 text-sm font-bold">0778158984</p>
                </a>
                <a href="tel:0784721912" className="rounded-2xl border border-white/10 bg-white/[.03] p-4 transition hover:bg-white/[.06]">
                  <Phone className="h-4 w-4 text-amber-300" />
                  <p className="mt-3 text-xs text-slate-500">Call / WhatsApp</p>
                  <p className="mt-1 text-sm font-bold">0784721912</p>
                </a>
                <a href="mailto:infotitechinnovations@gmail.com" className="rounded-2xl border border-white/10 bg-white/[.03] p-4 transition hover:bg-white/[.06]">
                  <Mail className="h-4 w-4 text-amber-300" />
                  <p className="mt-3 text-xs text-slate-500">Email</p>
                  <p className="mt-1 break-all text-sm font-bold">infotitechinnovations@gmail.com</p>
                </a>
                <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
                  <MapPin className="h-4 w-4 text-amber-300" />
                  <p className="mt-3 text-xs text-slate-500">Location</p>
                  <p className="mt-1 text-sm font-bold">Zimbabwe</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950 px-4 py-7 text-slate-400 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-black text-white">
            <Sun className="h-4 w-4 text-amber-300" />
            TECH INNOVATION
          </div>
          <p>Solar power, backup energy, electronics and technical support.</p>
          <button onClick={() => navigate("/")} className="font-bold text-white hover:text-amber-300">
            Back to shop
          </button>
        </div>
      </footer>
    </div>
  );
}
