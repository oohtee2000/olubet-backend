// C:\express\osmium_blog_backend\osmium_blog_express_application\config\db.js
import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("✅ Mongoose connected to MongoDB");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ Mongoose connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("⚠️ Mongoose disconnected from MongoDB");
  });

  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (error) {
    console.error("❌ Initial MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
