// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Your global styles
import Providers from './providers'; // For next-auth SessionProvider
import Navbar from '@/components/Navbar'; // Import Navbar
import Footer from '@/components/Footer'; // Import Footer

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BloodLagbe - Blood Donation Platform', // Updated title
  description: 'Connecting blood donors and recipients to save lives.', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50`}> {/* Added flex classes for sticky footer */}
        <Providers>
          <Navbar />
          <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8"> {/* Added flex-grow for content area */}
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}