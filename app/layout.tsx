import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import ServiceWorkerRegistration from "./ServiceWorkerRegistration";
import { Providers } from "./providers";
import { ThemeToggle } from "./app/components/ThemeToggle";

export const metadata: Metadata = {
  title: "FuelOS",
  description: "Votre nutrition endurance pilotée par la data",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <ServiceWorkerRegistration />
        <Providers>
          <div className="fixed top-4 left-4 z-50">
            <ThemeToggle />
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
