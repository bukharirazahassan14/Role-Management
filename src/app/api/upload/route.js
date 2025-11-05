import { mkdir, access, unlink } from "fs/promises";
import path from "path";
import sharp from "sharp";

export async function POST(req) {
  try {
    const data = await req.formData();
    const file = data.get("file");
    const userId = data.get("userId");

    if (!file || !userId) {
      return new Response(JSON.stringify({ error: "Missing file or userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${userId}.png`;
    const filePath = path.join(uploadDir, fileName);

    try {
      await access(filePath);
      await unlink(filePath);
      console.log(`🧹 Deleted old profile image for user ${userId}`);
    } catch {
      // Ignore if not found
    }

    // Resize and save new image using sharp
    await sharp(buffer)
      .resize(200, 200, {
        fit: "cover", // Ensures crop to exact 200x200
        // FIX: Use "attention". This tells Sharp to analyze the content 
        // (like faces or prominent details) and center the crop around them.
        position: "attention", 
      })
      .png({ quality: 90 })
      .toFile(filePath);

    const publicPath = `/uploads/profiles/${fileName}`;
    return new Response(JSON.stringify({ filePath: publicPath }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Upload error:", err);
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}