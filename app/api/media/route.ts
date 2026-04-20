import { NextResponse } from "next/server";

import { getStorageBucket, createServiceSupabaseClient } from "@/lib/supabase/server";

function extractStorageObjectPath(source: string, bucket: string) {
  const trimmed = source.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const parsedUrl = new URL(trimmed);
    const markers = [
      `/storage/v1/object/public/${bucket}/`,
      `/storage/v1/object/authenticated/${bucket}/`,
      `/storage/v1/object/sign/${bucket}/`,
    ];

    for (const marker of markers) {
      const index = parsedUrl.pathname.indexOf(marker);

      if (index >= 0) {
        return decodeURIComponent(parsedUrl.pathname.slice(index + marker.length));
      }
    }
  } catch {
    return trimmed.replace(/^\/+/, "");
  }

  return "";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("src") ?? "";
    const bucket = getStorageBucket();
    const objectPath = extractStorageObjectPath(source, bucket);

    if (!objectPath) {
      return NextResponse.json({ message: "رابط الصورة غير صالح." }, { status: 400 });
    }

    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase.storage.from(bucket).download(objectPath);

    if (error || !data) {
      return NextResponse.json({ message: "تعذر تحميل الصورة." }, { status: 404 });
    }

    const arrayBuffer = await data.arrayBuffer();

    return new Response(arrayBuffer, {
      headers: {
        "Content-Type": data.type || "application/octet-stream",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر عرض الصورة." },
      { status: 500 },
    );
  }
}
