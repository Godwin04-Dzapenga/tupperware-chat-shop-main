import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export const LocationMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map with Mapbox token from environment
    const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (!token) {
      console.error('Mapbox token not configured');
      return;
    }

    mapboxgl.accessToken = token;
    
    // Coordinates for Westgate, Harare, Zimbabwe
    const coordinates: [number, number] = [30.9870, -17.8252];
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: coordinates,
      zoom: 14,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Create custom marker element
    const markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';
    markerElement.style.width = '32px';
    markerElement.style.height = '32px';
    markerElement.style.backgroundImage = 'url(https://docs.mapbox.com/help/demos/custom-markers-gl-js/mapbox-icon.png)';
    markerElement.style.backgroundSize = 'contain';
    markerElement.style.cursor = 'pointer';

    // Add marker with popup
    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
      `<div class="p-2">
        <h3 class="font-semibold text-sm mb-1">Oasis Sales</h3>
        <p class="text-xs text-gray-600">944 New Adylin, Westgate<br/>Harare, Zimbabwe</p>
        <a 
          href="https://www.google.com/maps/dir/?api=1&destination=-17.8252,30.9870" 
          target="_blank"
          rel="noopener noreferrer"
          class="text-xs text-blue-600 hover:underline mt-1 inline-block"
        >
          Get Directions
        </a>
      </div>`
    );

    new mapboxgl.Marker(markerElement)
      .setLngLat(coordinates)
      .setPopup(popup)
      .addTo(map.current);

    // Show popup by default
    popup.addTo(map.current);

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div className="w-full h-[300px] rounded-lg overflow-hidden shadow-lg border border-border">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};
