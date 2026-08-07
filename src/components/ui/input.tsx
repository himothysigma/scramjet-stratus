import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-[#f0f0f0] placeholder:text-[#888888] selection:bg-[#ec4899] selection:text-[#ec4899]-foreground dark:bg-[#1a1a1a]/30 border-[#2a2a2a] flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-[#ec4899] focus-visible:ring-[#ec4899]/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-[#ef4444]/20 dark:aria-invalid:ring-[#ef4444]/40 aria-invalid:border-[#ef4444]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
