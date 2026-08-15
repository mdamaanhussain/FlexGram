const path = require("path");
require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 8080,
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/flexgram",
  SESSION_SECRET: process.env.SESSION_SECRET || "flexgram-secret-key",
  ADMIN_USERNAME: "amaanhussain786_",
  ADMIN_PASSWORD: "admin@123",
  UPLOADS_DIR: path.join(__dirname, "..", "..", "public", "uploads"),
  ALLOWED_IMAGE_TYPES: /jpeg|jpg|png|gif|webp/,
  S3_REGION: process.env.AWS_REGION || "ap-south-1",
  S3_BUCKET_NAME: process.env.AWS_S3_BUCKET || "flexgram-uploads",
  S3_ACCESS_KEY: process.env.AWS_ACCESS_KEY_ID,
  S3_SECRET_KEY: process.env.AWS_SECRET_ACCESS_KEY
};
