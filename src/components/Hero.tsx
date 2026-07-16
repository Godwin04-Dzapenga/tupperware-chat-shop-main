import { useState, useEffect } from "react";
import heroImage from "@/assets/hero-tupperware.jpg";
import { useAuth } from "@/lib/auth";
import { ShieldCheck, Truck, Sparkles } from "lucide-react";

// Rotation array of premium background kitchenware / bottle banner images
const bannerImages = [
  heroImage,
  "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=1200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&auto=format&fit=crop&q=80"
];

export const Hero = () => {
  const { user } = useAuth();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  
  const fullName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const firstName = fullName ? fullName.split(" ")[0] : "";

  // Auto-rotate background image every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImgIndex((prev) => (prev + 1) % bannerImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToCategory = (categorySlug: string) => {
    scrollToProducts();
    setTimeout(() => {
      const buttons = document.querySelectorAll("button");
      buttons.forEach((btn) => {
        if (btn.textContent?.toLowerCase().includes(categorySlug.toLowerCase())) {
          (btn as HTMLButtonElement).click();
        }
      });
    }, 100);
  };

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-md h-32 md:h-24">
      
      {/* Background Image Carousel Container with smooth crossfade opacity */}
      <div className="absolute inset-0 z-0">
        {bannerImages.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out`}
            style={{ 
              backgroundImage: `url(${image})`,
              opacity: index === currentImgIndex ? 0.6 : 0
            }}
          />
        ))}
        {/* Dark Blue-Teal overlay tint for typography legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-primary/45" />
      </div>

      {/* Slim Content Flex Container */}
      <div className="relative z-10 flex h-full flex-col md:flex-row items-center justify-between gap-2 px-6 py-3.5 md:py-0">
        
        {/* Left Side: Dynamic Greeting & Header */}
        <div className="flex flex-col text-left self-center">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-bold text-teal-300 uppercase tracking-widest">Official Store Zimbabwe</span>
            {user && (
              <span className="text-[9px] text-white/80 font-medium border-l border-white/20 pl-2">
                Welcome, <span className="text-primary font-bold">{firstName}</span>
              </span>
            )}
          </div>
          <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight leading-tight">
            Kitchen fresh containers, lunch boxes &amp; bottles
          </h1>
          <p className="text-[9px] text-white/70 hidden sm:block">
            Premium durability kitchen solutions. Tap categories below to browse collections.
          </p>
        </div>

        {/* Right Side: Fast Category Filters */}
        <div className="flex flex-wrap items-center gap-3 self-center">
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => scrollToCategory("bottles")}
              className="rounded-full bg-white/15 border border-white/5 px-2.5 py-0.5 text-[9px] font-bold text-white hover:bg-primary transition-all hover:scale-105"
            >
              💧 Bottles
            </button>
            <button 
              onClick={() => scrollToCategory("lunch")}
              className="rounded-full bg-white/15 border border-white/5 px-2.5 py-0.5 text-[9px] font-bold text-white hover:bg-primary transition-all hover:scale-105"
            >
              🍱 Lunch Boxes
            </button>
            <button 
              onClick={() => scrollToCategory("containers")}
              className="rounded-full bg-white/15 border border-white/5 px-2.5 py-0.5 text-[9px] font-bold text-white hover:bg-primary transition-all hover:scale-105"
            >
              🫙 Containers
            </button>
          </div>

          {/* Inline USP Icons */}
          <div className="hidden lg:flex items-center gap-3 border-l border-white/10 pl-3 text-[9px] text-white/85">
            <span className="flex items-center gap-1 font-semibold">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Guarantee
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Truck className="h-3 w-3 text-sky-400" />
              Delivery
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
