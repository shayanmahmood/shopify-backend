import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are a friendly shopping assistant for ${
  process.env.STORE_NAME ?? "our store"
}. Keep answers short and helpful. If you don't know something, say so.`;

function corsHeaders(origin: string | null) {
  const allowed = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((s) => s.trim());
  const ok = origin !== null && allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : allowed[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function POST(req: Request) {
  const headers = corsHeaders(req.headers.get("origin"));
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages required" }, { status: 400, headers });
    }

    // Keep the last 20 messages, cap their length, convert to Gemini format
    let contents = messages.slice(-20).map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content).slice(0, 2000) }],
    }));

    // Gemini expects the conversation to start with a user message
    while (contents.length && contents[0].role === "model") contents.shift();
    if (contents.length === 0) {
      return Response.json({ error: "no user message" }, { status: 400, headers });
    }

    const res = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 800,
        thinkingConfig: { thinkingBudget: 0 }, // faster and cheaper for chat
      },
    });

    return Response.json({ reply: res.text ?? "" }, { headers });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong" }, { status: 500, headers });
  }
}