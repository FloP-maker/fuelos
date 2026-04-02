'use client';

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import type { ComponentType, PropsWithChildren, ReactNode } from "react";
<<<<<<< HEAD
=======
import { SessionProvider } from "next-auth/react";
>>>>>>> group-by-hour-98d0b

// Certains setups TypeScript (IDE / versions @types) ne fusionnent pas `children`
// avec `ThemeProviderProps` pour le JSX. On force un composant typé explicitement.
const ThemeProvider = NextThemesProvider as ComponentType<
  PropsWithChildren<ThemeProviderProps>
>;

export function Providers({ children }: { children: ReactNode }) {
  return (
<<<<<<< HEAD
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      {children}
    </ThemeProvider>
=======
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange={false}
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
>>>>>>> group-by-hour-98d0b
  );
}
