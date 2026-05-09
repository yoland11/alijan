import { createServiceSupabaseClient, getStorageBucket } from "@/lib/supabase/server";

export interface UploadedStorageFile {
  name: string;
  url: string;
  contentType: string;
  size: number;
}

interface UploadOptions {
  prefix?: string;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  maxSizeInMb?: number;
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

      const filePath = `${prefix}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const arrayBuffer = await file.arrayBuffer();

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

export async function deleteFileFromStorage(fileUrl: string): Promise<DeleteStorageFileResult> {
  const supabase = createServiceSupabaseClient();
  const bucket = getStorageBucket();
  const filePath = getStoragePathFromPublicUrl(fileUrl, bucket);

  if (!filePath) {
    return {
      deleted: false,
      warning: "تعذر حذف الملف من التخزين. تم حذف الرابط فقط.",
    };
  }

  const { error } = await supabase.storage.from(bucket).remove([filePath]);

  if (error) {
    return {
      deleted: false,
      warning: "تعذر حذف الملف من التخزين. تم حذف الرابط فقط.",
    };
  }

  return { deleted: true };
}
