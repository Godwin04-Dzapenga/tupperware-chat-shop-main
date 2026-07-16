import { MapPin, ExternalLink } from "lucide-react";

// Google Maps embed — no API key or token required
const MAPS_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3798.123456789!2d30.9870!3d-17.8252!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTfCsDQ5JzMwLjciUyAzMMKwNTknMTMuMiJF!5e0!3m2!1sen!2szw!4v1234567890";
const DIRECTIONS_URL =
  "https://www.google.com/maps/dir/?api=1&destination=-17.8252,30.9870";

export const LocationMap = () => {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border shadow-sm">
      {/* Map iframe — free, no token needed */}
      <div className="relative h-[260px] w-full bg-muted">
        <iframe
          title="Oasis Sales location — 944 New Adylin, Westgate, Harare"
          src={MAPS_EMBED_URL}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full"
        />
      </div>

      {/* Info bar below the map */}
      <div className="flex items-center justify-between gap-3 bg-card px-4 py-3">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="font-semibold text-foreground">Oasis Sales</p>
            <p className="text-xs text-muted-foreground">944 New Adylin, Westgate, Harare, Zimbabwe</p>
          </div>
        </div>
        <a
          href={DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Directions
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
};
