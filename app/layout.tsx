import type { Metadata } from "next";
import { Alexandria, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "sonner";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { ShopCartProvider } from "@/components/shop/cart-provider";
import { AppExperience } from "@/components/ui/app-experience";

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-alexandria",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AJN Booking & Order Tracking",
  description: "إدارة الحجوزات وتتبع الطلبات.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${alexandria.variable} ${cormorant.variable} font-sans text-white`}>
        <ShopCartProvider>
          <AppExperience>{children}</AppExperience>
        </ShopCartProvider>
        <Toaster
          richColors
          position="top-center"
          expand
          visibleToasts={4}
          duration={2600}
          toastOptions={{
            className: "ajn-toast",
            style: {
              background: "rgba(8, 8, 8, 0.72)",
              backdropFilter: "blur(18px)",
              border: "1px solid rgba(212, 175, 55, 0.22)",
              color: "#ffffff",
              boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
              borderRadius: "20px",
            },
          }}
        />
      </body>
    </html>
  );
}
