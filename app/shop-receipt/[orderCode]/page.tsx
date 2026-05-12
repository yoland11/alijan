import { notFound } from "next/navigation";

import { ShopInvoiceActions } from "@/components/shop/shop-invoice-actions";
import { ShopInvoiceSheet } from "@/components/shop/shop-invoice-sheet";
import { getShopOrderByCode } from "@/lib/server/shop";

interface PageProps {
  params: Promise<{ orderCode: string }>;
}

export const dynamic = "force-dynamic";

export default async function ShopReceiptPage({ params }: PageProps) {
  const { orderCode } = await params;
  const order = await getShopOrderByCode(decodeURIComponent(orderCode));

  if (!order) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6 text-black print:min-h-0 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-4xl">
        <ShopInvoiceActions orderCode={order.order_code} customerPhone={order.phone} publicPath={`/shop-receipt/${encodeURIComponent(order.order_code)}`} />
        <ShopInvoiceSheet order={order} />
      </div>
    </div>
  );
}
