import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}