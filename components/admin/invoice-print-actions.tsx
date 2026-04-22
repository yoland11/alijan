"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

export function InvoicePrintActions({
  orderId,
  orderCode,
  autoPrint = false,
}: {
  orderId: string;
  orderCode: string;
  autoPrint?: boolean;
}) {
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!autoPrint) {
      return;
    }

    const timeout = window.setTimeout(() => {
      window.print();
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [autoPrint]);

  const downloadPdf = async () => {
    const invoiceNode = document.getElementById("invoice-document");

    if (!invoiceNode) {
      return;
    }

    setDownloading(true);

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(invoiceNode, {
        backgroundColor: "#060606",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imageData = canvas.toDataURL("image/png", 1);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const scale = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
      const renderWidth = canvas.width * scale;
      const renderHeight = canvas.height * scale;
      const xOffset = (pageWidth - renderWidth) / 2;
      const yOffset = (pageHeight - renderHeight) / 2;

      pdf.addImage(
        imageData,
        "PNG",
        Math.max(xOffset, 0),
        Math.max(yOffset, 0),
        renderWidth,
        renderHeight,
        undefined,
        "FAST",
      );
      pdf.save(`invoice-${orderCode}.pdf`);
    } catch (error) {
      console.error("PDF download failed", error);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <Link
        href="/admin"
        className="inline-flex h-12 items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
      >
        العودة إلى لوحة الإدارة
      </Link>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/admin/invoices/${orderId}`}
          className="inline-flex h-12 items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
        >
          عرض الفاتورة
        </Link>
        <Button onClick={downloadPdf} disabled={downloading}>
          <Download className="h-4 w-4" />
          {downloading ? "جاري تجهيز الملف..." : "تحميل PDF"}
        </Button>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          طباعة / حفظ PDF
        </Button>
      </div>
    </div>
  );
}
