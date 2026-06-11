import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';

// Inisialisasi Font Premium Batik Nareswara
const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display'
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans'
});

// Setup Meta Data & Optimasi SEO / Social Media Sharing
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: "Batik Nareswara | Koleksi Premium & Elegan",
  description: "Eksplorasi mahakarya batik Indonesia modern dan klasik dengan kualitas terbaik. Order instan langsung terhubung ke WhatsApp.",
  keywords: ["batik premium", "batik modern", "kain batik", "batik nareswara"],
  authors: [{ name: "Nareswara" }],
  icons: {
    icon: '/BatikNareswara Profile.jpg'
  },
  openGraph: {
    title: "Batik Nareswara | Eksklusif Batik Indonesia",
    description: "Temukan koleksi batik tulis dan cap premium dengan kualitas terbaik. Siap kirim ke seluruh Indonesia.",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://domain-batik-lu-nanti.com',
    siteName: "Batik Nareswara",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Koleksi Premium Batik Nareswara",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
};

// 🔥 MANTRA 1: Paksa Next.js agar tidak me-render ini secara statis
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
  modal
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${plusJakartaSans.variable}`}>
      <body className={`${plusJakartaSans.className} antialiased bg-[#FDFBF9]`}>

        <Suspense fallback={<div className="min-h-screen bg-[#FDFBF9]" />}>
          {/* 🔥 MANTRA 2: Tambahkan prop 'dynamic' agar Clerk tahu ini halaman dinamis */}
          <ClerkProvider dynamic>

            {/* Main Content */}
            {children}

            {/* Modal (Intercepted Routes) */}
            {modal}

          </ClerkProvider>
        </Suspense>

      </body>
    </html>
  );
}