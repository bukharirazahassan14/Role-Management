import connectToDB from "../lib/mongodb.js";
import { ObjectId } from "mongodb";

async function seedOther() {
  const db = await connectToDB();
  const database = db.connection.db; // Native MongoDB DB

  try {
    // ================================
    // 1️⃣ INSERT INTO accesscontrolform
    // ================================
    console.log("⚙️ Inserting accesscontrolform...");

    await database.collection("accesscontrolform").insertOne({
      _id: ObjectId("691b39d92a4c41387df83c0f"),
      name: "Payroll Setup",
      description: "Generate and view detailed Payroll.",
      __v: 0
    });

    console.log("✅ accesscontrolform inserted!");

    // =====================================================
    // 2️⃣ UPDATE useraccesscontrol → PUSH missing formAccess
    // =====================================================
    console.log("⚙️ Updating useraccesscontrol...");

    await database.collection("useraccesscontrol").updateMany(
      {
        // Only add if formAccess does NOT already contain it
        "formAccess.formId": {
          $ne: ObjectId("691b39d92a4c41387df83c0f")
        }
      },
      {
        $push: {
          formAccess: {
            formId: ObjectId("691b39d92a4c41387df83c0f"),
            fullAccess: false,
            noAccess: false,
            partialAccess: {
              enabled: true,
              permissions: {
                view: true,
                edit: false,
                add: false,
                delete: false,
                applyKpi: true,
                applyIncrement: false
              }
            }
          }
        }
      }
    );

    console.log("✅ useraccesscontrol updated!");

    // ================================
    // 3️⃣ SEED ALLOWANCES
    // ================================
    const allowances = [
      { name: "House Rent Allowance", amount: 0 },
      { name: "Medical Allowance", amount: 0 },
      { name: "Conveyance / Transport Allowance", amount: 0 },
      { name: "Utility Allowance", amount: 0 },
      { name: "Fuel Allowance", amount: 0 },
      { name: "Internet Allowance", amount: 0 },
      { name: "Technical Allowance", amount: 0 },
      { name: "Project Allowance", amount: 0 },
      { name: "On-Call Allowance", amount: 0 },
      { name: "Shift Allowance", amount: 0 },
      { name: "Performance Allowance", amount: 0 },
      { name: "Incentive Allowance", amount: 0 },
      { name: "Monthly Bonus Allowance", amount: 0 },
      { name: "Attendance Allowance", amount: 0 },
      { name: "Mobile Allowance", amount: 0 },
      { name: "Meal Allowance", amount: 0 },
      { name: "Remote Work Allowance", amount: 0 },
      { name: "Laptop / Equipment Allowance", amount: 0 },
      { name: "Communication Allowance", amount: 0 },
      { name: "Skill Development Allowance", amount: 0 },
      { name: "Overtime", amount: 0 }
    ];

    await database.collection("allowances").deleteMany({});
    await database.collection("allowances").insertMany(allowances);
    console.log("✅ Allowances seeded!");

    // ================================
    // 4️⃣ SEED DEDUCTIONS
    // ================================
    const deductions = [
      { name: "Income Tax", amount: 0 },
      { name: "EOBI", amount: 0 },
      { name: "Social Security", amount: 0 },
      { name: "Late Arrival", amount: 0 },
      { name: "Absence / LWP", amount: 0 },
      { name: "Half-Day Deduction", amount: 0 },
      { name: "Short-Hours Deduction", amount: 0 },
      { name: "Penalties", amount: 0 },
      { name: "Loan Installments", amount: 0 },
      { name: "Advance Salary Recovery", amount: 0 },
      { name: "Asset Recovery", amount: 0 },
      { name: "Equipment Damage Recovery", amount: 0 },
      { name: "Lost Card / ID", amount: 0 },
      { name: "Training Cost Recovery", amount: 0 },
      { name: "Health Insurance Share", amount: 0 },
      { name: "Provident Fund", amount: 0 },
      { name: "Meal Charges", amount: 0 },
      { name: "Transport Charges", amount: 0 },
      { name: "Internet / Mobile Charges", amount: 0 },
      { name: "Gym / Fitness Deduction", amount: 0 }
    ];

    await database.collection("deductions").deleteMany({});
    await database.collection("deductions").insertMany(deductions);
    console.log("✅ Deductions seeded!");

    console.log("🎉 All seed operations completed successfully!");

  } catch (err) {
    console.error("❌ Seeding error:", err);
  } finally {
    await db.connection.close();
    console.log("🔒 MongoDB connection closed");
  }
}

// Function to add "Assets" form to all users
// ================================
export async function updateAssets() {
  const db = await connectToDB();
  const database = db.connection.db;

  try {
    // 1️⃣ Insert "Assets" form (without checking for existence)
    const insertResult = await database.collection("accesscontrolform").insertOne({
      name: "Assets",
      description: "Manage and track company assets.",
    });

    const assetsFormId = insertResult.insertedId;
    console.log("✅ 'Assets' form inserted into accesscontrolform!");

    // 2️⃣ Update all users in useraccesscontrol
    await database.collection("useraccesscontrol").updateMany(
      {
        "formAccess.formId": { $ne: assetsFormId },
      },
      {
        $push: {
          formAccess: {
            formId: assetsFormId,
            fullAccess: true,
            noAccess: false,
            partialAccess: {
              enabled: false,
              permissions: {
                view: false,
                edit: false,
                add: false,
                delete: false,
                applyKpi: false,
                applyIncrement: false,
                applyGAP: false,
                applyRPT: false,
              },
            },
          },
        },
      }
    );

    console.log("✅ All useraccesscontrol records updated with 'Assets'!");
  } catch (err) {
    console.error("❌ updateAssets error:", err);
  } finally {
    await db.connection.close();
    console.log("🔒 MongoDB connection closed");
  }
}


//seedOther();

updateAssets();

//npm install react-icons
//npm install framer-motion@^12.23.24