

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';


export const metadata: Metadata = {
  title: 'Hábitat Next',
  description: 'Descubre las mejores opciones para tu nuevo hogar',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen font-body antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
