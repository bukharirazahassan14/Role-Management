// src/app/api/users/route.js

import connectToDB from "@/lib/mongodb";
import User from "@/models/User.js";
import bcrypt from "bcryptjs";

// ✅ GET - Fetch all users
export async function GET(req) {
  try {
    await connectToDB();

    const users = await User.find().populate("role").lean();

    const formatted = users.map((u) => ({
      id: u._id.toString(),
      fullName: `${u.firstName} ${u.lastName}`,
      email: u.primaryEmail,
      role: u.role
        ? {
            _id: u.role._id.toString(),
            name: u.role.name,
            description: u.role.description || null, // ✅ include role description
          }
        : null,
      joiningDate: u.joiningDate,
      jd: u.jd,
      isActive: u.isActive,
    }));

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ✅ POST - Add new user with hashed password
export async function POST(req) {
  try {
    await connectToDB();

    const body = await req.json();

    // ✅ Hash the password before saving
    const hashedPassword = await bcrypt.hash(body.password, 10);

    const newUser = new User({
      firstName: body.firstName,
      lastName: body.lastName,
      primaryEmail: body.primaryEmail,
      secondaryEmail: body.secondaryEmail,
      password: hashedPassword,
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
    });

    const savedUser = await newUser.save();

    return new Response(
      JSON.stringify({
        message: "User created successfully",
        userId: savedUser._id.toString(),
        role: savedUser.role,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ✅ PATCH - Update active status
export async function PATCH(req) {
  try {
    await connectToDB();
    const { userId, isActive } = await req.json();

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    );

    if (!updatedUser) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({
        message: "Status updated",
        isActive: updatedUser.isActive,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating status:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

