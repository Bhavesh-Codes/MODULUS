import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex font-heading items-center justify-center gap-2 whitespace-nowrap text-sm font-bold ring-offset-background transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#FFD600] text-[#0A0A0A] border-[3px] border-[#0A0A0A] shadow-[6px_6px_0px_#0A0A0A] hover:translate-x-[6px] hover:translate-y-[6px] hover:shadow-none rounded-[14px]",
        secondary:
          "bg-[#FFFFFF] text-[#0A0A0A] border-[2px] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none rounded-[14px]",
        destructive:
          "bg-[#FF3B30] text-[#FFFFFF] border-[2px] border-[#0A0A0A] shadow-[4px_4px_0px_#0A0A0A] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none rounded-[14px]",
        ghost: "hover:bg-accent hover:text-accent-foreground rounded-[14px]",
        link: "text-primary underline-offset-4 hover:underline rounded-[14px]",
      },
      size: {
        default: "h-12 px-6 py-2 text-[16px]",
        sm: "h-9 rounded-md px-3",
        lg: "h-14 rounded-md px-8 text-[18px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
