import sharp from "sharp";

import { createServiceSupabaseClient, getStorageBucket } from "@/lib/supabase/server";

export interface UploadedStorageFile {
  name: string;
  url: string;
  thumbnailUrl?: string;
  contentType: string;
  size: number;
}

interface UploadOptions {
  prefix?: string;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  maxSizeInMb?: number;
  optimizeImages?: boolean;
  createThumbnail?: boolean;
  maxWidth?: number;
  quality?: number;
  thumbnailWidth?: number;
}

interface DeleteStorageFileResult {
  deleted: boolean;
  warning?: string;
}

function getFileExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function getStoragePathFromPublicUrl(fileUrl: string, bucket: string) {
  try {
    const parsed = new URL(fileUrl);
    const marker = `/storage/v1/object/public/${bucket}/`;

    if (!parsed.pathname.includes(marker)) {
      return "";
    }

    const [, filePath = ""] = parsed.pathname.split(marker);
    return decodeURIComponent(filePath);
  } catch {
    return "";
  }
}

export async function uploadFilesToStorage(files: File[], options: UploadOptions = {}) {
  const {
    prefix = "uploads",
    allowedMimeTypes = [],
    allowedExtensions = [],
    maxSizeInMb = 15,
    optimizeImages = false,
    createThumbnail = false,
    maxWidth = 1200,
    quality = 78,
    thumbnailWidth = 420,
  } = options;

  const maxBytes = maxSizeInMb * 1024 * 1024;
  const supabase = createServiceSupabaseClient();
  const bucket = getStorageBucket();

  return Promise.all(
    files.map(async (file) => {
      const extension = getFileExtension(file.name) || "bin";

      if (file.size > maxBytes) {
        throw new Error(`الملف ${file.name} أكبر من الحد المسموح ${maxSizeInMb}MB.`);
      }

      if (allowedMimeTypes.length && file.type && !allowedMimeTypes.includes(file.type)) {
        throw new Error(`نوع الملف ${file.name} غير مدعوم.`);
      }

      if (allowedExtensions.length && !allowedExtensions.includes(extension)) {
        throw new Error(`امتداد الملف ${file.name} غير مدعوم.`);
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const baseFilePath = `${prefix}/${Date.now()}-${crypto.randomUUID()}`;
      const isImage = file.type.startsWith("image/");

      if (optimizeImages && isImage) {
        const optimizedBuffer = await sharp(buffer)
          .rotate()
          .resize({
            width: maxWidth,
            height: maxWidth,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality })
          .toBuffer();

        const filePath = `${baseFilePath}.webp`;
        const { error } = await supabase.storage.from(bucket).upload(filePath, optimizedBuffer, {
          contentType: "image/webp",
          upsert: false,
        });

        if (error) {
          throw new Error(error.message);
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        let thumbnailUrl = data.publicUrl;

        if (createThumbnail) {
          try {
            const thumbnailBuffer = await sharp(buffer)
              .rotate()
              .resize({
                width: thumbnailWidth,
                height: thumbnailWidth,
                fit: "inside",
                withoutEnlargement: true,
              })
              .webp({ quality: Math.max(70, quality - 4) })
              .toBuffer();

            const thumbnailPath = `${baseFilePath}-thumb.webp`;
            const { error: thumbnailError } = await supabase.storage
              .from(bucket)
              .upload(thumbnailPath, thumbnailBuffer, {
                contentType: "image/webp",
                upsert: false,
              });

            if (!thumbnailError) {
              const { data: thumbnailData } = supabase.storage.from(bucket).getPublicUrl(thumbnailPath);
              thumbnailUrl = thumbnailData.publicUrl;
            }
          } catch {
            thumbnailUrl = data.publicUrl;
          }
        }

        return {
          name: file.name,
          url: data.publicUrl,
          thumbnailUrl,
          contentType: "image/webp",
          size: optimizedBuffer.byteLength,
        } satisfies UploadedStorageFile;
      }

      const filePath = `${baseFilePath}.${extension}`;

      const { error } = await supabase.storage.from(bucket).upload(filePath, arrayBuffer, {
        contentType: file.type || undefined,
        upsert: false,
      });

      if (error) {
        throw new Error(error.message);
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

      return {
        name: file.name,
        url: data.publicUrl,
        contentType: file.type,
        size: file.size,
      } satisfies UploadedStorageFile;
    }),
  );
}

export async function deleteFileFromStorage(fileUrl: string | string[]): Promise<DeleteStorageFileResult> {
  const supabase = createServiceSupabaseClient();
  const bucket = getStorageBucket();
  const urls = Array.isArray(fileUrl) ? fileUrl : [fileUrl];
  const filePaths = Array.from(
    new Set(
      urls
        .map((url) => getStoragePathFromPublicUrl(url, bucket))
        .filter(Boolean),
    ),
  );

  if (!filePaths.length) {
    return {
      deleted: false,
      warning: "تعذر حذف الملف من التخزين. تم حذف الرابط فقط.",
    };
  }

  const { error } = await supabase.storage.from(bucket).remove(filePaths);

  if (error) {
    return {
      deleted: false,
      warning: "تعذر حذف الملف من التخزين. تم حذف الرابط فقط.",
    };
  }

  return { deleted: true };
}
