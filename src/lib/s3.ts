const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ALLOWED_DOCUMENT_TYPES = new Set([
  ...ALLOWED_IMAGE_TYPES,
  "application/pdf",
]);

export type UploadFolder = "profile" | "documents" | "papers";

export function getUploadFolder(rawFolder: FormDataEntryValue | null): UploadFolder {
  if (rawFolder === "profile" || rawFolder === "documents" || rawFolder === "papers") {
    return rawFolder;
  }
  return "documents";
}

export function buildS3ObjectKey(folder: UploadFolder, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

  if (folder === "papers") {
    return `papers/${safeName}`;
  }

  if (folder === "profile") {
    return `candidates/profile/${safeName}`;
  }

  return `candidates/documents/${safeName}`;
}

export function getS3PublicUrl(key: string): string | null {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) return null;

  const customBase =
    process.env.AWS_S3_PUBLIC_URL ||
    process.env.AWS_CLOUDFRONT_URL ||
    process.env.NEXT_PUBLIC_AWS_S3_PUBLIC_URL;

  if (customBase) {
    return `${customBase.replace(/\/$/, "")}/${key}`;
  }

  const region = process.env.AWS_REGION || "us-east-1";
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export function validateUploadFile(
  file: File,
  folder: UploadFolder
): { ok: true } | { ok: false; error: string } {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "File size must be 5MB or less." };
  }

  const contentType = (file.type || "").toLowerCase();
  const allowedTypes = folder === "profile" ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;

  if (contentType && !allowedTypes.has(contentType)) {
    return {
      ok: false,
      error:
        folder === "profile"
          ? "Profile picture must be a JPG, PNG, or WEBP image."
          : "Document must be a PDF or image file.",
    };
  }

  return { ok: true };
}

export function createUniqueFileName(originalName: string): string {
  const extension = originalName.includes(".")
    ? originalName.split(".").pop()?.toLowerCase() || "bin"
    : "bin";

  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
}
