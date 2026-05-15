import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { employeeProfileSchema } from "@/lib/operations-validators";
import { deleteEmployeeProfile, updateEmployeeProfile } from "@/lib/server/operations";

export const dynamic = "force-dynamic";

interface Context {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, context: Context) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = employeeProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "بيانات الموظف غير صالحة." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const employee = await updateEmployeeProfile(id, parsed.data);
    return NextResponse.json({ employee, message: "تم تحديث الموظف." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحديث الموظف." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: Context) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    await deleteEmployeeProfile(id);
    return NextResponse.json({ message: "تم حذف الموظف." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حذف الموظف." },
      { status: 500 },
    );
  }
}
