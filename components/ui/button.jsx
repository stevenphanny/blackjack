import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#c9a84c] text-[#0a0f0a] rounded-full px-5 py-2 font-semibold hover:bg-[#dbb85c] transition-colors",
        bet_numbers: "border border-[#c9a84c]/50 bg-transparent text-[#c9a84c] rounded-full px-4 py-1 w-14 font-semibold hover:bg-[#c9a84c]/10 transition-colors",
        circular_hollow: "border border-[#c9a84c] bg-transparent text-[#c9a84c] rounded-full w-9 h-9 p-0 hover:bg-[#c9a84c]/15 transition-colors text-sm font-bold",
        hit_stand: "bg-white/10 border border-white/20 text-white rounded-full px-6 py-2 font-semibold hover:bg-white/20 hover:border-white/40 transition-all w-24",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-white/20 bg-white/5 text-white shadow-xs hover:bg-white/10 hover:border-white/40 transition-colors",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-white/8 text-white/70 hover:text-white transition-colors",
        link: "text-[#c9a84c] underline-offset-4 hover:underline",
        badge: "bg-white/8 text-white/80 border border-white/15 rounded-full px-4 py-1 text-xs font-semibold hover:bg-white/15 hover:text-white transition-colors",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
