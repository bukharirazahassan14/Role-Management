
//api/UserAccessControl/insertdefaultaccess/route.js

import connectToDB from "@/lib/mongodb.js";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    // ✅ Connect to MongoDB
    const mongooseConn = await connectToDB();
    const db = mongooseConn.connection.db || mongooseConn.db;

    // ✅ Parse request body
    const body = await req.json();
    const { userId, roleId } = body;

    if (!userId || !roleId) {
      return new Response(JSON.stringify({ error: "❌ userId and roleId are required." }), {
        status: 400,
      });
    }

    // ✅ Fetch all forms from lowercase collection
    const forms =
      (await db.collection("accesscontrolform").find({}, { projection: { _id: 1, name: 1 } }).toArray()) || [];

    if (forms.length === 0) {
      return new Response(JSON.stringify({ error: "⚠️ No forms found in accesscontrolform collection!" }), {
        status: 404,
      });
    }

    // ✅ Build formAccess array
    const formAccessArray = forms.map((form, index) => {
      if (index === 0) {
        // Dashboard
        return {
          formId: form._id,
          fullAccess: true,
          noAccess: false,
          partialAccess: {
            enabled: false,
            permissions: { view: false, edit: false, add: false, delete: false, applyKpi: false, applyIncrement: false, applyGAP: false, applyRPT: false },
          },
        };
      } else if (index === 1) {
        // Roles
        return {
          formId: form._id,
          fullAccess: false,
          noAccess: false,
          partialAccess: {
            enabled: true,
            permissions: { view: true, edit: false, add: false, delete: false, applyKpi: false , applyIncrement: false, applyGAP: false, applyRPT: false },
          },
        };
      } else if (index === 2) {
        // Profile
        return {
          formId: form._id,
          fullAccess: false,
          noAccess: false,
          partialAccess: {
            enabled: true,
            permissions: { view: true, edit: true, add: false, delete: false, applyKpi: false , applyIncrement: false, applyGAP: false, applyRPT: false },
          },
        };
      } else {
        // Report or other forms
        return {
          formId: form._id,
          fullAccess: false,
          noAccess: false,
          partialAccess: {
            enabled: true,
            permissions: { view: true, edit: false, add: false, delete: false, applyKpi: true, applyIncrement: false, applyGAP: false, applyRPT: false },
          },
        };
      }
    });

    // ✅ Final document
    const doc = {
      userId: new ObjectId(userId),
      roleId: new ObjectId(roleId),
      formAccess: formAccessArray,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // ✅ Insert into useraccesscontrol
    const result = await db.collection("useraccesscontrol").insertOne(doc);

    // ✅ Success response
    return new Response(
      JSON.stringify({
        message: "✅ UserAccessControl created successfully",
        insertedId: result.insertedId,
        formCount: formAccessArray.length,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Insert failed:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
