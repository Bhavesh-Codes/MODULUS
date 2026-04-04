import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-[12px] border-[2px] border-[#0A0A0A] bg-[#FFFFFF] px-4 py-2 text-[16px] font-sans ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#999990] placeholder:font-mono focus-visible:outline-none focus-visible:shadow-[4px_4px_0px_#0A0A0A] disabled:cursor-not-allowed disabled:opacity-50 transition-shadow duration-150",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
