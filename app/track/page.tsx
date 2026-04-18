import { Suspense } from "react";

import { TrackingPageClient } from "@/components/tracking/tracking-page-client";

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell">
          <div className="section-shell py-24 text-center text-ajn-muted">جاري تحميل صفحة التتبع...</div>
        </div>
      }
    >
      <TrackingPageClient />
    </Suspense>
  );
}

