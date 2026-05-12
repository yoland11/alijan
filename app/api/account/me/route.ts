import { NextResponse } from "next/server";

import { getCustomerSession } from "@/lib/auth";
import { getCustomerById } from "@/lib/server/accounts";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ customer: null }, { status: 401 });
  }

  try {
    const customer = await getCustomerById(session.customerId);
    return NextResponse.json({ customer });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل الحساب." },
      { status: 500 },
    );
  }
}
