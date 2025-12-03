import connectToDB from "../lib/mongodb.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import UserAttachedFile from "../models/UserAttachedFile.js";
import EvaluationProgram from "../models/EvaluationProgram.js";
import WeeklyEvaluation from "../models/WeeklyEvaluation.js";
import accesscontrolform from "../models/accesscontrolform.js";
import useraccesscontrol from "../models/useraccesscontrol.js"; // ✅ Add this import
import bcrypt from "bcryptjs";

async function seed() {
  await connectToDB();

  // Clear existing data
  await Role.deleteMany({});
  await User.deleteMany({});
  await UserAttachedFile.deleteMany({});
  await EvaluationProgram.deleteMany({});
  await WeeklyEvaluation.deleteMany({});
  await accesscontrolform.deleteMany({});
  await useraccesscontrol.deleteMany({});

  // Create roles
  const roles = await Role.insertMany([
    { name: "Super Admin", description: "Super Admin" },
    // { name: "Management", description: "Management" },
    // { name: "HR", description: "HR" },
    // { name: "Staff", description: "Team" },
    // { name: "Temp Staff", description: "Temp Team" },
  ]);

  const roleMap = {};
  roles.forEach((r) => (roleMap[r.name] = r._id));

  // Create default user (Super Admin)
  const users = await User.insertMany([
    {
      firstName: "Muhammad",
      lastName: "Nabeekh",
      primaryEmail: "admin@greyloops.com",
      secondaryEmail: "",
      fatherName: "",
      phone: "",
      emergencyContact: "",
      emergencyRelation: "",
      cnic: "",
      role: roleMap["Super Admin"],
      joiningDate: new Date("2020-01-01"),
      medicalCondition: "",
      jd: "Vision & Strategy",
      exp: "",
      password: await bcrypt.hash("123456", 10),
      isActive: true,
      created_at: new Date(),
    },
  ]);

  const superAdmin = users[0];

  // Insert Evaluation Programs (KPIs)
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

  // ✅ Insert Access Control Forms and store their IDs
  const accessForms = await accesscontrolform.insertMany([
    { name: "Dashboard", description: "Access to analytics and performance dashboards." },
    { name: "Roles", description: "Manage and assign system roles." },
    { name: "Users", description: "View and update user profile info." },
    { name: "Performance Management", description: "Generate and view detailed reports." },
    { name: "Payroll Setup", description: "Generate and view detailed Payroll." },
  ]);

  // ✅ Create default access for Super Admin (full access to all forms)
  const formAccess = accessForms.map((form) => ({
    formId: form._id,
    fullAccess: true,
    noAccess: false,
    partialAccess: {
      enabled: false,
      permissions: { view: false, edit: false, add: false, delete: false, applyKpi: false, applyIncrement: false },
    },
  }));

  // ✅ Insert useraccesscontrol dynamically
  await useraccesscontrol.create({
    userId: superAdmin._id,
    roleId: superAdmin.role,
    formAccess,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("✅ Database seeded successfully with default access control!");
  console.log("Super Admin ID:", superAdmin._id.toString());
  console.log("Super Admin Role ID:", superAdmin.role.toString());
}

seed().catch((err) => {
  console.error("❌ Seeding error:", err);
  process.exit(1);
});
