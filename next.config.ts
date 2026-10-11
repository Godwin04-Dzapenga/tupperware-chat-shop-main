import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compatibility bridge: existing local .env.local files can keep their Vite
  // variable names during the first migration stage. These values are public
  // storefront configuration (backend URL and Medusa publishable key).
  env: {
    "process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL":
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || process.env.VITE_MEDUSA_BACKEND_URL || "",
    "process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY":
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || process.env.VITE_MEDUSA_PUBLISHABLE_KEY || "",
    "process.env.NEXT_PUBLIC_SUPABASE_URL":
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
    "process.env.NEXT_PUBLIC_COMMERCE_CATALOG_PROVIDER": process.env.NEXT_PUBLIC_COMMERCE_CATALOG_PROVIDER || process.env.VITE_COMMERCE_CATALOG_PROVIDER || "medusa",
    "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY":
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "",
  },
  poweredByHeader: false,
};

export default nextConfig;
