import { z } from "zod";

import {
  ALBUM_SESSION_TYPES,
  GRADUATION_PACKAGE_TYPES,
  GRADUATION_ROBE_TYPES,
  GRADUATION_SASH_TYPES,
  GRADUATION_WRITING_TYPES,
  KOSHAT_TYPES,
  ORDER_STATUSES,
  PHOTOGRAPHER_OPTIONS,
  RESEARCH_BINDING_TYPES,
  SERVICE_TYPES,
} from "@/lib/constants";
import {
  calculateRemainingAmount,
  createEmptyGraduationDetails,
  createEmptyResearchDetails,
  normalizeArabicDigits,
  normalizePhone,
  parseAmountValue,
} from "@/lib/utils";

const amountFieldSchema = z
  .union([z.string(), z.number()])
  .transform((value) => parseAmountValue(value))
  .refine((value) => value >= 0, "يرجى إدخال مبلغ صحيح.");

const copyCountFieldSchema = z
  .union([z.string(), z.number(), z.undefined(), z.null()])
  .transform((value) => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? Math.max(0, Math.min(6, Math.trunc(value))) : 0;
    }

    if (typeof value === "string") {
      const parsed = Number.parseInt(normalizeArabicDigits(value).replace(/[^\d-]/g, ""), 10);
      return Number.isFinite(parsed) ? Math.max(0, Math.min(6, parsed)) : 0;
    }

    return 0;
  });

const textFieldSchema = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? "");

const researchFileSchema = z.object({
  name: z.string().min(1, "اسم الملف مطلوب."),
  url: z.string().url("رابط الملف غير صالح."),
});

const researchDetailsSchema = z.object({
  title: textFieldSchema,
  student_names: textFieldSchema,
  supervisor_name: textFieldSchema,
  academic_entity: textFieldSchema,
  delivery_date: textFieldSchema,
  print_enabled: z.boolean().optional().default(false),
  copy_count: copyCountFieldSchema,
  binding_type: textFieldSchema,
});

const graduationDetailsSchema = z.object({
  package_type: textFieldSchema,
  sash_type: textFieldSchema,
  robe_type: textFieldSchema,
  writing_type: textFieldSchema,
  measurements: z.object({
    sash_length: textFieldSchema,
    shoulder: textFieldSchema,
    robe_length: textFieldSchema,
    hand: textFieldSchema,
  }),
  has_cap: z.boolean().optional().default(false),
});

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
  photographer: textFieldSchema,
  session_type: textFieldSchema,
  koshat_type: textFieldSchema,
  research_details: researchDetailsSchema.optional().default(createEmptyResearchDetails()),
  research_files: z.array(researchFileSchema).optional().default([]),
  graduation_details: graduationDetailsSchema.optional().default(createEmptyGraduationDetails()),
  booking_date: z.string().min(1, "يرجى تحديد تاريخ الحجز."),
  notes: z.string().max(1500, "الملاحظات طويلة جدًا.").optional().default(""),
} satisfies Record<string, z.ZodTypeAny>;

function requireResearchTextField(
  value: string,
  path: (string | number)[],
  message: string,
  context: z.RefinementCtx,
) {
  if (!value) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path,
      message,
    });
  }
}

function applyServiceSpecificRules(
  value: {
    service_type: (typeof SERVICE_TYPES)[number];
    photographer?: string;
    session_type?: string;
    koshat_type?: string;
    research_details: z.infer<typeof researchDetailsSchema>;
    research_files: z.infer<typeof researchFileSchema>[];
    graduation_details: z.infer<typeof graduationDetailsSchema>;
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

  if (value.service_type === "Research") {
    requireResearchTextField(
      value.research_details.title,
      ["research_details", "title"],
      "يرجى إدخال عنوان البحث.",
      context,
    );
    requireResearchTextField(
      value.research_details.student_names,
      ["research_details", "student_names"],
      "يرجى إدخال أسماء الطلبة.",
      context,
    );
    requireResearchTextField(
      value.research_details.supervisor_name,
      ["research_details", "supervisor_name"],
      "يرجى إدخال اسم المشرف.",
      context,
    );
    requireResearchTextField(
      value.research_details.academic_entity,
      ["research_details", "academic_entity"],
      "يرجى إدخال الجامعة - الكلية - القسم.",
      context,
    );
    requireResearchTextField(
      value.research_details.delivery_date,
      ["research_details", "delivery_date"],
      "يرجى تحديد تاريخ التسليم.",
      context,
    );

    if (!value.research_details.binding_type) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["research_details", "binding_type"],
        message: "يرجى اختيار نوع التجليد.",
      });
    } else if (
      !RESEARCH_BINDING_TYPES.includes(
        value.research_details.binding_type as (typeof RESEARCH_BINDING_TYPES)[number],
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["research_details", "binding_type"],
        message: "يرجى اختيار نوع تجليد صالح.",
      });
    }

    if (value.research_details.print_enabled) {
      if (value.research_details.copy_count < 1 || value.research_details.copy_count > 6) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["research_details", "copy_count"],
          message: "يرجى اختيار عدد نسخ من 1 إلى 6.",
        });
      }
    }
  }

  if (value.service_type === "Graduation") {
    if (!value.graduation_details.package_type) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["graduation_details", "package_type"],
        message: "يرجى اختيار نوع التجهيز.",
      });
    } else if (
      !GRADUATION_PACKAGE_TYPES.includes(
        value.graduation_details.package_type as (typeof GRADUATION_PACKAGE_TYPES)[number],
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["graduation_details", "package_type"],
        message: "يرجى اختيار نوع تجهيز صالح.",
      });
    }

    if (!value.graduation_details.sash_type) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["graduation_details", "sash_type"],
        message: "يرجى اختيار نوع الوشاح.",
      });
    } else if (
      !GRADUATION_SASH_TYPES.includes(
        value.graduation_details.sash_type as (typeof GRADUATION_SASH_TYPES)[number],
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["graduation_details", "sash_type"],
        message: "يرجى اختيار نوع وشاح صالح.",
      });
    }

    if (!value.graduation_details.robe_type) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["graduation_details", "robe_type"],
        message: "يرجى اختيار نوع الروب.",
      });
    } else if (
      !GRADUATION_ROBE_TYPES.includes(
        value.graduation_details.robe_type as (typeof GRADUATION_ROBE_TYPES)[number],
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["graduation_details", "robe_type"],
        message: "يرجى اختيار نوع روب صالح.",
      });
    }

    if (!value.graduation_details.writing_type) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["graduation_details", "writing_type"],
        message: "يرجى اختيار نوع الكتابة.",
      });
    } else if (
      !GRADUATION_WRITING_TYPES.includes(
        value.graduation_details.writing_type as (typeof GRADUATION_WRITING_TYPES)[number],
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["graduation_details", "writing_type"],
        message: "يرجى اختيار نوع كتابة صالح.",
      });
    }

    requireResearchTextField(
      value.graduation_details.measurements.sash_length,
      ["graduation_details", "measurements", "sash_length"],
      "يرجى إدخال طول الوشاح.",
      context,
    );
    requireResearchTextField(
      value.graduation_details.measurements.shoulder,
      ["graduation_details", "measurements", "shoulder"],
      "يرجى إدخال قياس الكتف.",
      context,
    );
    requireResearchTextField(
      value.graduation_details.measurements.robe_length,
      ["graduation_details", "measurements", "robe_length"],
      "يرجى إدخال طول الروب.",
      context,
    );
    requireResearchTextField(
      value.graduation_details.measurements.hand,
      ["graduation_details", "measurements", "hand"],
      "يرجى إدخال قياس اليد.",
      context,
    );
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
    research_details:
      value.service_type === "Research"
        ? {
            ...value.research_details,
            copy_count: value.research_details.print_enabled ? value.research_details.copy_count : 0,
            binding_type:
              value.research_details.binding_type &&
              RESEARCH_BINDING_TYPES.includes(
                value.research_details.binding_type as (typeof RESEARCH_BINDING_TYPES)[number],
              )
                ? value.research_details.binding_type
                : "",
          }
        : createEmptyResearchDetails(),
    research_files: value.service_type === "Research" ? value.research_files : [],
    graduation_details:
      value.service_type === "Graduation"
        ? {
            ...value.graduation_details,
          }
        : createEmptyGraduationDetails(),
    remaining_amount: calculateRemainingAmount(value.total_amount, value.received_amount),
  }));

export const customerBookingSchema = z
  .object(baseOrderFields)
  .superRefine((value, context) => {
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
    research_details:
      value.service_type === "Research"
        ? {
            ...value.research_details,
            copy_count: value.research_details.print_enabled ? value.research_details.copy_count : 0,
            binding_type:
              value.research_details.binding_type &&
              RESEARCH_BINDING_TYPES.includes(
                value.research_details.binding_type as (typeof RESEARCH_BINDING_TYPES)[number],
              )
                ? value.research_details.binding_type
                : "",
          }
        : createEmptyResearchDetails(),
    research_files: value.service_type === "Research" ? value.research_files : [],
    graduation_details:
      value.service_type === "Graduation"
        ? {
            ...value.graduation_details,
          }
        : createEmptyGraduationDetails(),
  }));

export const trackingQuerySchema = z.object({
  query: z.string().min(4, "أدخل كود الطلب أو آخر 4 أرقام من الهاتف."),
});

export type OrderSchema = z.infer<typeof orderSchema>;
export type CustomerBookingSchema = z.infer<typeof customerBookingSchema>;
