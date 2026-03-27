import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FuelOS — Endurance Fueling OS",
    description: "Plan, buy, prep and race your nutrition. Multi-brand endurance fueling system.",
      manifest: "/manifest.json",
        appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "FuelOS" },
        };
        
        export const viewport: Viewport = {
          themeColor: "#22c55e",
            width: "device-width",
              initialScale: 1,
                maximumScale: 1,
                };
                
                export default function RootLayout({
                  children,
                  }: Readonly<{
                    children: React.ReactNode;
                    }>) {
                      return (
                          <html lang="fr">
                                <body className="min-h-full flex flex-col">{children}</body>
                                    </html>
                                      );
                                      }
