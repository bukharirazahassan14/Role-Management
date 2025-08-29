import { NextResponse } from "next/server";
import path from "path";
import { writeFile } from "fs/promises";
import connectToDB from "@/lib/mongodb";
import UserAttachedFile from "@/models/UserAttachedFile";

export async function POST(req) {
  try {
    await connectToDB();

    const formData = await req.formData();
    const title = formData.get("title");
    const description = formData.get("description");
    const createdBy = formData.get("createdBy");
    const userId = formData.get("userId")
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // ✅ Save file into /public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    // ✅ Save file info in DB
    const newFile = await UserAttachedFile.create({
      title,
      description,
      fileUrl: `/uploads/${fileName}`, // accessible in frontend
      createdAt: new Date(),
      createdBy,
      userId,
    });

    return NextResponse.json(newFile, { status: 201 });
  } catch (err) {
    console.error("❌ Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
