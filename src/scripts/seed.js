// seed.js
import connectToDB from "../lib/mongodb.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import UserAttachedFile from "../models/UserAttachedFile.js";
import bcrypt from "bcryptjs";

async function seed() {
  await connectToDB();

  // Clear existing data
  await Role.deleteMany({});
  await User.deleteMany({});
  await UserAttachedFile.deleteMany({});

  // Create roles
  const roles = await Role.insertMany([
    { name: "Super Admin", description: "Has full access to the system" },
    { name: "Management", description: "Manages overall operations" },
    { name: "HR", description: "Handles employee management" },
    { name: "Staff", description: "General staff role" },
    { name: "Temp Staff", description: "Temporary staff with limited access" },
  ]);

  // Map roles for easy access
  const roleMap = {};
  roles.forEach((r) => (roleMap[r.name] = r._id));

  // Create default users
  const users = await User.insertMany([
    {
      firstName: "Super",
      lastName: "Admin",
      primaryEmail: "superadmin@greyloops.com",
      secondaryEmail: "",
      fatherName: "John Admin",
      phone: "1234567890",
      emergencyContact: "0987654321",
      emergencyRelation: "Brother",
      cnic: "12345-1234567-1",
      role: roleMap["Super Admin"],
      medicalCondition: "",
      jd: "Oversee all operations",
      exp: "10 years",
      password: await bcrypt.hash("123456", 10),
      active: true, // ✅ set active
      created_at: new Date(),
    },
  ]);

  // 👇 pick first user (Super Admin) to attach files
  const superAdmin = users[0];

  // Add some default attached files
  await UserAttachedFile.insertMany([
    {
      title: "Login Page Design",
      description: "Initial version of login screen",
      fileUrl: "/uploads/login.png",
      createdAt: new Date(),
      createdBy: superAdmin._id.toString(), // store as string
      userId: superAdmin._id.toString(),    // store as string
    },
  ]);

  console.log("✅ Seeding completed! Created roles, users, and attached files.");
  process.exit(0);
}

seed();
