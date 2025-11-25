import AppSidebarServer from "@/components/AppSidebarServer";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"; // Import SidebarInset
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/providers";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata: Metadata = {
  title: "Rc Fluid Power",
  description: "Job Time Tracker",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased bg-background text-foreground">
          {/* ThemeProvider moved up so Sidebar gets themed too */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Providers>
              <SidebarProvider>
                <AppSidebarServer />
                
                {/* SidebarInset creates the column next to the sidebar */}
                <SidebarInset>
                  <SiteHeader />
                  <main className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    {children}
                  </main>
                </SidebarInset>

              </SidebarProvider>
              <Toaster position="top-right" />
            </Providers>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}