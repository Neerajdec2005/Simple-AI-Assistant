// my-ai-frontend/src/app/api/chat/route.js
export async function POST(req) {
  const { message } = await req.json();

  try {
    const backendRes = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text();
      return new Response(JSON.stringify({ reply: errorText }), { status: backendRes.status });
    }

    const data = await backendRes.json();
    return new Response(JSON.stringify({ reply: data.reply }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ reply: "Backend error: " + error.message }), { status: 500 });
  }
}