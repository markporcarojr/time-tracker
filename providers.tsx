// app/providers.tsx
"use client";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark" // <- default dark
      enableSystem={false} // <- ignore OS, stay dark unless user changes
    >
      {children}
    </ThemeProvider>
  );
}
