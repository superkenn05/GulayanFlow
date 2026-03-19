import type {Metadata} from 'next';
import './globals.css';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/AppSidebar"
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase';
import { Separator } from '@/components/ui/separator';
import { AuthInitializer } from '@/components/AuthInitializer';

export const metadata: Metadata = {
  title: 'GulayanFlow | Gemma\'s Gulayan Inventory',
  description: 'Modern inventory management system for Gemma\'s Gulayan fruit and vegetable store.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <FirebaseClientProvider>
          <AuthInitializer>
            <LayoutContent>{children}</LayoutContent>
          </AuthInitializer>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset>
          <HeaderWrapper>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-6">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary font-headline tracking-tight">GulayanFlow</span>
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded font-bold text-muted-foreground hidden sm:inline-block uppercase tracking-wider">
                  Inventory Control
                </span>
              </div>
            </header>
          </HeaderWrapper>
          <main className="p-4 md:p-8 lg:p-12 min-h-screen">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

import { LayoutHeaderHider as HeaderWrapper } from '@/components/layout/LayoutHeaderHider';
