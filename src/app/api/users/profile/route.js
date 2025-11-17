// app/api/users/profile/route.js
import connectToDB from "@/lib/mongodb";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const userID = searchParams.get("userID");

    if (!userID) {
      return new Response(JSON.stringify({ error: "userID is required" }), {
        status: 400,
      });
    }

    // ✅ Aggregate user profile with role info
    const results = await mongoose.connection
      .collection("users")
      .aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(userID),
          },
        },
        {
          $lookup: {
            from: "roles", // roles collection
            localField: "role", // field in users collection
            foreignField: "_id", // match with _id in roles
            as: "roleDetails", // output field
          },
        },
        {
          $unwind: "$roleDetails", // flatten array
        },
        {
          $project: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            primaryEmail: 1,
            secondaryEmail: 1,
            password: 1,
            fatherName: 1,
            phone: 1,
            emergencyContact: 1,
            emergencyRelation: 1,
            cnic: 1,
            jd: 1,
            exp: 1,
            accHolderName: 1,
            accNumber: 1,
            bankName: 1,
            iban: 1,
            isActive: 1,
            created_at: 1,
            joiningDate: 1,
            role: {
              _id: "$roleDetails._id",
              name: "$roleDetails.name",
              description: "$roleDetails.description",
            },
            salary: 1,
          },
        },
      ])
      .toArray();

    if (results.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(results[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ Error fetching user profile:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

// PATCH: update user profile
export async function PATCH(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const userID = searchParams.get("userID");

    if (!userID) {
      return new Response(JSON.stringify({ error: "userID is required" }), {
        status: 400,
      });
    }

    const body = await req.json();

    // Prevent role from being changed here
    const { role, _id, password, ...updateFields } = body;

    // ✅ Encrypt password if it is provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    const result = await mongoose.connection
      .collection("users")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(userID) },
        { $set: updateFields }
      );

    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "User updated successfully" }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error updating user profile:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
