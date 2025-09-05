import connectToDB from "@/lib/mongodb.js";
import Role from "@/models/Role.js";

export async function GET(req) {
  try {
    await connectToDB();

    const roles = await Role.find().lean();

    const formatted = roles.map((r) => ({
      _id: r._id.toString(),
      name: r.name,
      
    }));

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
