import bcrypt from "bcryptjs";
import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";
import dbConnect from "@/lib/mongodb";

export async function POST(req) {
  try {
    await dbConnect();
    const { token, password } = await req.json();

    if (!token || !password) {
      return new Response(JSON.stringify({ message: "❌ Token and password required" }), { status: 400 });
    }

    // Find reset request
    const resetReq = await PasswordReset.findOne({ token, used: false });
    if (!resetReq) {
      return new Response(JSON.stringify({ message: "❌ Invalid or used token" }), { status: 400 });
    }

    // Check expiry
    if (resetReq.expiresAt < new Date()) {
      return new Response(JSON.stringify({ message: "⏳ Token expired" }), { status: 400 });
    }

    // Update user password (hash it)
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(resetReq.userId, { password: hashedPassword });

    // Mark reset as used
    resetReq.used = true;
    await resetReq.save();

    return new Response(JSON.stringify({ message: "✅ Password reset successful" }), { status: 200 });
  } catch (err) {
    console.error("Reset password error:", err);
    return new Response(JSON.stringify({ message: "⚠️ Something went wrong" }), { status: 500 });
  }
}
