import { z } from "zod";

import {
  ALBUM_SESSION_TYPES,
  KOSHAT_TYPES,
  ORDER_STATUSES,
  PHOTOGRAPHER_OPTIONS,
  SERVICE_TYPES,
} from "@/lib/constants";
import { calculateRemainingAmount, normalizePhone, parseAmountValue } from "@/lib/utils";

const amountFieldSchema = z
  .union([z.string(), z.number()])
  .transform((value) => parseAmountValue(value))
  .refine((value) => value >= 0, "يرجى إدخال مبلغ صحيح.");

export const loginSchema = z.object({
  username: z.string().min(3, "اسم المستخدم مطلوب."),
  password: z.string().min(6, "كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل."),
});

const baseOrderFields = {
  name: z.string().min(2, "يرجى إدخال اسم العميل."),
  phone: z
    .string()
    .min(8, "يرجى إدخال رقم هاتف صحيح.")
    .transform((value) => normalizePhone(value))
    .refine((value) => value.length >= 8, "يرجى إدخال رقم هاتف صحيح."),
  service_type: z.enum(SERVICE_TYPES, {
    error: "يرجى اختيار نوع الخدمة.",
  }),
  photographer: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? ""),
  session_type: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? ""),
  koshat_type: z
    .string()
    .optional()
    .transform((value) => value?.trim() ?? ""),
  booking_date: z.string().min(1, "يرجى تحديد تاريخ الحجز."),
  notes: z.string().max(1500, "الملاحظات طويلة جدًا.").optional().default(""),
} satisfies Record<string, z.ZodTypeAny>;

function applyServiceSpecificRules(
  value: {
    service_type: (typeof SERVICE_TYPES)[number];
    photographer?: string;
    session_type?: string;
    koshat_type?: string;
  },
  context: z.RefinementCtx,
) {
  if (value.service_type === "Session") {
    if (!value.photographer) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["photographer"],
        message: "يرجى اختيار كادر التصوير.",
      });
    } else if (
      !PHOTOGRAPHER_OPTIONS.includes(
        value.photographer as (typeof PHOTOGRAPHER_OPTIONS)[number],
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["photographer"],
        message: "يرجى اختيار كادر تصوير صالح.",
      });
    }
  }

  if (value.service_type === "Album") {
    if (!value.photographer) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["photographer"],
        message: "يرجى اختيار اسم الكادر.",
      });
    } else if (
      !PHOTOGRAPHER_OPTIONS.includes(
        value.photographer as (typeof PHOTOGRAPHER_OPTIONS)[number],
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["photographer"],
        message: "يرجى اختيار اسم كادر صالح.",
      });
    }

    if (!value.session_type) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["session_type"],
        message: "يرجى اختيار نوع الجلسة.",
      });
    } else if (
      !ALBUM_SESSION_TYPES.includes(
        value.session_type as (typeof ALBUM_SESSION_TYPES)[number],
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["session_type"],
        message: "يرجى اختيار نوع جلسة صالح.",
      });
    }
  }

  if (value.service_type === "Koshat") {
    if (!value.koshat_type) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["koshat_type"],
        message: "يرجى اختيار نوع الكوشة.",
      });
    } else if (
      !KOSHAT_TYPES.includes(value.koshat_type as (typeof KOSHAT_TYPES)[number])
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["koshat_type"],
        message: "يرجى اختيار نوع كوشة صالح.",
      });
    }
  }
}

export const orderSchema = z
  .object({
    ...baseOrderFields,
    status: z.enum(ORDER_STATUSES, {
      error: "يرجى اختيار الحالة.",
    }),
    images: z.array(z.string().url()).optional().default([]),
    total_amount: amountFieldSchema,
    received_amount: amountFieldSchema,
  })
  .superRefine((value, context) => {
    if (value.received_amount > value.total_amount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["received_amount"],
        message: "المبلغ الواصل لا يمكن أن يكون أكبر من المبلغ الكلي.",
      });
    }

    applyServiceSpecificRules(value, context);
  })
  .transform((value) => ({
    ...value,
    photographer:
      value.service_type === "Session" || value.service_type === "Album"
        ? value.photographer
        : "",
    session_type: value.service_type === "Album" ? value.session_type : "",
    koshat_type: value.service_type === "Koshat" ? value.koshat_type : "",
    remaining_amount: calculateRemainingAmount(value.total_amount, value.received_amount),
  }));

export const customerBookingSchema = z
  .object(baseOrderFields)
  .superRefine((value, context) => {
    applyServiceSpecificRules(value, context);
  });

export const trackingQuerySchema = z.object({
  query: z.string().min(4, "أدخل كود الطلب أو آخر 4 أرقام من الهاتف."),
});

export type OrderSchema = z.infer<typeof orderSchema>;
export type CustomerBookingSchema = z.infer<typeof customerBookingSchema>;
