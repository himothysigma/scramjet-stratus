"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-[#2a2a2a] dark:bg-[#1a1a1a]/30 data-[state=checked]:bg-[#ec4899] data-[state=checked]:text-[#ec4899]-foreground dark:data-[state=checked]:bg-[#ec4899] data-[state=checked]:border-[#ec4899] focus-visible:border-[#ec4899] focus-visible:ring-[#ec4899]/50 aria-invalid:ring-[#ef4444]/20 dark:aria-invalid:ring-[#ef4444]/40 aria-invalid:border-[#ef4444] size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
