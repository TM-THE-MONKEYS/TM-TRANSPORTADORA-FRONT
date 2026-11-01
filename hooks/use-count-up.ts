"use client"

import { useEffect, useState } from "react"

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return true
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

type UseCountUpOptions = {
  /** Default 700 — rápido o bastante pra sentir, sem atrasar a página. */
  durationMs?: number
  enabled?: boolean
}

/**
 * Interpola `0 → target` uma vez quando `enabled` e o alvo mudam.
 * Respeita `prefers-reduced-motion` (salta pro valor final).
 */
export function useCountUp(target: number, options: UseCountUpOptions = {}) {
  const { durationMs = 700, enabled = true } = options
  const [value, setValue] = useState(enabled ? 0 : target)

  useEffect(() => {
    if (!enabled) {
      setValue(target)
      return
    }
    if (prefersReducedMotion() || !Number.isFinite(target)) {
      setValue(target)
      return
    }

    let frame = 0
    const start = performance.now()
    setValue(0)

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      setValue(target * easeOutCubic(t))
      if (t < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, durationMs, enabled])

  return value
}
