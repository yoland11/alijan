import { z } from "zod";

const optionalText = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value?.trim() ?? "");

const amountField = z
  .union([z.string(), z.number()])
  .transform((value) => {
    const raw = typeof value === "number" ? value : Number.parseFloat(String(value).replace(/[^\d.-]/g, ""));
    return Number.isFinite(raw) ? raw : 0;
  });

export const inventoryItemSchema = z.object({
  name: z.string().min(2, "اسم المادة مطلوب."),
  category: optionalText,
  unit: optionalText,
  quantity: amountField,
  min_quantity: amountField,
  purchase_price: amountField,
  sale_price: amountField,
  notes: optionalText,
  is_active: z.boolean().optional().default(true),
});

export const inventoryMovementSchema = z.object({
  item_id: z.string().min(1, "المادة مطلوبة."),
  movement_type: z.enum(["purchase", "sale", "adjustment", "booking_use", "restock"]),
  quantity: amountField,
  unit_cost: amountField.optional().default(0),
  note: optionalText,
});

export const cashTransactionSchema = z.object({
  entry_type: z.enum([
    "sale_invoice",
    "purchase_invoice",
    "receipt_voucher",
    "payment_voucher",
    "expense",
    "income",
  ]),
  amount: amountField,
  direction: z.enum(["in", "out"]),
  reference_code: optionalText,
  source: optionalText,
  customer_name: optionalText,
  customer_phone: optionalText,
  notes: optionalText,
  happened_at: optionalText,
});

export const employeeProfileSchema = z.object({
  name: z.string().min(2, "اسم الموظف مطلوب."),
  phone: optionalText,
  role: optionalText,
  permissions: z.array(z.string()).optional().default([]),
  monthly_salary: amountField.optional().default(0),
  notes: optionalText,
  is_active: z.boolean().optional().default(true),
});

export const employeeAttendanceSchema = z.object({
  employee_id: z.string().min(1, "الموظف مطلوب."),
  attendance_date: z.string().min(1, "تاريخ الحضور مطلوب."),
  check_in_time: optionalText,
  check_out_time: optionalText,
  status: z.enum(["حاضر", "متأخر", "إجازة", "غائب"]),
  notes: optionalText,
});

export const employeeTaskSchema = z.object({
  employee_id: z.string().min(1, "الموظف مطلوب."),
  title: z.string().min(2, "المهمة مطلوبة."),
  status: z.enum(["جديدة", "قيد التنفيذ", "مكتملة"]).optional().default("جديدة"),
  due_date: optionalText,
  notes: optionalText,
});

export const employeeTaskStatusSchema = z.object({
  task_id: z.string().min(1, "المهمة مطلوبة."),
  status: z.enum(["جديدة", "قيد التنفيذ", "مكتملة"]),
});
