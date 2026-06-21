import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand, type ObjectCannedACL } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import path from "path";
import {
  buildS3ObjectKey,
  createUniqueFileName,
  getS3PublicUrl,
  getUploadFolder,
  validateUploadFile,
} from "@/lib/s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = getUploadFolder(formData.get("folder"));

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const validation = validateUploadFile(file, folder);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueFileName = createUniqueFileName(file.name);
    const key = buildS3ObjectKey(folder, uniqueFileName);
    const contentType = file.type || "application/octet-stream";

    if (process.env.AWS_S3_BUCKET) {
      const uploadInput = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      };

      if (process.env.AWS_S3_ACL) {
        Object.assign(uploadInput, {
          ACL: process.env.AWS_S3_ACL as ObjectCannedACL,
        });
      }

      const command = new PutObjectCommand(uploadInput);

      await s3Client.send(command);

      const fileUrl = getS3PublicUrl(key);
      if (!fileUrl) {
        return NextResponse.json({ error: "Failed to build S3 file URL" }, { status: 500 });
      }

      return NextResponse.json({ url: fileUrl, key, storage: "s3" });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, uniqueFileName);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({
      url: `/uploads/${uniqueFileName}`,
      key: `uploads/${uniqueFileName}`,
      storage: "local",
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
