
import React from 'react';
import { Sidebar } from './Sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            <SidebarTrigger className="mb-4 lg:hidden" />
            {children}
          </div>
        </main>
        <Toaster />
        <Sonner />
      </div>
    </SidebarProvider>
  );
}

export default Layout;
