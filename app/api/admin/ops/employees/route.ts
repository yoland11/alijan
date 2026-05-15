import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import {
  employeeAttendanceSchema,
  employeeProfileSchema,
  employeeTaskSchema,
  employeeTaskStatusSchema,
} from "@/lib/operations-validators";
import {
  createEmployeeAttendance,
  createEmployeeProfile,
  createEmployeeTask,
  listEmployeeProfiles,
  updateEmployeeTaskStatus,
} from "@/lib/server/operations";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const employees = await listEmployeeProfiles();
    return NextResponse.json({ employees });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل الموظفين." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body?.action === "attendance") {
      const parsed = employeeAttendanceSchema.safeParse(body.payload ?? body);
      if (!parsed.success) {
        return NextResponse.json(
          { message: parsed.error.issues[0]?.message || "بيانات الحضور غير صالحة." },
          { status: 400 },
        );
      }
      const attendance = await createEmployeeAttendance(parsed.data);
      return NextResponse.json({ attendance, message: "تم تسجيل الحضور." }, { status: 201 });
    }

    if (body?.action === "task") {
      const parsed = employeeTaskSchema.safeParse(body.payload ?? body);
      if (!parsed.success) {
        return NextResponse.json(
          { message: parsed.error.issues[0]?.message || "بيانات المهمة غير صالحة." },
          { status: 400 },
        );
      }
      const task = await createEmployeeTask(parsed.data);
      return NextResponse.json({ task, message: "تمت إضافة المهمة." }, { status: 201 });
    }

    if (body?.action === "task-status") {
      const parsed = employeeTaskStatusSchema.safeParse(body.payload ?? body);
      if (!parsed.success) {
        return NextResponse.json(
          { message: parsed.error.issues[0]?.message || "حالة المهمة غير صالحة." },
          { status: 400 },
        );
      }
      const task = await updateEmployeeTaskStatus(parsed.data);
      return NextResponse.json({ task, message: "تم تحديث المهمة." });
    }

    const parsed = employeeProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات الموظف غير صالحة." },
        { status: 400 },
      );
    }

    const employee = await createEmployeeProfile(parsed.data);
    return NextResponse.json({ employee, message: "تمت إضافة الموظف." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حفظ بيانات الموظف." },
      { status: 500 },
    );
  }
}
