///src/app/api/files/[id]/route.js
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import connectToDB from "@/lib/mongodb";
import UserAttachedFile from "@/models/UserAttachedFile";

export async function DELETE(req, { params }) {
  try {
    await connectToDB();

    const { id } = await params; // ✅ await params

    // Find the file record in DB
    const file = await UserAttachedFile.findById(id);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Remove file from disk
    if (file.fileUrl) {
      const filePath = path.join(process.cwd(), "public", file.fileUrl);
      try {
        await fs.unlink(filePath);
        console.log(`🗑️ Deleted file from disk: ${filePath}`);
      } catch (err) {
        console.warn("⚠️ File not found on disk, skipping delete:", filePath);
      }
    }

    // Remove from DB
    await UserAttachedFile.findByIdAndDelete(id);

    return NextResponse.json({ message: "File deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("❌ Delete error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
