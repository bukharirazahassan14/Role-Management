// src/app/api/users/[id]/role/route.js

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDB from "@/lib/mongodb";
import User from "@/models/User";
import Role from "@/models/Role";

export async function PUT(req, context) {
  try {
    const params = await context.params;  // 👈 this silences the warning
    const { id } = params;
    const { roleId } = await req.json();

    await connectToDB();

    const role = await Role.findById(roleId);
    if (!role) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role: new mongoose.Types.ObjectId(roleId) },
      { new: true }
    ).populate("role");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Role updated successfully", user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
