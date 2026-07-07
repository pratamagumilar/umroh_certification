import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sertifikasi Umroh",
  description: "Portal Sertifikasi Umroh",
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <Toaster 
            position="top-center"
            toastOptions={{
              style: {
                borderRadius: '12px',
                background: '#ffffff',
                color: '#0f172a',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                border: '1px solid #f1f5f9'
              },
              success: {
                iconTheme: {
                  primary: '#059669',
                  secondary: '#ffffff',
                },
              },
            }}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}
