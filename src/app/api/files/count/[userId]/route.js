import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongodb";
import UserAttachedFile from "@/models/UserAttachedFile";

export async function GET(request, context) {
  try {
    await connectToDB();

    // ✅ correctly await params
    const { userId } = await context.params;

    const count = await UserAttachedFile.countDocuments({ userId });

    return NextResponse.json({ count });
  } catch (err) {
    console.error("❌ Count error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
