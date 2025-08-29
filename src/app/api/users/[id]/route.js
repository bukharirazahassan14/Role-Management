import connectToDB from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req, context) {
  await connectToDB();

  // ✅ params must be awaited in Next.js 14
  const { id } = await context.params;

  const user = await User.findById(id).populate("role");
  if (!user) return new Response("User not found", { status: 404 });

  return Response.json(user);
}

export async function PUT(req, context) {
  await connectToDB();

  const { id } = await context.params; // ✅ await params

  const body = await req.json();
  const user = await User.findByIdAndUpdate(id, body, { new: true });
  if (!user) return new Response("User not found", { status: 404 });

  return Response.json(user);
}
