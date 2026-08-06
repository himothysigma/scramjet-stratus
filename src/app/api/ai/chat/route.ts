import { NextRequest, NextResponse } from "next/server"
import ZAI from "z-ai-web-dev-sdk"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 30

// POST /api/ai/chat — AI assistant with conversation history
// body: { messages: [{role, content}], systemPrompt? }
export async function POST(req: NextRequest) {
  try {
    const { messages, systemPrompt } = await req.json()

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 })
    }

    const zai = await ZAI.create()

    const fullMessages = [
      {
        role: "assistant",
        content: systemPrompt || "You are Synnical AI, a helpful assistant built into the Synnical platform. You help users with gaming, coding, general questions, and using the platform. Be concise and friendly. Use markdown for formatting."
      },
      ...messages.slice(-20) // Keep last 20 messages for context
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
    console.error("[ai/chat] Error:", e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI error" },
      { status: 500 }
    )
  }
}
