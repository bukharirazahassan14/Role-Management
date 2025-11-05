// models/UserAttachedFile.js
import mongoose from "mongoose";

const userAttachedFileSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String, required: true }, // path or cloud URL
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true }, // ✅ store userId as plain string
  userId: { type: String, required: true },
});

export default mongoose.models.UserAttachedFile ||
  mongoose.model("UserAttachedFile", userAttachedFileSchema);
