import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FuelOS — Endurance Fueling OS",
    description: "Plan, buy, prep and race your nutrition.",
      manifest: "/manifest.json",
        appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "FuelOS" },
        };

        export const viewport: Viewport = {
          themeColor: "#22c55e",
            width: "device-width",
              initialScale: 1,
                maximumScale: 1,
                };

                export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
                  return (
                      <html lang="fr">
                            <head>
                                    <link rel="apple-touch-icon" href="/favicon.ico" />
                                          </head>
                                                <body className="min-h-full flex flex-col">
                                                        {children}
                                                                <script dangerouslySetInnerHTML={{ __html: `(function(){if("serviceWorker"in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("/sw.js").then(function(r){console.log("[FuelOS] SW:",r.scope)}).catch(function(e){console.log("[FuelOS] SW fail:",e)})})}})()` }} />
                                                                      </body>
                                                                          </html>
                                                                            );
                                                                            }