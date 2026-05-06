import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { uploadFilesToStorage } from "@/lib/server/storage";

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const uploadKind = searchParams.get("kind");
    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((file): file is File => file instanceof File && file.size > 0);

    if (!files.length) {
      return NextResponse.json({ message: "لم يتم اختيار أي ملفات." }, { status: 400 });
    }

    const uploadedFiles = await uploadFilesToStorage(files, {
      prefix: uploadKind === "research-pdf" ? "research-pdfs" : "order-images",
      allowedMimeTypes:
        uploadKind === "research-pdf" ? ["application/pdf"] : undefined,
      allowedExtensions: uploadKind === "research-pdf" ? ["pdf"] : undefined,
      maxSizeInMb: uploadKind === "research-pdf" ? 20 : 15,
    });

    return NextResponse.json({
      urls: uploadedFiles.map((file) => file.url),
      files: uploadedFiles.map(({ name, url }) => ({ name, url })),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر رفع الملفات." },
      { status: 500 },
    );
  }
}
