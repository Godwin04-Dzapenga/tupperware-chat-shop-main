import type { Metadata, Viewport } from "next";
import "../src/index.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:8080"),
  title: {
    default: "Tech Innovation | Laptops & Smart Devices in Zimbabwe",
    template: "%s | Tech Innovation",
  },
  description:
    "Shop laptops, gaming devices, electronics and smart technology from trusted brands at Tech Innovation in Zimbabwe.",
  applicationName: "Tech Innovation",
  authors: [{ name: "Tech Innovation" }],
  openGraph: {
    type: "website",
    siteName: "Tech Innovation",
    title: "Tech Innovation | Laptops & Smart Devices in Zimbabwe",
    description:
      "Shop laptops, gaming devices, electronics and smart technology from trusted brands at Tech Innovation in Zimbabwe.",
    images: ["/tech-innovations-logo.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tech Innovation | Laptops & Smart Devices in Zimbabwe",
    images: ["/tech-innovations-logo.svg"],
  },
  icons: { icon: "/tech-innovations-logo.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08266c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
