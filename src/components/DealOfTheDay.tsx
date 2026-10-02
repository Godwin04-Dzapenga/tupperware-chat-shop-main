import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, MessageCircle, Clock, Zap, CheckCircle2, ShieldCheck, Flame, ArrowRight } from "lucide-react";
import { getProductMedia } from "@/data/solarProducts";

interface DealOfTheDayProps {
  onAddToCart: (product: any) => void;
  onOrderViaWhatsApp: (product: any) => void;
  onSelectProduct: (productId: string) => void;
}

export const DealOfTheDay = ({ onAddToCart, onOrderViaWhatsApp, onSelectProduct }: DealOfTheDayProps) => {
  // Live ticking countdown to midnight
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 42, seconds: 19 });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = Math.max(0, endOfDay.getTime() - now.getTime());

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, []);

  const dealProduct = {
    id: "6f5d9f9a-070e-4ee6-be63-aaac9f0355ed",
    name: "Deye 5kVA / 48V Hybrid Solar Inverter (Wi-Fi Included)",
    price: 950,
    originalPrice: 1150,
    savings: 200,
    stock_quantity: 3,
    brand: "Deye",
    product_type: "inverter",
    description: "Industry-leading 5kW low-voltage hybrid inverter with color touch LCD, zero-export, dual MPPT and seamless UPS auto-switching.",
  };

  const media = getProductMedia(dealProduct);

  const formatNumber = (num: number) => String(num).padStart(2, "0");

  return (
    <section className="bg-gradient-to-r from-bb-blue-ink via-bb-blue-dark to-bb-blue text-white rounded-2xl overflow-hidden shadow-xl border border-blue-400/20 my-8">
      <div className="container mx-auto p-6 lg:p-8">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-bb-red px-3.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-sm">
              <Flame className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> Deal of the Day
            </span>
            <span className="hidden sm:inline-block text-xs font-bold text-bb-yellow">
              Exclusive Online & Harare Showroom Special
            </span>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10">
            <Clock className="h-4 w-4 text-bb-yellow animate-pulse" />
            <span className="text-xs font-semibold text-white/80">Offer Ends In:</span>
            <div className="flex items-center gap-1 font-mono text-xs font-black">
              <span className="bg-white/20 px-2 py-0.5 rounded text-white">{formatNumber(timeLeft.hours)}h</span>
              <span>:</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-white">{formatNumber(timeLeft.minutes)}m</span>
              <span>:</span>
              <span className="bg-bb-yellow px-2 py-0.5 rounded text-black">{formatNumber(timeLeft.seconds)}s</span>
            </div>
          </div>
        </div>

        {/* Content Showcase */}
        <div className="grid gap-8 items-center lg:grid-cols-[1.1fr_1fr] mt-6">
          {/* Left: Product Media Gallery */}
          <div className="relative group rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-4 backdrop-blur-sm">
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900">
              <img
                src={media.imageUrl}
                alt={dealProduct.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                <span className="bg-bb-yellow text-bb-ink font-black text-xs px-2.5 py-1 rounded shadow-md uppercase">
                  SAVE ${dealProduct.savings}
                </span>
                <span className="bg-bb-ink/90 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                  Free Wi-Fi Logger Included
                </span>
              </div>
            </div>

            {/* Thumbnail previews */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {media.galleryImages.slice(0, 3).map((img, i) => (
                <div key={i} className="aspect-video rounded-lg overflow-hidden bg-slate-800 border border-white/10">
                  <img src={img} alt="Thumbnail" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Pricing, Specs & Actions */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-bb-yellow">
                {dealProduct.brand} • Authorized Dealer
              </span>
              <span className="text-xs text-white/50">• Model: {media.modelNumber}</span>
            </div>

            <h3
              onClick={() => onSelectProduct(dealProduct.id)}
              className="mt-2 text-2xl sm:text-3xl font-black text-white hover:text-bb-yellow cursor-pointer transition-colors leading-tight"
            >
              {dealProduct.name}
            </h3>

            <p className="mt-3 text-sm text-white/75 leading-relaxed">
              {dealProduct.description}
            </p>

            {/* Price Box */}
            <div className="mt-5 p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-bb-yellow">
                  ${dealProduct.price.toFixed(2)}
                </span>
                <span className="text-base line-through text-white/50 font-bold">
                  ${dealProduct.originalPrice.toFixed(2)}
                </span>
                <Badge className="bg-bb-red hover:bg-bb-red text-white font-black text-xs border-0">
                  Save ${dealProduct.savings} today
                </Badge>
              </div>

              {/* Stock claim meter */}
              <div className="mt-3.5 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-white/90">Claimed: 84%</span>
                  <span className="text-bb-yellow font-bold">Only {dealProduct.stock_quantity} left at this price!</span>
                </div>
                <div className="h-2.5 w-full bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-bb-yellow to-amber-400 rounded-full w-[84%]" />
                </div>
              </div>
            </div>

            {/* Feature Bullets */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-white/80">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-bb-yellow shrink-0" />
                <span>5kW Continuous / 10kW Surge</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-bb-yellow shrink-0" />
                <span>5-Year Official Warranty</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-bb-yellow shrink-0" />
                <span>Dual MPPT Tracker</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-bb-yellow shrink-0" />
                <span>Pickup Today in Harare</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={() => onAddToCart(dealProduct)}
                className="h-12 px-7 bg-bb-yellow hover:bg-bb-yellow-dark text-black font-black text-sm rounded-lg shadow-lg flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" /> Add to Cart — ${dealProduct.price}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOrderViaWhatsApp(dealProduct)}
                className="h-12 px-6 border-white/30 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-lg flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4 text-wa" /> Lock Deal via WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
