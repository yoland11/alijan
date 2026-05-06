import { NextResponse } from "next/server";

import { uploadFilesToStorage } from "@/lib/server/storage";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((file): file is File => file instanceof File && file.size > 0);

    if (!files.length) {
      return NextResponse.json({ message: "لم يتم اختيار ملفات PDF." }, { status: 400 });
    }

    const uploadedFiles = await uploadFilesToStorage(files, {
      prefix: "research-pdfs",
      allowedMimeTypes: ["application/pdf"],
      allowedExtensions: ["pdf"],
      maxSizeInMb: 20,
    });

    return NextResponse.json({
      files: uploadedFiles.map(({ name, url }) => ({ name, url })),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر رفع ملفات PDF." },
      { status: 500 },
    );
  }
}
