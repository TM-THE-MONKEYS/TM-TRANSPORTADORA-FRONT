"use client"

import { type ReactNode, useState } from "react"
import { siteConfig } from "@/lib/site-config"
import { cn } from "@/lib/utils"

type BrandingBackgroundProps = {
  children: ReactNode
  className?: string
}

export function BrandingBackground({ children, className }: BrandingBackgroundProps) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <div className={cn("relative min-h-screen overflow-hidden", className)}>
      {!imageFailed ? (
        <>
          {/* Arquivo estático em public/ — troque login.jpg sem restart nem env */}
          <img
            src={siteConfig.branding.loginImage}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setImageFailed(true)}
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/30 to-background/85"
            aria-hidden
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.18),transparent),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--background)))]"
          aria-hidden
        />
      )}

      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  )
}
