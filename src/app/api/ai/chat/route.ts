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

    // Dynamic import — avoids build-time issues if SDK isn't available
    const ZAI = (await import("z-ai-web-dev-sdk")).default
    const zai = await ZAI.create()

    const fullMessages = [
      {
        role: "assistant",
        content: systemPrompt || "You are Synnical AI, a helpful assistant built into the Synnical platform. You help users with gaming, coding, general questions, and using the platform. Be concise and friendly. Use markdown for formatting."
      },
      ...messages.slice(-20)
    ]

    const completion = await zai.chat.completions.create({
      messages: fullMessages,
      thinking: { type: "disabled" },
    })

    const response = completion.choices[0]?.message?.content

    if (!response || response.trim().length === 0) {
      return NextResponse.json({ error: "Empty AI response" }, { status: 500 })
    }

    return NextResponse.json({ response })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[ai/chat] Error:", msg)
    // Return a helpful error instead of crashing
    if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED") || msg.includes("Configuration file not found")) {
      return NextResponse.json({
        error: "AI is not available on this server. The AI feature requires the z-ai-web-dev-sdk config which is only available in certain environments."
      }, { status: 503 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
