import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads folder exists
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📂 Created uploads folder");
}

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("📥 Saving file to:", uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `product-${Date.now()}${ext}`;
    console.log(`📝 Renaming file: ${file.originalname} -> ${filename}`);
    cb(null, filename);
  },
});

// File filter (only images allowed)
const fileFilter = (req, file, cb) => {
  console.log("🔍 Checking file type:", file.mimetype);
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    console.error("❌ File rejected:", file.originalname);
    cb(new Error("Only images are allowed!"), false);
  }
};

// Allow up to 3 images
const upload = multer({ storage, fileFilter });

export const uploadProductImages = upload.array("images", 3);
