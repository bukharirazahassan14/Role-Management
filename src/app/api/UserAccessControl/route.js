//app/api/UserAccessControl/route.js
import connectToDB from "@/lib/mongodb.js";
import AccessControlForm from "@/models/accesscontrolform.js";

export async function GET(req) {
  try {
    await connectToDB();

    const forms = await AccessControlForm.find().lean();

    const formatted = forms.map((f) => ({
      _id: f._id.toString(),
      name: f.name,
      description: f.description,
    }));

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error fetching access control forms:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
