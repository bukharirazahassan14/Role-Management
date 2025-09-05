import mongoose from "mongoose";

const PasswordResetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notified: { type: Boolean, default: false }
  },
  { timestamps: true } // ✅ Adds createdAt and updatedAt
);

const PasswordReset =
  mongoose.models.PasswordReset ||
  mongoose.model("PasswordReset", PasswordResetSchema);

export default PasswordReset;
