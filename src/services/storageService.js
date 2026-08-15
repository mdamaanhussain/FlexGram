const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const {
  UPLOADS_DIR,
  S3_REGION,
  S3_BUCKET_NAME,
  S3_ACCESS_KEY,
  S3_SECRET_KEY
} = require("../config/appConfig");

const s3Client = new S3Client({
  region: S3_REGION,
  credentials: S3_ACCESS_KEY && S3_SECRET_KEY
    ? {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY
      }
    : undefined
});

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

async function uploadImageToS3(file) {
  const fileKey = `uploads/${uuidv4()}-${file.originalname}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
    Metadata: {
      uploadedAt: new Date().toISOString()
    }
  });

  try {
    await s3Client.send(command);
    return `/s3-file/${fileKey}`;
  } catch (err) {
    console.error("S3 upload error:", err.message);
    throw new Error("Failed to upload image to S3");
  }
}

async function deleteStoredImage(imageUrl) {
  if (!imageUrl) return;

  if (imageUrl.startsWith("/s3-file/")) {
    const fileKey = imageUrl.split("/s3-file/")[1];

    try {
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: fileKey
      });
      await s3Client.send(command);
    } catch (err) {
      console.error("S3 delete error:", err.message);
    }
    return;
  }

  if (imageUrl.startsWith("/uploads/")) {
    const fileName = imageUrl.replace("/uploads/", "");
    const filePath = path.join(UPLOADS_DIR, fileName);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error("Local file delete error:", err.message);
    }
  }
}

async function getS3File(fileKey, res) {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileKey
    });

    const response = await s3Client.send(command);
    res.set("Content-Type", response.ContentType || "application/octet-stream");
    res.set("Cache-Control", "public, max-age=31536000");
    response.Body.pipe(res);
  } catch (err) {
    console.error("S3 download error:", err.message);
    res.status(404).send("Image not found");
  }
}

module.exports = {
  ensureUploadsDir,
  uploadImageToS3,
  deleteStoredImage,
  getS3File,
  s3Client
};
