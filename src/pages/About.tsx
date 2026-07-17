import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, Truck, Heart, Award, Users, MapPin, Phone, Mail, Star } from "lucide-react";
import logoImage from "@/assets/tuppafrica-logo.jpg";
import oasisSalesLogo from "@/assets/oasis-sales-logo.jpg";

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto flex items-center gap-4 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Shop
          </Button>
          <img src={logoImage} alt="TuppAfrica" className="h-8 w-auto" />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-900/40 via-slate-950 to-slate-950" />
        <div className="relative container mx-auto max-w-4xl px-4 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-teal-400">Our Story</p>
          <h1 className="mb-6 text-4xl font-extrabold leading-tight sm:text-5xl">
            Bringing premium kitchen solutions<br />
            <span className="bg-gradient-to-r from-teal-300 to-amber-200 bg-clip-text text-transparent">to every Zimbabwean home</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/70">
            TuppAfrica Zimbabwe, operated by Oasis Sales, is your trusted authorised distributor of official Tupperware products in Harare. We believe every kitchen deserves quality that lasts a lifetime.
          </p>
        </div>
      </section>

      {/* Mission cards */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Heart, title: "Our Mission", color: "bg-red-50 text-red-500", text: "To make premium, food-safe kitchen storage accessible and affordable for families across Zimbabwe — from Harare to every corner of the country." },
              { icon: ShieldCheck, title: "Our Promise", color: "bg-teal-50 text-teal-600", text: "Every product we sell is 100% genuine Tupperware — BPA-free, food-safe, and backed by our lifetime warranty. No counterfeits, ever." },
              { icon: Award, title: "Our Standard", color: "bg-amber-50 text-amber-600", text: "We are an officially verified Tupperware distributor. That means rigorous quality checks, genuine products, and direct manufacturer support." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl border bg-card p-6 shadow-sm">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${item.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            {[
              { value: "500+", label: "Happy Customers" },
              { value: "100%", label: "Genuine Products" },
              { value: "Lifetime", label: "Warranty" },
              { value: "24hr", label: "Cold Retention" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-extrabold">{stat.value}</p>
                <p className="mt-1 text-sm font-medium text-primary-foreground/80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who we are */}
      <section className="py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Who We Are</p>
              <h2 className="mb-4 text-3xl font-extrabold">Oasis Sales — Harare's trusted Tupperware home</h2>
              <p className="mb-4 text-muted-foreground leading-relaxed">
                Based in Westgate, Harare, Oasis Sales was founded with one goal: bring the world's most trusted kitchen storage brand closer to Zimbabwean families. We are not just a reseller — we are a dedicated distribution partner with direct ties to Tupperware's supply chain.
              </p>
              <p className="mb-6 text-muted-foreground leading-relaxed">
                From our showroom on New Adylin to our online store, we've served hundreds of families, schools, and businesses across Harare with products that genuinely improve daily life — cleaner pantries, fresher meals, less waste.
              </p>
              <div className="flex items-center gap-3">
                <img src={oasisSalesLogo} alt="Oasis Sales" className="h-14 w-auto" />
                <div className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Verified Distributor</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { icon: Users, title: "Family-run business", text: "Personal service you can trust, not a faceless corporation." },
                { icon: MapPin, title: "Locally rooted", text: "We know Zimbabwe's needs — we live here too." },
                { icon: Truck, title: "Fast Harare delivery", text: "Same-day and next-day delivery within Harare." },
                { icon: Star, title: "Top-rated service", text: "Consistently 5-star rated by our loyal customers." },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-4 rounded-xl border bg-card p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-2 text-3xl font-extrabold">Get in touch</h2>
          <p className="mb-8 text-muted-foreground">We'd love to hear from you. Reach out any time.</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: MapPin, label: "Visit us", value: "944 New Adylin, Westgate, Harare" },
              { icon: Phone, label: "Call us", value: "+263 784 721 912" },
              { icon: Mail, label: "Email us", value: "info@tuppafrica.co.zw" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border bg-card p-5 shadow-sm">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-sm font-medium">{item.value}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="rounded-full gap-2" onClick={() => window.open("https://wa.me/2630784721912", "_blank")}>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
              Chat on WhatsApp
            </Button>
            <Button size="lg" variant="outline" className="rounded-full" onClick={() => navigate("/")}>
              Browse Products
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
