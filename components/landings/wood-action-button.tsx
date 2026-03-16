"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"

interface WoodActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode
}

export function WoodActionButton({ icon, children, className, type = "button", ...props }: WoodActionButtonProps) {
  const baseClassName =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-sm font-black uppercase tracking-wide text-[#f6d5b2d9] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70 max-w-50"

  return (
    <button
      type={type}
      className={className ? `${baseClassName} ${className}` : baseClassName}
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(35,18,8,0.52) 0%, rgba(35,18,8,0.72) 100%), url('/images/header/top-bar.png')",
        backgroundSize: "auto",
        backgroundPosition: "center",
      }}
      {...props}
    >
      {icon}
      {children}
    </button>
  )
}

