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
      fullName: `${u.firstName} ${u.lastName}`, // concatenate firstName + lastName
      email: u.primaryEmail,                   // use primaryEmail
      role: u.role
        ? { _id: u.role._id.toString(), name: u.role.name }
        : null, // return role as object
      createdAt: u.created_at,
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
    });

    const savedUser = await newUser.save();

    return new Response(
      JSON.stringify({
        message: "User created successfully",
        userId: savedUser._id.toString(),
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