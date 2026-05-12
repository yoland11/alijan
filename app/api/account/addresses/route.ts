import { NextResponse } from "next/server";

import { getCustomerSession } from "@/lib/auth";
import { deleteCustomerAddress, listCustomerAddresses, saveCustomerAddress } from "@/lib/server/accounts";
import { customerAddressSchema } from "@/lib/shop-validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const addresses = await listCustomerAddresses(session.customerId);
    return NextResponse.json({ addresses });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر تحميل العناوين." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = customerAddressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || "العنوان غير صالح." },
        { status: 400 },
      );
    }

    const address = await saveCustomerAddress(session.customerId, parsed.data, typeof body.id === "string" ? body.id : undefined);
    return NextResponse.json({ address, message: "تم حفظ العنوان." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حفظ العنوان." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getCustomerSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") ?? "";

    if (!id) {
      return NextResponse.json({ message: "العنوان غير صالح." }, { status: 400 });
    }

    await deleteCustomerAddress(session.customerId, id);
    return NextResponse.json({ message: "تم حذف العنوان." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حذف العنوان." },
      { status: 500 },
    );
  }
}
