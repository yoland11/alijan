import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth";
import { deleteFileFromStorage, uploadFilesToStorage } from "@/lib/server/storage";

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
      prefix:
        uploadKind === "research-pdf"
          ? "research-pdfs"
          : uploadKind === "product-image"
            ? "product-images"
            : uploadKind === "product-video"
              ? "product-videos"
              : uploadKind === "portfolio-media"
                ? "portfolio-media"
                : uploadKind === "payment-qr"
                  ? "payment-qr"
                  : "order-images",
      allowedMimeTypes:
        uploadKind === "research-pdf" ? ["application/pdf"] : undefined,
      allowedExtensions: uploadKind === "research-pdf" ? ["pdf"] : undefined,
      maxSizeInMb: uploadKind === "research-pdf" ? 20 : 15,
      optimizeImages: uploadKind !== "research-pdf" && uploadKind !== "product-video",
      createThumbnail: uploadKind === "product-image" || uploadKind === "portfolio-media",
      maxWidth: 1200,
      quality: 78,
      thumbnailWidth: 420,
    });

    return NextResponse.json({
      urls: uploadedFiles.map((file) => file.url),
      thumbnailUrls: uploadedFiles.map((file) => file.thumbnailUrl || file.url),
      files: uploadedFiles.map(({ name, url, thumbnailUrl }) => ({ name, url, thumbnailUrl })),
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر رفع الملفات." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ message: "غير مصرح." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { src?: string; srcs?: string[] };
    const src = body.src?.trim() ?? "";
    const srcs = (body.srcs ?? []).map((item) => item.trim()).filter(Boolean);
    const targets = src ? [src, ...srcs] : srcs;

    if (!targets.length) {
      return NextResponse.json({ message: "رابط الصورة غير صالح." }, { status: 400 });
    }

    const result = await deleteFileFromStorage(targets);

    return NextResponse.json({
      message: result.warning || "تم حذف الصورة.",
      warning: result.warning || null,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "تعذر حذف الصورة." },
      { status: 500 },
    );
  }
}
