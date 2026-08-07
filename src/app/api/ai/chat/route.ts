import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 })
    }

    const fullMessages = [
      {
        role: "system",
        content: systemPrompt || "You are Synnical AI, a helpful assistant built into the Synnical platform. You help users with gaming, coding, general questions, and using the platform. Be concise and friendly. Use markdown for formatting."
      },
      ...messages.slice(-20).map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }))
    ]

    // Try OpenAI first (works on any host)
    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: fullMessages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })
      if (!res.ok) {
        const err = await res.text()
        return NextResponse.json({ error: `OpenAI error: ${err.slice(0, 200)}` }, { status: 502 })
      }
      const data = await res.json()
      const response = data.choices?.[0]?.message?.content
      if (response && response.trim().length > 0) {
        return NextResponse.json({ response })
      }
      return NextResponse.json({ error: "Empty OpenAI response" }, { status: 500 })
    }

    // Fallback: try z-ai SDK (only works in Z.ai sandbox)
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: fullMessages.map(m => ({ role: m.role === "system" ? "assistant" : m.role, content: m.content })),
        thinking: { type: "disabled" },
      })
      const response = completion.choices[0]?.message?.content
      if (response && response.trim().length > 0) {
        return NextResponse.json({ response })
      }
    } catch {
      // z-ai not available
    }

    return NextResponse.json({
      error: "AI not configured. Set OPENAI_API_KEY environment variable."
    }, { status: 503 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[ai/chat] Error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
