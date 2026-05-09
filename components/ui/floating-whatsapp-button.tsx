"use client";

import { motion } from "framer-motion";
import { MessageCircleMore } from "lucide-react";
import { usePathname } from "next/navigation";

import { buildFloatingWhatsAppUrl } from "@/lib/utils";

export function FloatingWhatsAppButton() {
  const pathname = usePathname();
  const whatsappUrl = buildFloatingWhatsAppUrl();

  if (!whatsappUrl || pathname.startsWith("/admin") || pathname.startsWith("/checkout")) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.16 }}
      className="no-print fixed left-4 bottom-[calc(env(safe-area-inset-bottom)+6.6rem)] z-40 md:bottom-6 md:left-6"
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="group inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#25D366]/35 bg-[#25D366]/14 text-[#c6f8da] shadow-[0_0_28px_rgba(37,211,102,0.18)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-[#25D366]/20"
      >
        <motion.span
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 3.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          className="inline-flex"
        >
          <MessageCircleMore className="h-6 w-6" />
        </motion.span>
      </a>
    </motion.div>
  );
}
