"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"

interface WoodActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
  variant?: "wood" | "neonPink" | "neonGreen"
}

export function WoodActionButton({
  icon,
  children,
  className,
  type = "button",
  variant = "wood",
  ...props
}: WoodActionButtonProps) {
  const baseClassName =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-black uppercase tracking-wide transition hover:brightness-110 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 max-w-50"

  const variantClassName: Record<NonNullable<WoodActionButtonProps["variant"]>, string> = {
    wood: "border-[#7a4c2a]/50 text-[#f6d5b2d9]",
    neonPink: "border-[#1a1a1a] bg-gradient-to-r from-[#ff2a6d] to-[#ffe600] text-black shadow-[0_10px_24px_rgba(0,0,0,0.5)]",
    neonGreen: "border-[#1a1a1a] bg-gradient-to-r from-[#00ff66] to-[#00f0ff] text-black shadow-[0_10px_24px_rgba(0,0,0,0.5)]",
  }

  const buttonClassName = className
    ? `${baseClassName} ${variantClassName[variant]} ${className}`
    : `${baseClassName} ${variantClassName[variant]}`

  const woodStyle =
    variant === "wood"
      ? {
          backgroundImage:
            "linear-gradient(180deg, rgba(35,18,8,0.52) 0%, rgba(35,18,8,0.72) 100%), url('/images/header/top-bar.png')",
          backgroundSize: "auto",
          backgroundPosition: "center",
        }
      : undefined

  return (
    <button
      type={type}
      className={buttonClassName}
      style={woodStyle}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}
