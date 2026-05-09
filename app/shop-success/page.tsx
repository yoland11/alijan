import { Suspense } from "react";

import { ShopOrderSuccessClient } from "@/components/shop/shop-order-success-client";

export const dynamic = "force-dynamic";

export default function ShopSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell">
          <div className="section-shell py-24 text-center text-ajn-muted">جاري التحميل...</div>
        </div>
      }
    >
      <ShopOrderSuccessClient />
    </Suspense>
  );
}
