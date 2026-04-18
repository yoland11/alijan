"use client";

import { useEffect, useState } from "react";
import { ImagePlus, UploadCloud, X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ORDER_STATUSES, SERVICE_TYPE_LABELS, SERVICE_TYPES } from "@/lib/constants";
import type { OrderRecord } from "@/lib/types";
import { buildOrderCode } from "@/lib/utils";
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
  booking_date: new Date().toISOString().split("T")[0],
  status: "تم الحجز",
  notes: "",
  portal_message: "",
  delivery_details: "",
  estimated_delivery_date: "",
  images: [],
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
  const images = useWatch({ control, name: "images" }) ?? [];

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
            booking_date: order.booking_date,
            status: order.status,
            notes: order.notes,
            portal_message: order.portal_message,
            delivery_details: order.delivery_details,
            estimated_delivery_date: order.estimated_delivery_date ?? "",
            images: order.images,
          }
        : defaultValues,
    );

    const timeout = window.setTimeout(() => {
      setFiles([]);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [open, order, reset]);

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

              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">تاريخ الحجز</label>
                <Input type="date" {...register("booking_date")} />
              </div>

              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">الحالة</label>
                <Select {...register("status")}>
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status} className="bg-black">
                      {status}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="rounded-3xl border border-ajn-line bg-white/[0.03] p-4">
                <p className="mb-2 text-sm text-ajn-goldSoft">معاينة الكود</p>
                <p className="text-2xl font-bold text-white">{buildOrderCode(phone || "0000")}</p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-ajn-goldSoft">الملاحظات</label>
              <Textarea {...register("notes")} placeholder="ملاحظات داخلية أو تفاصيل إضافية للعميل..." />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-ajn-goldSoft">رسالة بوابة العميل</label>
                <Textarea
                  {...register("portal_message")}
                  placeholder="رسالة ظاهرة للعميل داخل صفحة التتبع، مثل آخر مستجدات الطلب أو التعليمات الحالية."
                />
              </div>

              <div className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm text-ajn-goldSoft">تعليمات التسليم أو الاستلام</label>
                  <Textarea
                    {...register("delivery_details")}
                    placeholder="مثال: التسليم من الفرع الرئيسي بعد التواصل، أو إرسال النسخة الرقمية أولًا."
                    className="min-h-[120px]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-ajn-goldSoft">موعد التسليم المتوقع</label>
                  <Input type="date" {...register("estimated_delivery_date")} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-ajn-line bg-ajn-gold/8 p-4 text-sm leading-7 text-ajn-ivory">
              سيتم إرسال إشعار واتساب تلقائيًا للعميل عند إنشاء الطلب أو عند تغيير حالته إذا كان تكامل واتساب
              مفعّلًا في إعدادات البيئة.
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
                        <img src={imageUrl} alt="order media" className="h-28 w-full object-cover" />
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
