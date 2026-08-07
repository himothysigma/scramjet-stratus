import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-[#2a2a2a] placeholder:text-[#888888] focus-visible:border-[#ec4899] focus-visible:ring-[#ec4899]/50 aria-invalid:ring-[#ef4444]/20 dark:aria-invalid:ring-[#ef4444]/40 aria-invalid:border-[#ef4444] dark:bg-[#1a1a1a]/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
