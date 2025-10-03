//app/api/files/route.js

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

// 🔹 GET → Fetch files (optionally by userId)
export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let files;
    if (userId) {
      files = await UserAttachedFile.find({ userId }).sort({ createdAt: -1 });
    } else {
      files = await UserAttachedFile.find().sort({ createdAt: -1 });
    }

    return NextResponse.json(files, { status: 200 });
  } catch (err) {
    console.error("❌ GET files error:", err);
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}