import connectToDB from "../lib/mongodb.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import UserAttachedFile from "../models/UserAttachedFile.js";
import EvaluationProgram from "../models/EvaluationProgram.js"; 
import WeeklyEvaluation from "../models/WeeklyEvaluation.js"; 
import bcrypt from "bcryptjs";

async function seed() {
  await connectToDB();

  // Clear existing data
  await Role.deleteMany({});
  await User.deleteMany({});
  await UserAttachedFile.deleteMany({});
  await EvaluationProgram.deleteMany({});
  await WeeklyEvaluation.deleteMany({});

  // Create roles
  const roles = await Role.insertMany([
    { name: "Super Admin", description: "Has full access to the system" },
    { name: "Management", description: "Manages overall operations" },
    { name: "HR", description: "Handles employee management" },
    { name: "Staff", description: "General staff role" },
    { name: "Temp Staff", description: "Temporary staff with limited access" },
  ]);

  const roleMap = {};
  roles.forEach((r) => (roleMap[r.name] = r._id));

  // Create default user
  const [superAdmin] = await User.insertMany([
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
      isActive: true,
      created_at: new Date(),
    },
  ]);

  // Evaluation Programs (KPIs)
  const programs = await EvaluationProgram.insertMany([
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

  const programMap = {};
  programs.forEach((p) => (programMap[p.Name] = p._id));

  // Helper to calculate weighted rating
  const calcWeighted = (score, weightage) => (score * weightage) / 100;

  // Scores with correct calculation
  const scores = [
    {
      kpiId: programMap["Task Deliverability"],
      score: 4,
      weightage: 30,
    },
    {
      kpiId: programMap["Reliability & Accountability"],
      score: 5,
      weightage: 20,
    },
    {
      kpiId: programMap["Efficiency & Problem Solving"],
      score: 3,
      weightage: 20,
    },
    {
      kpiId: programMap["Growth, Learning & Technical Proficiency"],
      score: 4,
      weightage: 15,
    },
    {
      kpiId: programMap["Communication & Collaboration"],
      score: 5,
      weightage: 15,
    },
  ].map((item) => ({
    ...item,
    weightedRating: calcWeighted(item.score, item.weightage),
  }));

  // Calculate totals
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const totalWeightedRating = scores.reduce(
    (sum, s) => sum + s.weightedRating,
    0
  );

  await WeeklyEvaluation.create({
    _id: "68c0209936e4f6533ce003ab",
    userId: superAdmin._id,
    weekNumber: 1,
    weekStart: new Date("2025-09-02T00:00:00.000Z"),
    weekEnd: new Date("2025-09-08T23:59:59.000Z"),
    scores,
    comments:
      "Great performance overall, but needs improvement in problem solving.",
    totalScore,
    totalWeightedRating,
    evaluatedBy: superAdmin._id,
    created_at: new Date("2025-09-09T12:30:00.000Z"),
  });

  console.log("✅ Seeding completed with calculated weighted ratings!");
  process.exit(0);
}

seed();
