import { NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw =
      searchParams.get("code") ??
      searchParams.get("q") ??
      searchParams.get("query") ??
      "";

    const query = raw.trim().toUpperCase();

    console.log("TRACK RAW:", raw);
    console.log("TRACK QUERY:", query);

    if (!query) {
      return NextResponse.json(
        { message: "Missing tracking query" },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();

    if (query.startsWith("AJN-")) {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("order_code", query)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("TRACK BY CODE ERROR:", error);
        return NextResponse.json(
          { message: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ orders: data ?? [] });
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("TRACK BY PHONE FETCH ERROR:", error);
      return NextResponse.json(
        { message: error.message },
        { status: 500 }
      );
    }

    const orders = (data ?? []).filter((order) =>
      String(order.phone ?? "").endsWith(query)
    );

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("TRACK ROUTE FATAL ERROR:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "تعذر تنفيذ البحث.",
      },
      { status: 500 }
    );
  }
}