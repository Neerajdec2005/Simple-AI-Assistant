export default async function handler(req, res) {
  if (req.method === "POST") {
    const { message } = req.body;

    // Forward the message to your Python backend
    try {
      const backendRes = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!backendRes.ok) {
        const errorText = await backendRes.text();
        return res.status(backendRes.status).json({ reply: errorText });
      }

      const data = await backendRes.json();
      return res.status(200).json({ reply: data.reply });
    } catch (error) {
      return res.status(500).json({ reply: "Backend error: " + error.message });
    }
  } else {
    res.status(405).end();
  }
}