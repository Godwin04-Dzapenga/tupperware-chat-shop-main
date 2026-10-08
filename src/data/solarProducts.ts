// Curated product imagery and specifications for Tech Innovation

export interface ProductMediaData {
  imageUrl: string;
  galleryImages: string[];
  brand: string;
  modelNumber: string;
  originalPrice: number;
  savings: number;
  badge?: string;
  keySpecs: string[];
  warranty: string;
  pickupStatus: string;
  deliveryStatus: string;
  features: string[];
  whatsInTheBox: string[];
}

// High-resolution, professional solar and power electronics imagery
export const PRODUCT_MEDIA_MAP: Record<string, ProductMediaData> = {
  // Solar Panels
  "solar_panel": {
    imageUrl: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&h=800&fit=crop&q=85",
    galleryImages: [
      "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&h=800&fit=crop&q=85",
      "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=800&fit=crop&q=85",
      "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&h=800&fit=crop&q=85",
    ],
    brand: "Jinko Solar / Tech Innovation",
    modelNumber: "JKM550M-72HL4-V",
    originalPrice: 220,
    savings: 40,
    badge: "Top Seller",
    keySpecs: [
      "550W High-Efficiency Monocrystalline",
      "21.3% Module Efficiency Tier-1",
      "Multi-busbar half-cell technology",
      "Anodized aluminum alloy frame",
      "IP68 Weatherproof Junction Box",
    ],
    warranty: "12-Year Product • 25-Year Linear Output",
    pickupStatus: "Ready in 2 hours at Harare Showroom",
    deliveryStatus: "Free Harare delivery on 4+ panels",
    features: [
      "Ultra-high efficiency under low-light and cloudy conditions",
      "Anti-PID (Potential Induced Degradation) protection",
      "Certified to withstand heavy wind loads (2400 Pa) and snow loads",
      "Pre-wired with 1.2m solar cable and genuine MC4 connectors",
    ],
    whatsInTheBox: [
      "Tier-1 550W Monocrystalline Solar Panel",
      "Pre-installed MC4 Connectors & Cables",
      "Factory QC Test & Inspection Certificate",
      "Manufacturer Warranty Card",
    ],
  },

  // Inverters
  "inverter": {
    imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=800&fit=crop&q=85",
    galleryImages: [
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=800&fit=crop&q=85",
      "https://images.unsplash.com/photo-1558441719-8b449c6ff673?w=800&h=800&fit=crop&q=85",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&h=800&fit=crop&q=85",
    ],
    brand: "Deye / Sunsynk",
    modelNumber: "SUN-5K-SG03LP1-EU",
    originalPrice: 1150,
    savings: 200,
    badge: "Deal of the Day",
    keySpecs: [
      "5kW Continuous / 10kW Surge Capacity",
      "Dual MPPT Tracker (125V–425V range)",
      "Color Touch LCD & Wi-Fi Mobile App",
      "48V Low Voltage Battery Support",
      "Seamless UPS switchover < 4ms",
    ],
    warranty: "5-Year Official Manufacturer Warranty",
    pickupStatus: "In Stock at Harare Showroom",
    deliveryStatus: "Free Dispatch across Harare & Bulawayo",
    features: [
      "Automatic generator start and load-shedding automatic transfer",
      "Supports parallel operation up to 16 units for expanded commercial loads",
      "Intelligent battery management (LiFePO4 BMS auto-communication)",
      "Zero-export capability for grid-tied or off-grid operation",
    ],
    whatsInTheBox: [
      "Deye 5kVA Hybrid Inverter Unit",
      "Wi-Fi Plug-in Data Logger",
      "Current Transformer (CT Clamp)",
      "Wall Mounting Bracket & Screws",
      "User Manual & Wiring Schematic",
    ],
  },

  // Batteries
  "battery": {
    imageUrl: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&h=800&fit=crop&q=85",
    galleryImages: [
      "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&h=800&fit=crop&q=85",
      "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800&h=800&fit=crop&q=85",
      "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&h=800&fit=crop&q=85",
    ],
    brand: "Tech Innovation LiFePO4",
    modelNumber: "TI-5120-LFP",
    originalPrice: 1450,
    savings: 250,
    badge: "Popular Pick",
    keySpecs: [
      "5.12kWh Usable Energy Capacity (51.2V 100Ah)",
      "6,000+ Deep Cycles at 80% DOD",
      "Grade-A LiFePO4 Prismatic Cells",
      "Built-in Smart BMS with CAN/RS485",
      "Wall-mount or floor-stand installation",
    ],
    warranty: "5-Year Full Replacement Warranty",
    pickupStatus: "In Stock - Pickup Available",
    deliveryStatus: "Safe pallet delivery nationwide",
    features: [
      "Compatible with Deye, Sunsynk, Growatt, Victron and Must inverters",
      "Integrated circuit breaker and battery quick-disconnect safety switch",
      "Thermal runaway and overcurrent built-in protection",
      "Expandable up to 15 units in parallel (up to 76.8kWh)",
    ],
    whatsInTheBox: [
      "5.12kWh Lithium Battery Module",
      "Heavy-Duty Wall Mounting Plate",
      "Positive & Negative 25mm² Battery Power Cables",
      "RJ45 CAN/RS485 Communication Cable",
      "Grounding Cable & Mounting Hardware",
    ],
  },

  // Solar Kits
  "solar_kit": {
    imageUrl: "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=800&h=800&fit=crop&q=85",
    galleryImages: [
      "https://images.unsplash.com/photo-1545208942-e1c9c916524b?w=800&h=800&fit=crop&q=85",
      "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&h=800&fit=crop&q=85",
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=800&fit=crop&q=85",
    ],
    brand: "Tech Innovation Complete Kit",
    modelNumber: "TI-KIT-3200",
    originalPrice: 2150,
    savings: 300,
    badge: "Complete System",
    keySpecs: [
      "3.2kVA Pure Sine Wave Inverter",
      "2.56kWh LiFePO4 Lithium Battery Pack",
      "4x 450W Monocrystalline Solar Panels (1800W)",
      "Includes Roof Rails, DC Combiner & Cables",
      "Optional Professional Installation",
    ],
    warranty: "3-Year System Warranty • 25-Year Panel Output",
    pickupStatus: "Complete Package Ready at Warehouse",
    deliveryStatus: "Free Installation Consultation in Harare",
    features: [
      "Runs lights, Wi-Fi router, LED TVs, laptops, fridges, and home entertainment",
      "Comes pre-wired with AC & DC surge protection distribution box",
      "Plug-and-play installation with labeled diagrams",
      "Certified installation crew available on request",
    ],
    whatsInTheBox: [
      "1x 3.2kVA Hybrid Solar Inverter",
      "1x 2.56kWh Lithium LiFePO4 Battery",
      "4x 450W Monocrystalline PV Panels",
      "Complete Aluminum Roof Mounting Structure",
      "Pre-wired DC Combiner Box with Surge Arrestor",
      "50m 6mm² UV Solar Cable + MC4 Connectors",
    ],
  },

  // Lighting
  "lighting": {
    imageUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=800&fit=crop&q=85",
    galleryImages: [
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=800&fit=crop&q=85",
      "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=800&fit=crop&q=85",
    ],
    brand: "SolarPro LED",
    modelNumber: "SP-FL-200W",
    originalPrice: 110,
    savings: 25,
    badge: "Best Value",
    keySpecs: [
      "200W Ultra-Bright LED Array (2,200 Lumens)",
      "Separate High-Efficiency PV Panel with 5m cable",
      "Dusk-to-Dawn Optical & Radar Motion Sensor",
      "IP67 Waterproof Die-Cast Aluminum Body",
      "Wireless Remote Control included",
    ],
    warranty: "2-Year Replacement Warranty",
    pickupStatus: "In Stock - Same Day Pickup",
    deliveryStatus: "Standard delivery $5 or free with any panel",
    features: [
      "Zero electricity cost - 100% solar powered security lighting",
      "Provides up to 14 hours of continuous night illumination",
      "Multi-mode timer settings (3h, 5h, 8h, or full night radar auto)",
      "Ideal for yard, perimeter fence, driveway, gate, and warehouse lighting",
    ],
    whatsInTheBox: [
      "200W Heavy-Duty LED Solar Floodlight",
      "Monocrystalline Solar Collector Panel",
      "Multifunction Remote Control (Batteries included)",
      "Wall/Pole Mounting Arm & Expansion Bolts",
    ],
  },

  // Electrical / Protection
  "electrical": {
    imageUrl: "https://images.unsplash.com/photo-1558441719-8b449c6ff673?w=800&h=800&fit=crop&q=85",
    galleryImages: [
      "https://images.unsplash.com/photo-1558441719-8b449c6ff673?w=800&h=800&fit=crop&q=85",
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&h=800&fit=crop&q=85",
    ],
    brand: "TOMZN / Tech Innovation",
    modelNumber: "TOVPD1-63-VA",
    originalPrice: 85,
    savings: 20,
    badge: "Essential Protection",
    keySpecs: [
      "63A High-Current Capacity (Adjustable 1A–63A)",
      "Digital Dual LED Voltage & Current Readout",
      "Over-Voltage (230V–300V) & Under-Voltage Protection",
      "Auto-recovery with programmable delay timer",
      "Standard 35mm DIN-rail mounting",
    ],
    warranty: "2-Year Warranty",
    pickupStatus: "In Stock at Harare Showroom",
    deliveryStatus: "Fast dispatch Harare & across Zimbabwe",
    features: [
      "Shields sensitive appliances, inverters and fridges from grid spikes and brownouts",
      "Instant disconnection (<0.1s) when dangerous voltage is detected",
      "Real-time voltage and current monitoring display",
      "Compact size fits directly inside standard distribution boards",
    ],
    whatsInTheBox: [
      "63A Digital Voltage & Surge Protector",
      "Installation & Calibration Manual",
    ],
  },

  // Cables & Accessories
  "accessory": {
    imageUrl: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800&h=800&fit=crop&q=85",
    galleryImages: [
      "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=800&h=800&fit=crop&q=85",
      "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&h=800&fit=crop&q=85",
    ],
    brand: "Top Cable Solar",
    modelNumber: "H1Z2Z2-K 6mm²",
    originalPrice: 3.5,
    savings: 1.0,
    badge: "High Grade",
    keySpecs: [
      "6mm² Tinned Copper Core conductor",
      "Dual XLPO Insulation, UV & Ozone Resistant",
      "TÜV Rheinland & CE Certified to EN 50618",
      "Operating temp: -40°C to +120°C",
      "Rated for 1500V DC Photovoltaic Systems",
    ],
    warranty: "25-Year Outdoor Design Life",
    pickupStatus: "Sold by the meter or 100m roll in stock",
    deliveryStatus: "Dispatched same day",
    features: [
      "Ultra-low resistance minimizes voltage drop between panels and inverter",
      "Halogen-free, flame retardant safety design",
      "Available in Red (+) and Black (-) polarity",
    ],
    whatsInTheBox: [
      "Cut-to-length 6mm² Solar PV Cable (sold per meter or 100m spool)",
    ],
  },

  // Smart Devices
  "smart_device": {
    imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=800&fit=crop&q=85",
    galleryImages: [
      "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&h=800&fit=crop&q=85",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=800&fit=crop&q=85",
    ],
    brand: "Tuya / Smart Life",
    modelNumber: "WIFI-EM-100",
    originalPrice: 65,
    savings: 20,
    badge: "Smart Tech",
    keySpecs: [
      "Real-time kWh, Voltage, Amps and Wattage tracking",
      "Wi-Fi connectivity with Tuya / Smart Life iOS & Android Apps",
      "Historical energy graphs (hourly, daily, monthly)",
      "Overload and high-consumption mobile alerts",
      "Prepaid bill and solar production balance monitoring",
    ],
    warranty: "1-Year Warranty",
    pickupStatus: "In Stock - Pickup Available",
    deliveryStatus: "Nationwide courier delivery",
    features: [
      "See exactly how much power your borehole, geyser or home is drawing",
      "Set automated timers and rules to cut non-essential loads during load-shedding",
      "No hub required, connects directly to 2.4GHz Wi-Fi",
    ],
    whatsInTheBox: [
      "Smart Wi-Fi Energy Meter",
      "100A External Split-Core CT Sensor",
      "Wi-Fi Antenna Extension",
      "Quick App Setup Guide",
    ],
  },
};

// Fallback resolver for any product
export function getProductMedia(product: {
  id?: string;
  name?: string;
  product_type?: string | null;
  image_url?: string | null;
  price?: number;
}): ProductMediaData {
  const type = product.product_type?.toLowerCase() || "";
  const name = (product.name || "").toLowerCase();

  let matchedType = "solar_panel";
  if (type.includes("inverter") || name.includes("inverter")) matchedType = "inverter";
  else if (type.includes("battery") || name.includes("battery") || name.includes("lifepo4")) matchedType = "battery";
  else if (type.includes("kit") || name.includes("kit") || name.includes("starter")) matchedType = "solar_kit";
  else if (type.includes("light") || name.includes("floodlight") || name.includes("lamp")) matchedType = "lighting";
  else if (type.includes("cable") || name.includes("cable") || name.includes("wire") || name.includes("mc4")) matchedType = "accessory";
  else if (type.includes("electrical") || name.includes("protector") || name.includes("breaker")) matchedType = "electrical";
  else if (
    type.includes("smart") ||
    type.includes("monitor") ||
    type.includes("meter") ||
    type.includes("laptop") ||
    type.includes("phone") ||
    type.includes("tablet") ||
    type.includes("computer") ||
    type.includes("electronics") ||
    name.includes("laptop") ||
    name.includes("phone") ||
    name.includes("tablet") ||
    name.includes("computer") ||
    name.includes("monitor")
  ) matchedType = "electronics";
  else if (type.includes("panel") || name.includes("panel") || name.includes("mono")) matchedType = "solar_panel";

  const preset =
    matchedType === "electronics"
      ? {
          ...PRODUCT_MEDIA_MAP["smart_device"],
          imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop&q=85",
          galleryImages: [
            "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop&q=85",
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop&q=85",
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop&q=85",
          ],
          badge: "Electronics",
        }
      : PRODUCT_MEDIA_MAP[matchedType] || PRODUCT_MEDIA_MAP["solar_panel"];

  return {
    ...preset,
    imageUrl: product.image_url && !product.image_url.includes("0.2930892299948875") && !product.image_url.includes("photo-1584308972272-9e4e7685e80f")
      ? product.image_url
      : preset.imageUrl,
  };
}

export function resolveProductImage(item: {
  image_url?: string | null;
  name?: string;
  product_type?: string | null;
}): string {
  return getProductMedia(item).imageUrl;
}

// System Sizer Presets for the solar solution guide
export interface SizerPreset {
  id: string;
  title: string;
  iconName: string;
  appliances: string;
  recommendedInverter: string;
  recommendedBattery: string;
  recommendedPanels: string;
  estimatedPrice: number;
  monthlySavings: number;
  bestFor: string;
}

export const SYSTEM_SIZER_PRESETS: SizerPreset[] = [
  {
    id: "essentials",
    title: "Starter Home Essentials",
    iconName: "Home",
    appliances: "LED Lights, Wi-Fi Router, 55\" TV, Laptop, Phones & 1x Energy Saver Refrigerator",
    recommendedInverter: "3.2kVA Pure Sine Wave Inverter (24V)",
    recommendedBattery: "2.56kWh Lithium LiFePO4 Battery Pack",
    recommendedPanels: "4x 450W Monocrystalline Panels (1.8kW Array)",
    estimatedPrice: 1850,
    monthlySavings: 45,
    bestFor: "Flats, apartments, cottages, small townhouses",
  },
  {
    id: "family",
    title: "Complete Family Home",
    iconName: "Zap",
    appliances: "Everything in Starter + Double Door Fridge, Deep Freezer, Microwave, Borehole Pressure Pump, CCTV & Garage Door",
    recommendedInverter: "5kVA Deye / Sunsynk Hybrid Inverter (48V)",
    recommendedBattery: "5.12kWh LiFePO4 Lithium Battery Wall-Mount",
    recommendedPanels: "6x 550W Tier-1 Monocrystalline Panels (3.3kW Array)",
    estimatedPrice: 2850,
    monthlySavings: 95,
    bestFor: "3 to 4 Bedroom family home with borehole & continuous load shedding backup",
  },
  {
    id: "executive",
    title: "Heavy Load / Executive Villa",
    iconName: "ShieldCheck",
    appliances: "Everything in Family + 1hp Submersible Borehole Pump, Air Conditioners, Pool Pump, Washing Machine & Home Office",
    recommendedInverter: "8kVA / 10kVA Deye Hybrid Inverter (48V)",
    recommendedBattery: "10.24kWh (2x 5.12kWh LiFePO4 Parallel Banks)",
    recommendedPanels: "10x 550W / 600W Bifacial Panels (5.5kW+ Array)",
    estimatedPrice: 4750,
    monthlySavings: 160,
    bestFor: "Large houses, commercial offices, lodges, farms with high daytime & night power demands",
  },
];
