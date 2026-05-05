"use client";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BaseTrackingSearchFormProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export function TrackingSearchForm(props: BaseTrackingSearchFormProps) {
  return (
    <TrackingSearchFormLayout
      {...props}
      compact={false}
      formClassName="surface-panel noise-overlay p-5 sm:p-7"
      gridClassName="grid gap-4 lg:grid-cols-[1fr_auto]"
      buttonClassName="h-12 w-full lg:min-w-[150px] lg:w-auto"
    />
  );
}

export function CompactTrackingSearchForm(props: BaseTrackingSearchFormProps) {
  return (
    <TrackingSearchFormLayout
      {...props}
      compact={true}
      formClassName="surface-panel noise-overlay p-4 sm:p-5"
      gridClassName="grid gap-4 md:grid-cols-[1fr_auto]"
      buttonClassName="h-12 w-full md:min-w-[150px] md:w-auto"
    />
  );
}

function TrackingSearchFormLayout({
  query,
  onQueryChange,
  onSubmit,
  loading = false,
  compact,
  formClassName,
  gridClassName,
  buttonClassName,
}: BaseTrackingSearchFormProps & {
  compact: boolean;
  formClassName: string;
  gridClassName: string;
  buttonClassName: string;
}) {
  return (
    <form
      suppressHydrationWarning
      className={formClassName}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className={gridClassName}>
        <div className="space-y-3">
          {!compact ? (
            <div>
              <p className="mb-2 text-sm text-ajn-goldSoft">تتبع ذكي وسريع</p>
              <h3 className="text-xl font-bold text-white sm:text-2xl">
                أدخل كود الطلب أو آخر 4 أرقام
              </h3>
            </div>
          ) : null}

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
          <Button type="submit" className={buttonClassName} disabled={loading}>
            <Search className="h-4 w-4" />
            {loading ? "جاري البحث..." : "تتبع الآن"}
          </Button>
        </div>
      </div>
    </form>
  );
}