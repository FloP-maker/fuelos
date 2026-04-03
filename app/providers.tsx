'use client';

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import type { ComponentType, PropsWithChildren, ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { DebriefCloudMigration } from "./components/DebriefCloudMigration";

// Certains setups TypeScript (IDE / versions @types) ne fusionnent pas `children`
// avec `ThemeProviderProps` pour le JSX. On force un composant typé explicitement.
const ThemeProvider = NextThemesProvider as ComponentType<
  PropsWithChildren<ThemeProviderProps>
>;

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth">
      <DebriefCloudMigration />
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange={false}
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
