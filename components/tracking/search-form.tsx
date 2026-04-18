"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TrackingSearchFormProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
  compact?: boolean;
}

export function TrackingSearchForm({
  query,
  onQueryChange,
  onSubmit,
  loading = false,
  compact = false,
}: TrackingSearchFormProps) {
  return (
    <form
      className={`surface-panel noise-overlay ${
        compact ? "p-4" : "p-6 sm:p-7"
      }`}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className={`grid gap-4 ${compact ? "md:grid-cols-[1fr_auto]" : "lg:grid-cols-[1fr_auto]"}`}>
        <div className="space-y-3">
          {!compact && (
            <div>
              <p className="mb-2 text-sm text-ajn-goldSoft">تتبع ذكي وسريع</p>
              <h3 className="text-2xl font-bold text-white">أدخل كود الطلب أو آخر 4 أرقام</h3>
            </div>
          )}
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="مثال: AJN-1234 أو 1234"
          />
          <p className="text-sm leading-7 text-ajn-muted">
            يمكنك البحث باستخدام الكود الكامل أو آخر 4 أرقام من رقم الهاتف المسجل.
          </p>
        </div>
        <div className="flex items-end">
          <Button type="submit" className="h-12 min-w-[150px] w-full md:w-auto" disabled={loading}>
            <Search className="h-4 w-4" />
            {loading ? "جاري البحث..." : "تتبع الآن"}
          </Button>
        </div>
      </div>
    </form>
  );
}

