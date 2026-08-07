"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, Loader2, Trash2, User } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Message = { role: "user" | "assistant"; content: string }

export function AIPanel() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: "user", content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (data.response) {
        setMessages([...newMessages, { role: "assistant", content: data.response }])
      } else {
        toast.error(data.error || "AI failed to respond")
      }
    } catch {
      toast.error("Connection error")
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setMessages([])
    toast.info("Conversation cleared")
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="h-11 shrink-0 px-4 flex items-center justify-between border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
            <Bot className="h-4 w-4 text-pink-500" />
          </div>
          <span className="font-semibold text-[#f0f0f0]">Synnical AI</span>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-[#888888]" onClick={clear}>
            <Trash2 className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scroll px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="h-14 w-14 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-3">
              <Bot className="h-7 w-7 text-pink-500" />
            </div>
            <h2 className="text-lg font-semibold text-[#f0f0f0]">Synnical AI Assistant</h2>
            <p className="text-sm text-[#888888] mt-1 max-w-xs">
              Ask me anything — gaming tips, coding help, general questions, or how to use Synnical.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-4 max-w-sm">
              {["How do I verify ownership?", "Best strategy for 2048?", "Write a Python function", "What can I do here?"].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs px-3 py-2 rounded-lg border border-[#2a2a2a] bg-[#121212] hover:border-pink-500/40 hover:bg-[#1a1a1a] transition-colors text-[#888888] hover:text-[#f0f0f0]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
            <div className={cn(
              "h-8 w-8 shrink-0 rounded-lg flex items-center justify-center mt-0.5",
              m.role === "user" ? "bg-[#1a1a1a]" : "bg-pink-500/10 border border-pink-500/20"
            )}>
              {m.role === "user" ? <User className="h-4 w-4 text-[#888888]" /> : <Bot className="h-4 w-4 text-pink-500" />}
            </div>
            <div className={cn(
              "max-w-[75%] rounded-lg px-3 py-2 text-sm",
              m.role === "user" ? "bg-pink-500 text-white" : "bg-[#121212] border border-[#2a2a2a] text-[#f0f0f0]"
            )}>
              {m.role === "assistant" ? (
                <div className="prose-sm max-w-none [&_a]:text-pink-500 [&_a]:underline [&_code]:bg-[#0a0a0a] [&_code]:px-1 [&_code]:rounded [&_pre]:bg-[#0a0a0a] [&_pre]:p-2 [&_pre]:rounded">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                    a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
                  }}>
                    {m.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mt-0.5">
              <Bot className="h-4 w-4 text-pink-500" />
            </div>
            <div className="bg-[#121212] border border-[#2a2a2a] rounded-lg px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 p-3 border-t border-[#2a2a2a]">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask Synnical AI anything…"
            disabled={loading}
            className="flex-1 bg-[#1a1a1a] border-[#2a2a2a] text-[#f0f0f0]"
          />
          <Button
            onClick={send}
            disabled={loading || !input.trim()}
            className="bg-pink-500 hover:bg-pink-600 text-white"
            size="icon"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
