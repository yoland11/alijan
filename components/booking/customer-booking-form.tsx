"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ClipboardPlus, Search } from "lucide-react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ALBUM_SESSION_TYPES,
  KOSHAT_TYPES,
  PHOTOGRAPHER_OPTIONS,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPES,
} from "@/lib/constants";
import {
  buildOrderCode,
  buildOrderTrackingLink,
  cn,
  getStaffFieldLabel,
  normalizePhone,
  supportsAlbumSessionType,
  supportsKoshatType,
  supportsStaffField,
} from "@/lib/utils";
import { customerBookingSchema } from "@/lib/validators";

type CustomerBookingInput = z.input<typeof customerBookingSchema>;
type CustomerBookingValues = z.output<typeof customerBookingSchema>;

const defaultValues: CustomerBookingInput = {
  name: "",
  phone: "",
  service_type: "Album",
  photographer: "",
  session_type: "",
  koshat_type: "",
  booking_date: new Date().toISOString().split("T")[0],
  notes: "",
};

export function CustomerBookingForm() {
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CustomerBookingInput, undefined, CustomerBookingValues>({
    resolver: zodResolver(customerBookingSchema),
    defaultValues,
  });

  const phone = useWatch({ control, name: "phone" }) ?? "";
  const serviceType = useWatch({ control, name: "service_type" }) ?? "Album";
  const photographer = useWatch({ control, name: "photographer" }) ?? "";
  const sessionType = useWatch({ control, name: "session_type" }) ?? "";
  const koshatType = useWatch({ control, name: "koshat_type" }) ?? "";
  const phoneField = register("phone");
  const sessionTypeField = register("session_type");
  const koshatTypeField = register("koshat_type");

  const shouldShowStaffField = supportsStaffField(serviceType);
  const shouldShowAlbumSessionType = supportsAlbumSessionType(serviceType);
  const shouldShowKoshatType = supportsKoshatType(serviceType);
  const staffFieldLabel = getStaffFieldLabel(serviceType);
  const previewOrderCode = useMemo(() => buildOrderCode(phone || "0000"), [phone]);

  const submitForm = handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as {
        message?: string;
        order?: { order_code?: string };
      };

      if (!response.ok) {
        throw new Error(payload.message || "تعذر إرسال الحجز.");
      }

      const orderCode = payload.order?.order_code ?? previewOrderCode;
      setCreatedOrderCode(orderCode);
      toast.success("تم إرسال طلبك بنجاح.");
      reset({
        ...defaultValues,
        booking_date: defaultValues.booking_date,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذر إرسال الحجز.");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <section className="surface-panel-strong noise-overlay p-5 sm:p-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 text-sm text-ajn-goldSoft">حجز جديد للزبون</p>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">إنشاء طلب جديد</h1>
          <p className="mt-3 max-w-2xl text-sm leading-8 text-ajn-muted">
            املأ بيانات الخدمة وسيتم إرسالها مباشرة إلى الإدارة مع توليد كود تتبع تلقائي لطلبك.
          </p>
        </div>

        <div className="rounded-[24px] border border-ajn-line bg-white/[0.03] px-4 py-3">
          <p className="text-xs text-ajn-goldSoft">كود تتبع تقريبي</p>
          <p className="mt-1 text-xl font-bold text-white">{previewOrderCode}</p>
        </div>
      </div>

      {createdOrderCode ? (
        <div className="mb-6 rounded-[26px] border border-emerald-400/25 bg-emerald-500/10 p-5">
          <div className="mb-3 flex items-center gap-3 text-emerald-200">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-semibold">تم إرسال الحجز بنجاح</p>
          </div>
          <p className="text-sm leading-8 text-white/90">
            كود التتبع الخاص بك هو <span className="font-bold text-white">{createdOrderCode}</span>
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/track?code=${encodeURIComponent(createdOrderCode)}`}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-ajn-gold px-5 text-sm font-semibold text-black transition hover:bg-ajn-goldSoft"
            >
              <Search className="h-4 w-4" />
              تتبع الطلب الآن
            </Link>
            <a
              href={buildOrderTrackingLink(createdOrderCode)}
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
            >
              نسخ رابط التتبع
            </a>
          </div>
        </div>
      ) : null}

      <form className="space-y-6" onSubmit={submitForm}>
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-ajn-goldSoft">اسم العميل</label>
            <Input {...register("name")} placeholder="الاسم الكامل" />
            {errors.name ? <p className="mt-2 text-sm text-red-300">{errors.name.message}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm text-ajn-goldSoft">رقم الهاتف</label>
            <Input
              {...phoneField}
              placeholder="96477..."
              dir="ltr"
              inputMode="numeric"
              pattern="[0-9]*"
              onChange={(event) => {
                event.target.value = normalizePhone(event.target.value);
                phoneField.onChange(event);
              }}
            />
            {errors.phone ? <p className="mt-2 text-sm text-red-300">{errors.phone.message}</p> : null}
          </div>

          <div>
            <label className="mb-2 block text-sm text-ajn-goldSoft">نوع الخدمة</label>
            <Select {...register("service_type")}>
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type} className="bg-black">
                  {SERVICE_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-ajn-goldSoft">تاريخ الحجز</label>
            <Input type="date" {...register("booking_date")} />
            {errors.booking_date ? (
              <p className="mt-2 text-sm text-red-300">{errors.booking_date.message}</p>
            ) : null}
          </div>

          {shouldShowStaffField ? (
            <div>
              <label className="mb-2 block text-sm text-ajn-goldSoft">{staffFieldLabel}</label>
              <Select {...register("photographer")}>
                <option value="" className="bg-black">
                  {serviceType === "Album" ? "اختر اسم الكادر" : "اختر الكادر"}
                </option>
                {PHOTOGRAPHER_OPTIONS.map((member) => (
                  <option key={member} value={member} className="bg-black">
                    {member}
                  </option>
                ))}
              </Select>
              {errors.photographer ? (
                <p className="mt-2 text-sm text-red-300">{errors.photographer.message}</p>
              ) : null}
            </div>
          ) : null}

          {shouldShowAlbumSessionType ? (
            <div>
              <label className="mb-2 block text-sm text-ajn-goldSoft">نوع الجلسة</label>
              <input type="hidden" {...sessionTypeField} value={sessionType} />
              <ChoiceButtonGroup
                options={ALBUM_SESSION_TYPES.map((type) => ({
                  value: type,
                  title: type,
                  description:
                    type === "داخلي"
                      ? "جلسة داخل الاستوديو أو موقع داخلي مجهز"
                      : "جلسة خارجية في موقع مفتوح أو خارجي",
                }))}
                value={sessionType}
                onChange={(value) =>
                  setValue("session_type", value, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                }
              />
              {errors.session_type ? (
                <p className="mt-2 text-sm text-red-300">{errors.session_type.message}</p>
              ) : null}
            </div>
          ) : null}

          {shouldShowKoshatType ? (
            <div>
              <label className="mb-2 block text-sm text-ajn-goldSoft">نوع الكوشة</label>
              <input type="hidden" {...koshatTypeField} value={koshatType} />
              <ChoiceButtonGroup
                options={KOSHAT_TYPES.map((type) => ({
                  value: type,
                  title: type,
                  description:
                    type === "اعتيادي"
                      ? "تنفيذ أنيق ومرتب بطابع كلاسيكي هادئ"
                      : "تنفيذ فاخر بتفاصيل ملكية ولمسات VIP",
                }))}
                value={koshatType}
                onChange={(value) =>
                  setValue("koshat_type", value, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                }
              />
              {errors.koshat_type ? (
                <p className="mt-2 text-sm text-red-300">{errors.koshat_type.message}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm text-ajn-goldSoft">تفاصيل إضافية</label>
          <Textarea
            {...register("notes")}
            placeholder="اكتب ملاحظاتك أو تفاصيل طلبك التي تريد إيصالها للإدارة..."
          />
          {errors.notes ? <p className="mt-2 text-sm text-red-300">{errors.notes.message}</p> : null}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-2xl border border-ajn-line bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
          >
            العودة للرئيسية
          </Link>
          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            <ClipboardPlus className="h-4 w-4" />
            {submitting ? "جاري إرسال الطلب..." : "إرسال الحجز"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function ChoiceButtonGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; title: string; description: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "group rounded-[24px] border px-4 py-4 text-right transition duration-300",
              "hover:-translate-y-0.5 hover:border-ajn-gold/45 hover:bg-white/[0.06]",
              "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ajn-gold/20",
              selected
                ? "border-ajn-gold bg-ajn-gold/[0.12] shadow-[0_12px_30px_rgba(212,175,55,0.14)]"
                : "border-ajn-line bg-white/[0.03]",
            )}
            onClick={() => onChange(option.value)}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p
                  className={cn(
                    "text-base font-semibold transition",
                    selected ? "text-ajn-gold" : "text-white",
                  )}
                >
                  {option.title}
                </p>
                <p className="mt-1 text-xs text-ajn-muted">{option.description}</p>
              </div>
              <span
                className={cn(
                  "h-4 w-4 rounded-full border transition",
                  selected
                    ? "border-ajn-gold bg-ajn-gold shadow-[0_0_0_4px_rgba(212,175,55,0.15)]"
                    : "border-white/20 bg-white/[0.04] group-hover:border-ajn-gold/45",
                )}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
