"use client";

import { useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Download, MessageCircleMore, Printer, Share2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ShopInvoiceActions({
  orderCode,
  customerPhone,
  publicPath,
}: {
  orderCode: string;
  customerPhone?: string;
  publicPath: string;
}) {
  const searchParams = useSearchParams();
  const autoPrintedRef = useRef(false);

  useEffect(() => {
    if (searchParams.get("print") !== "1" || autoPrintedRef.current) {
      return;
    }

    autoPrintedRef.current = true;
    const timer = window.setTimeout(() => {
      window.print();
    }, 380);

    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const downloadPdf = async () => {
    const target = document.getElementById("shop-invoice-sheet");

    if (!target) {
      toast.error("تعذر إنشاء PDF.");
      return;
    }

    try {
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = 210;
      const pageHeight = 297;
      const imageWidth = pageWidth;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;

      pdf.addImage(imageData, "PNG", 0, 0, imageWidth, Math.min(pageHeight, imageHeight));
      pdf.save(`${orderCode}.pdf`);
      toast.success("تم تحميل PDF.");
    } catch {
      toast.error("تعذر تحميل PDF.");
    }
  };

  const shareInvoice = async () => {
    const shareUrl = typeof window !== "undefined" ? new URL(publicPath, window.location.origin).toString() : publicPath;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `فاتورة ${orderCode}`,
          text: `فاتورة الطلب ${orderCode}`,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      toast.success("تم نسخ رابط الفاتورة.");
    } catch {
      toast.error("تعذر مشاركة الفاتورة.");
    }
  };

  const sendWhatsApp = () => {
    const digits = (customerPhone ?? "").replace(/\D/g, "");
    const shareUrl = typeof window !== "undefined" ? new URL(publicPath, window.location.origin).toString() : publicPath;

    if (!digits) {
      toast.error("رقم الهاتف غير صالح.");
      return;
    }

    window.open(
      `https://wa.me/${digits}?text=${encodeURIComponent(`فاتورتك جاهزة: ${shareUrl}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="no-print mb-5 flex flex-wrap justify-end gap-3">
      <Button variant="secondary" className="h-11 px-5" onClick={downloadPdf}>
        <Download className="h-4 w-4" />
        تحميل PDF
      </Button>
      <Button variant="secondary" className="h-11 px-5" onClick={shareInvoice}>
        <Share2 className="h-4 w-4" />
        مشاركة
      </Button>
      {customerPhone ? (
        <Button variant="secondary" className="h-11 px-5" onClick={sendWhatsApp}>
          <MessageCircleMore className="h-4 w-4" />
          إرسال واتساب
        </Button>
      ) : null}
      <Button className="h-11 px-5" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        طباعة الفاتورة
      </Button>
    </div>
  );
}
