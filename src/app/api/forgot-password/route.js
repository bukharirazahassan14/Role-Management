export async function POST(req) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ message: "❌ Email is required" }),
        { status: 400 }
      );
    }

    // For now, just return a test message
    return new Response(
      JSON.stringify({ message: `👋 Welcome Greyloops! Reset link will be sent to ${email}` }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ message: "⚠️ Something went wrong" }),
      { status: 500 }
    );
  }
}
