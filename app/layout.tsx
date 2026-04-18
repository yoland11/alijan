import type { Metadata } from "next";
import { Cairo, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "sonner";

import "@/app/globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AJN Booking & Order Tracking",
  description: "نظام AJN لإدارة الحجوزات وتتبع الطلبات بواجهة عربية فاخرة.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} ${cormorant.variable} font-sans text-white`}>
        {children}
        <Toaster
          richColors
          position="top-center"
          toastOptions={{
            style: {
              background: "rgba(11, 11, 11, 0.92)",
              border: "1px solid rgba(212, 175, 55, 0.16)",
              color: "#ffffff",
            },
          }}
        />
      </body>
    </html>
  );
}

