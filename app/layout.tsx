import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
export const metadata: Metadata = {
  title: "FuelOS",
  description: "Votre nutrition endurance pilotée par la data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <Providers>
                    {children}
                            </Providers>
      </body>
    </html>
  );
}