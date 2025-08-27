import AppSidebarServer from "@/components/AppSidebarServer";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/providers";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rc Fluid Power",
  description: "Job Time Tracker",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const u = await checkUser().catch(() => null);

  // const user = {
  //   name: u?.name ?? null,
  //   email: u?.email ?? null,
  //   clerkId: u?.id, // assuming u is coming from Clerk
  // };

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased bg-background text-foreground">
          <Providers>
            <SidebarProvider>
              <AppSidebarServer />
              <main className="flex-1">{children}</main>
            </SidebarProvider>
            <Toaster position="top-right" />
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
