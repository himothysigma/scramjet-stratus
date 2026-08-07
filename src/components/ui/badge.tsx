import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-[#ec4899] focus-visible:ring-[#ec4899]/50 focus-visible:ring-[3px] aria-invalid:ring-[#ef4444]/20 dark:aria-invalid:ring-[#ef4444]/40 aria-invalid:border-[#ef4444] transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#ec4899] text-[#ec4899]-foreground [a&]:hover:bg-[#ec4899]/90",
        secondary:
          "border-transparent bg-[#1a1a1a] text-[#f0f0f0] [a&]:hover:bg-[#1a1a1a]/90",
        destructive:
          "border-transparent bg-[#ef4444] text-white [a&]:hover:bg-[#ef4444]/90 focus-visible:ring-[#ef4444]/20 dark:focus-visible:ring-[#ef4444]/40 dark:bg-[#ef4444]/60",
        outline:
          "text-[#f0f0f0] [a&]:hover:bg-[#1a1a1a] [a&]:hover:text-[#f0f0f0]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
