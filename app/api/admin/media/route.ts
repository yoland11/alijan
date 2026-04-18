import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { getStorageBucket, createServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((file): file is File => file instanceof File && file.size > 0);

    if (!files.length) {
      return NextResponse.json({ message: "لم يتم اختيار أي ملفات." }, { status: 400 });
    }

    const supabase = createServiceSupabaseClient();
    const bucket = getStorageBucket();

    const urls = await Promise.all(
      files.map(async (file) => {
        const extension = file.name.split(".").pop() || "bin";
        const fileName = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const arrayBuffer = await file.arrayBuffer();

        const { error } = await supabase.storage
          .from(bucket)
          .upload(fileName, arrayBuffer, {
            contentType: file.type,
            upsert: false,
          });

        if (error) {
          throw new Error(error.message);
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
        return data.publicUrl;
      }),
    );

    return NextResponse.json({ urls });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر رفع الملفات." },
      { status: 500 },
    );
  }
}

