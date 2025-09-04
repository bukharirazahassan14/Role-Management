import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";
import dbConnect from "@/lib/mongodb";

export async function POST(req) {
  try {
    await dbConnect();

    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ message: "❌ Email is required" }), { status: 400 });
    }

    // Check if user exists
    const user = await User.findOne({ primaryEmail: email });
    if (!user) {
      return new Response(JSON.stringify({ message: "❌ User not found" }), { status: 404 });
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Save reset request
    await PasswordReset.create({
      userId: user._id,
      token,
      expiresAt,
    });

    // Build reset link
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

      const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 4️⃣ Send Email
    await transporter.sendMail({
      from: `"Support Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔑 Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6;">
          <h2>Password Reset</h2>
          <p>Hello ${user.firstName || "User"},</p>
          <p>You requested to reset your password. Click the link below:</p>
          <a href="${resetLink}" 
             style="display:inline-block;padding:10px 20px;background:#4F46E5;color:#fff;text-decoration:none;border-radius:5px;">
             Reset Password
          </a>
          <p>This link will expire in 15 minutes.</p>
          <p>If you did not request this, ignore this email.</p>
        </div>
      `,
    });


    return new Response(JSON.stringify({ message: "✅ Reset link sent to your email" }), { status: 200 });
  } catch (err) {
    console.error("Forgot password error:", err);
    return new Response(JSON.stringify({ message: "⚠️ Something went wrong" }), { status: 500 });
  }
}
