import connectToDB from "../lib/mongodb.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import UserAttachedFile from "../models/UserAttachedFile.js";
import EvaluationProgram from "../models/EvaluationProgram.js";
import WeeklyEvaluation from "../models/WeeklyEvaluation.js";
import AccessControlForm from "../models/accesscontrolform.js";
import bcrypt from "bcryptjs";

async function seed() {
  await connectToDB();

  // Clear existing data
  await Role.deleteMany({});
  await User.deleteMany({});
  await UserAttachedFile.deleteMany({});
  await EvaluationProgram.deleteMany({});
  await WeeklyEvaluation.deleteMany({});
  await AccessControlForm.deleteMany({});

  // Create roles
  const roles = await Role.insertMany([
    { name: "Super Admin", description: "Super Admin" },
    { name: "Management", description: "Management" },
    { name: "HR", description: "HR" },
    { name: "Staff", description: "Team" },
    { name: "Temp Staff", description: "Associate" },
  ]);

  const roleMap = {};
  roles.forEach((r) => (roleMap[r.name] = r._id));

  // Create default users
  const users = await User.insertMany([
    {
      firstName: "Super",
      lastName: "Admin",
      primaryEmail: "admin@greyloops.com",
      fatherName: "John Admin",
      phone: "1234567890",
      emergencyContact: "0987654321",
      emergencyRelation: "Brother",
      cnic: "12345-1234567-1",
      role: roleMap["Super Admin"],
      jd: "Oversee all operations",
      exp: "10 years",
      password: await bcrypt.hash("123456", 10),
      isActive: true,
      created_at: new Date(),
    },
    {
      firstName: "Manager",
      lastName: "User",
      primaryEmail: "manager@greyloops.com",
      fatherName: "John Manager",
      phone: "1111111111",
      emergencyContact: "2222222222",
      emergencyRelation: "Father",
      cnic: "11111-1111111-1",
      role: roleMap["Management"],
      jd: "Manage operations",
      exp: "7 years",
      password: await bcrypt.hash("123456", 10),
      isActive: true,
      created_at: new Date(),
    },
    {
      firstName: "HR",
      lastName: "User",
      primaryEmail: "hr@greyloops.com",
      fatherName: "John HR",
      phone: "3333333333",
      emergencyContact: "4444444444",
      emergencyRelation: "Sister",
      cnic: "22222-2222222-2",
      role: roleMap["HR"],
      jd: "Handle employee management",
      exp: "5 years",
      password: await bcrypt.hash("123456", 10),
      isActive: true,
      created_at: new Date(),
    },
  ]);

  // Evaluation Programs (KPIs)
  await EvaluationProgram.insertMany([
    {
      Name: "Task Deliverability",
      Description:
        "Measures how well the employee completes assigned tasks within deadlines and meets expectations",
      Weightage: 30,
    },
    {
      Name: "Reliability & Accountability",
      Description:
        "Takes responsibility, Follows through, Minimal supervision required",
      Weightage: 20,
    },
    {
      Name: "Efficiency & Problem Solving",
      Description:
        "Measures how efficiently tasks are completed and how well the person overcomes blockers",
      Weightage: 20,
    },
    {
      Name: "Growth, Learning & Technical Proficiency",
      Description:
        "Measures personal development, skill growth, and initiative to stay updated.",
      Weightage: 15,
    },
    {
      Name: "Communication & Collaboration",
      Description:
        "Measures teamwork, participation in discussions, and clarity of communication.",
      Weightage: 15,
    },
  ]);

  // ✅ Insert Access Control Forms
  await AccessControlForm.insertMany([
    {
      name: "Dashboard",
      description: "Access to main analytics and performance dashboards.",
    },
    {
      name: "Roles",
      description: "Manage and assign different system roles.",
    },
    {
      name: "Profile",
      description: "View and update user profile information.",
    },
    {
      name: "Report",
      description: "Generate and view detailed system reports.",
    },
  ]);

  console.log("✅ Database seeded successfully!");
}

seed().catch((err) => {
  console.error("❌ Seeding error:", err);
  process.exit(1);
});
