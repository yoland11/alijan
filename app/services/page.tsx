import { Suspense } from "react";

import { ServicesPageClient } from "@/components/shop/services-page-client";

export const dynamic = "force-dynamic";

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell">
          <div className="section-shell py-24 text-center text-ajn-muted">جاري التحميل...</div>
        </div>
      }
    >
      <ServicesPageClient />
    </Suspense>
  );
}
