// src/app/api/users/[id]/route.js

import connectToDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// ✅ GET - Fetch single user by ID
export async function GET(req, context) {
  try {
    await connectToDB();

    const { id } = await context.params;

    // 🔹 Populate only _id and name (exclude description & __v)
    const user = await User.findById(id)
      .populate("role", "name") // only keep "name" and _id
      .lean();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}

// ✅ PUT - Update user by ID (with optional password re-hash)
export async function PUT(req, context) {
  try {
    await connectToDB();

    // 🔹 Must await params
    const { id } = await context.params;
    const body = await req.json();

    const updateData = {
      firstName: body.firstName,
      lastName: body.lastName,
      primaryEmail: body.primaryEmail,
      secondaryEmail: body.secondaryEmail,
      fatherName: body.fatherName,
      phone: body.phone,
      cnic: body.cnic,
      emergencyContact: body.emergencyContact,
      emergencyRelation: body.emergencyRelation,
      role: body.role,
      medicalCondition: body.medicalCondition,
      jd: body.jd,
      exp: body.exp,
      joiningDate: body.joiningDate,
      isActive: body.isActive,
    };

    // ✅ If password provided, hash it
    if (body.password && body.password.trim() !== "") {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
    }).populate("role");

    if (!updatedUser) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    return new Response(
      JSON.stringify({
        message: "User updated successfully",
        user: updatedUser,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
