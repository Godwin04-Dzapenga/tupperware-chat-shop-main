import { ArrowLeft, BatteryCharging, Bolt, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Sun, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const WHATSAPP = "263778158984";

export default function About() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur-xl">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-white hover:bg-white/5"><ArrowLeft className="mr-2 h-4 w-4" /> Back to shop</Button>
          <div className="ml-auto flex items-center gap-2 font-black"><Sun className="h-5 w-5 text-amber-300" /> TECH INNOVATION</div>
        </div>
      </header>

      <main>
        <section className="border-b border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 py-24">
          <div className="container mx-auto max-w-5xl px-4">
            <p className="text-xs font-black uppercase tracking-[.3em] text-amber-300">About Tech Innovation</p>
            <h1 className="mt-4 max-w-4xl text-5xl font-black tracking-tight sm:text-6xl">Practical technology for a more reliable home and business.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/60">We bring together solar power, backup energy and electronics so customers can buy the right equipment, get clear technical guidance and arrange installation from one place.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={() => window.open(`https://wa.me/${WHATSAPP}`, "_blank")} className="rounded-full bg-amber-400 font-bold text-slate-950 hover:bg-amber-300"><MessageCircle className="mr-2 h-4 w-4" /> Talk to us</Button>
              <Button onClick={() => navigate("/")} variant="outline" className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10">Shop equipment</Button>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 text-slate-900">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="grid gap-5 md:grid-cols-4">
              {[
                { icon: Sun, title: "Solar systems", text: "Panels and complete solar solutions." },
                { icon: BatteryCharging, title: "Energy storage", text: "Batteries for dependable backup." },
                { icon: Bolt, title: "Power electronics", text: "Inverters and electrical equipment." },
                { icon: Wrench, title: "Technical support", text: "Sizing, installation and after-sales help." },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl border bg-slate-50 p-5">
                  <Icon className="h-7 w-7 text-amber-500" />
                  <h3 className="mt-5 font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-100 py-16 text-slate-900">
          <div className="container mx-auto grid max-w-5xl gap-10 px-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[.25em] text-amber-600">How we work</p>
              <h2 className="mt-3 text-3xl font-black">From requirement to working system.</h2>
              <div className="mt-7 space-y-4">
                {[
                  "Understand your appliances, load requirements and budget.",
                  "Recommend compatible equipment and an appropriate system size.",
                  "Supply the equipment and coordinate delivery.",
                  "Support installation, testing and future maintenance.",
                ].map((item, i) => <div key={item} className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-black text-amber-700">{i + 1}</span><p className="text-sm leading-6">{item}</p></div>)}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-950 p-7 text-white">
              <h2 className="text-2xl font-black">Contact Tech Innovation</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">Need a solar quotation, replacement battery, inverter, electronics or installation advice? Contact us directly.</p>
              <div className="mt-7 space-y-4 text-sm text-white/70">
                <a href="tel:0778158984" className="block"><Phone className="mr-3 inline h-4 w-4 text-amber-300" />0778158984</a>
                <a href="tel:0784721912" className="block"><Phone className="mr-3 inline h-4 w-4 text-amber-300" />0784721912</a>
                <a href="mailto:infotitechinnovations@gmail.com" className="block"><Mail className="mr-3 inline h-4 w-4 text-amber-300" />infotitechinnovations@gmail.com</a>
                <div><MapPin className="mr-3 inline h-4 w-4 text-amber-300" />Zimbabwe</div>
              </div>
              <Button onClick={() => window.open(`https://wa.me/${WHATSAPP}`, "_blank")} className="mt-8 w-full rounded-full bg-amber-400 font-bold text-slate-950 hover:bg-amber-300"><MessageCircle className="mr-2 h-4 w-4" /> WhatsApp for a quote</Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
