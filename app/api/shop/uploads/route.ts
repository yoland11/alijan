import { NextResponse } from "next/server";

import { uploadFilesToStorage } from "@/lib/server/storage";

export async function POST(request: Request) {
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
      prefix: uploadKind === "review-image" ? "product-reviews" : "customer-customizations",
      maxSizeInMb: 12,
      optimizeImages: true,
      createThumbnail: true,
      maxWidth: 1200,
      quality: 78,
      thumbnailWidth: 420,
    });

    return NextResponse.json({
      files: uploadedFiles.map(({ name, url, thumbnailUrl }) => ({ name, url, thumbnailUrl })),
      message: "تم رفع الملف.",
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر رفع الملف." },
      { status: 500 },
    );
  }
}
