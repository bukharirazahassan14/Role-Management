// src/app/api/users/[id]/route.js

import connectToDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

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
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
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
      accHolderName: body.accHolderName,
      accNumber: body.accNumber,
      bankName: body.bankName,
      iban: body.iban,
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
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}

// ✅ DELETE - Delete user by ID


export async function DELETE(req, context) {
  try {
    await connectToDB();
    const { id } = await context.params;

    // ✅ Step 1: Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // ✅ Step 2: Access DB connection properly (using mongoose.connection)
    const db = mongoose.connection;

    // 🔹 Check Weekly Evaluations collection
    const evaluationCollection = db.collection("weeklyevaluations");
    const evaluationExists = await evaluationCollection.findOne({
      userId: user._id,
    });

    if (evaluationExists) {
      return new Response(
        JSON.stringify({
          error:
            "User cannot be deleted because an evaluation record already exists.",
        }),
        { status: 400 }
      );
    }

    // 🔹 Also delete from useraccesscontrol collection
    const accessControlCollection = db.collection("useraccesscontrol");
    await accessControlCollection.deleteMany({ userId: user._id });

    // ✅ Step 3: Delete user record
    await User.findByIdAndDelete(id);

    return new Response(
      JSON.stringify({
        message: "User and related access records deleted successfully.",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
}

