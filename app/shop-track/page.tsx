import { Suspense } from "react";

import { ShopTrackingPageClient } from "@/components/shop/shop-tracking-page-client";

export const dynamic = "force-dynamic";

export default function ShopTrackPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell">
          <div className="section-shell py-24 text-center text-ajn-muted">جاري التحميل...</div>
        </div>
      }
    >
      <ShopTrackingPageClient />
    </Suspense>
  );
}
