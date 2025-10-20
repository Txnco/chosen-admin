import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'CHOSEN Admin Panel',
  description: 'Admin dashboard for CHOSEN fitness application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-avenir antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster 
          position="top-right" 
          richColors 
          expand={false}
          closeButton
          duration={4000}
        />
      </body>
    </html>
  );
}