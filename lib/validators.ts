import { z } from "zod";

import { ORDER_STATUSES, SERVICE_TYPES } from "@/lib/constants";
import { normalizePhone } from "@/lib/utils";

export const loginSchema = z.object({
  username: z.string().min(3, "اسم المستخدم مطلوب."),
  password: z.string().min(6, "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل."),
});

export const orderSchema = z.object({
  name: z.string().min(2, "يرجى إدخال اسم العميل."),
  phone: z
    .string()
    .min(8, "يرجى إدخال رقم هاتف صحيح.")
    .transform((value) => normalizePhone(value))
    .refine((value) => value.length >= 8, "يرجى إدخال رقم هاتف صحيح."),
  service_type: z.enum(SERVICE_TYPES, {
    error: "يرجى اختيار نوع الخدمة.",
  }),
  booking_date: z.string().min(1, "يرجى تحديد تاريخ الحجز."),
  status: z.enum(ORDER_STATUSES, {
    error: "يرجى اختيار الحالة.",
  }),
  notes: z.string().max(1500, "الملاحظات طويلة جدًا.").optional().default(""),
  images: z.array(z.string().url()).optional().default([]),
});

export const trackingQuerySchema = z.object({
  query: z.string().min(4, "أدخل كود الطلب أو آخر 4 أرقام من الهاتف."),
});

export type OrderSchema = z.infer<typeof orderSchema>;
