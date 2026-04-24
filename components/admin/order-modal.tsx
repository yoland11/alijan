"use client";

import { useEffect, useState } from "react";
import { ImagePlus, UploadCloud, X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PHOTOGRAPHER_OPTIONS, SERVICE_TYPE_LABELS, SERVICE_TYPES } from "@/lib/constants";
import type { OrderRecord } from "@/lib/types";
import {
  buildOrderCode,
  buildOrderImageProxyUrl,
  calculateRemainingAmount,
  formatAmountInputValue,
  formatAmountWithCurrency,
  getOrderStatusSteps,
  normalizeStatusForService,
} from "@/lib/utils";
import { orderSchema } from "@/lib/validators";
import type { z } from "zod";

type OrderFormInput = z.input<typeof orderSchema>;
type OrderValues = z.output<typeof orderSchema>;

interface OrderModalProps {
  open: boolean;
  order: OrderRecord | null;
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: OrderValues, files: File[]) => Promise<void>;
}

const defaultValues: OrderFormInput = {
  name: "",
  phone: "",
  service_type: "Album",
  photographer: "",
  booking_date: new Date().toISOString().split("T")[0],
  status: "تم الحجز",
  notes: "",
  images: [],
  total_amount: "0",
  received_amount: "0",
};

export function OrderModal({ open, order, busy, onClose, onSubmit }: OrderModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<OrderFormInput, undefined, OrderValues>({
    resolver: zodResolver(orderSchema),
    defaultValues,
  });

  const phone = useWatch({ control, name: "phone" });
  const serviceType = useWatch({ control, name: "service_type" }) ?? "Album";
  const photographer = useWatch({ control, name: "photographer" }) ?? "";
  const currentStatus = useWatch({ control, name: "status" }) ?? "تم الحجز";
  const images = useWatch({ control, name: "images" }) ?? [];
  const totalAmountInput = useWatch({ control, name: "total_amount" }) ?? "0";
  const receivedAmountInput = useWatch({ control, name: "received_amount" }) ?? "0";
  const remainingAmount = calculateRemainingAmount(totalAmountInput, receivedAmountInput);
  const availableStatuses = getOrderStatusSteps(serviceType);

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(
      order
        ? {
            name: order.name,
            phone: order.phone,
            service_type: order.service_type,
            photographer: order.photographer,
            booking_date: order.booking_date,
            status: normalizeStatusForService(order.status, order.service_type),
            notes: order.notes,
            images: order.images,
            total_amount: formatAmountInputValue(order.total_amount),
            received_amount: formatAmountInputValue(order.received_amount),
          }
        : defaultValues,
    );

    const timeout = window.setTimeout(() => {
      setFiles([]);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [open, order, reset]);

  useEffect(() => {
    if (serviceType !== "Session") {
      if (photographer) {
        setValue("photographer", "", { shouldDirty: true, shouldValidate: true });
      }

      return;
    }

    const normalizedStatus = normalizeStatusForService(currentStatus, serviceType);

    if (normalizedStatus !== currentStatus) {
      setValue("status", normalizedStatus, { shouldDirty: true, shouldValidate: true });
    }
  }, [currentStatus, photographer, serviceType, setValue]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-md">
      <div className="mx-auto max-w-4xl">
        <div className="surface-panel-strong relative p-6 sm:p-8">
          <button
            type="button"
            className="absolute left-5 top-5 rounded-full border border-ajn-line p-2 text-ajn-muted transition hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-8">
            <p className="mb-2 text-sm text-ajn-goldSoft">
              {order ? "تعديل الطلب الحالي" : "إضافة طلب جديد"}
            </p>
            <h2 className="text-3xl font-bold text-white">
              {order ? "تحديث بيانات الطلب" : "إنشاء طلب جديد"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-ajn-muted">
              يتم توليد الكود تلقائيًا بناءً على آخر 4 أرقام من الهاتف.
            </p>
          </div>

          <form
            className="space-y-6"
            onSubmit={handleSubmit(async (values) => {
              await onSubmit(values, files);
            })}
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">اسم العميل</label>
                <Input {...register("name")} placeholder="الاسم الكامل" />
                {errors.name ? <p className="mt-2 text-sm text-red-300">{errors.name.message}</p> : null}
              </div>

              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">رقم الهاتف</label>
                <Input {...register("phone")} placeholder="96477..." dir="ltr" />
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

              {serviceType === "Session" ? (
                <div>
                  <label className="mb-2 block text-sm text-ajn-goldSoft">كادر التصوير</label>
                  <Select {...register("photographer")}>
                    <option value="" className="bg-black">
                      اختر الكادر
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

              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">تاريخ الحجز</label>
                <Input type="date" {...register("booking_date")} />
              </div>

              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">الحالة</label>
                <Select {...register("status")}>
                  {availableStatuses.map((status) => (
                    <option key={status.value} value={status.value} className="bg-black">
                      {status.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-4">
                <p className="mb-2 text-sm text-ajn-goldSoft">معاينة الكود</p>
                <p className="text-2xl font-bold text-white">{buildOrderCode(phone || "0000")}</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">المبلغ الكلي</label>
                <Input
                  {...register("total_amount")}
                  placeholder="مثال: 120000"
                  inputMode="decimal"
                  dir="ltr"
                />
                {errors.total_amount ? (
                  <p className="mt-2 text-sm text-red-300">{errors.total_amount.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">المبلغ الواصل</label>
                <Input
                  {...register("received_amount")}
                  placeholder="مثال: 50000"
                  inputMode="decimal"
                  dir="ltr"
                />
                {errors.received_amount ? (
                  <p className="mt-2 text-sm text-red-300">{errors.received_amount.message}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">المبلغ المتبقي</label>
                <Input
                  value={formatAmountWithCurrency(remainingAmount)}
                  readOnly
                  className="border-ajn-gold/20 bg-ajn-gold/[0.08] text-ajn-gold focus:border-ajn-gold/20 focus:bg-ajn-gold/[0.08]"
                />
                <p className="mt-2 text-xs text-ajn-muted">يُحسب تلقائيًا من المبلغ الكلي والواصل.</p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-ajn-goldSoft">الملاحظات</label>
              <Textarea {...register("notes")} placeholder="ملاحظات داخلية أو تفاصيل إضافية للعميل..." />
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-3xl border border-dashed border-ajn-line bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-full bg-ajn-gold/15 p-3 text-ajn-gold">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">رفع صور الطلب</h3>
                    <p className="text-sm text-ajn-muted">يمكنك اختيار أكثر من صورة وسيتم رفعها عند الحفظ.</p>
                  </div>
                </div>

                <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-[26px] border border-ajn-line bg-black/20 p-6 text-center transition hover:border-ajn-gold/40">
                  <ImagePlus className="mb-3 h-7 w-7 text-ajn-gold" />
                  <span className="text-sm text-white">اختر الصور أو اسحبها هنا</span>
                  <span className="mt-2 text-xs text-ajn-muted">JPEG / PNG / WEBP</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const selectedFiles = Array.from(event.target.files ?? []);
                      setFiles(selectedFiles);
                    }}
                  />
                </label>

                {files.length ? (
                  <div className="mt-4 space-y-2">
                    {files.map((file) => (
                      <div
                        key={`${file.name}-${file.size}`}
                        className="rounded-2xl border border-ajn-line bg-white/[0.03] px-4 py-3 text-sm text-ajn-ivory"
                      >
                        {file.name}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">الصور الحالية</h3>
                  <span className="text-sm text-ajn-muted">{images.length} صورة</span>
                </div>

                {images.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {images.map((imageUrl) => (
                      <div key={imageUrl} className="overflow-hidden rounded-2xl border border-ajn-line">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={buildOrderImageProxyUrl(imageUrl)}
                          alt="order media"
                          className="h-28 w-full object-cover"
                        />
                        <button
                          type="button"
                          className="w-full border-t border-ajn-line bg-black/40 px-3 py-2 text-xs text-red-200 transition hover:bg-red-500/12"
                          onClick={() => setValue("images", images.filter((item) => item !== imageUrl))}
                        >
                          إزالة
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-ajn-line bg-black/20 p-6 text-center text-sm text-ajn-muted">
                    لا توجد صور مرفوعة لهذا الطلب بعد.
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button variant="ghost" onClick={onClose}>
                إلغاء
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "جاري الحفظ..." : order ? "حفظ التعديلات" : "إنشاء الطلب"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
