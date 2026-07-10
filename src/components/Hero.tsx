import heroImage from "@/assets/hero-tupperware.jpg";
import { Button } from "@/components/ui/button";

export const Hero = () => {
  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative h-[600px] overflow-hidden rounded-3xl mb-12">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
      </div>
      
      <div className="relative h-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
          Fresh Solutions for Your Kitchen
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl">
          Premium Oasis Products to keep your food fresh, organized, and ready to go
        </p>
        <Button 
          size="lg" 
          onClick={scrollToProducts}
          className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          Shop Now
        </Button>
      </div>
    </section>
  );
};
