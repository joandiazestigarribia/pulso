"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useCopyFeedback(resetAfterMs = 2000) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    },
    []
  )

  const markCopied = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setCopied(true)
    timeoutRef.current = setTimeout(() => {
      setCopied(false)
      timeoutRef.current = null
    }, resetAfterMs)
  }, [resetAfterMs])

  return { copied, markCopied }
}
