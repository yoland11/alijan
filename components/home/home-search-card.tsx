"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { TrackingSearchForm } from "@/components/tracking/search-form";
import { normalizeTrackingQuery } from "@/lib/utils";

export function HomeSearchCard() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <TrackingSearchForm
      compact
      query={query}
      onQueryChange={setQuery}
      onSubmit={() => {
        const normalized = normalizeTrackingQuery(query);

        if (!normalized) {
          toast.error("أدخل كود الطلب أو آخر 4 أرقام من الهاتف.");
          return;
        }

        router.push(`/track?q=${encodeURIComponent(query)}`);
      }}
    />
  );
}
