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
          {/* img oculta apenas para capturar onError — visual via div abaixo */}
          <img
            src={siteConfig.branding.loginImage}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="sr-only"
            onError={() => setImageFailed(true)}
            aria-hidden
          />
          {/* Arquivo estático em public/ — troque login.png sem restart nem env */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${siteConfig.branding.loginImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center center",
              backgroundRepeat: "no-repeat",
            }}
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
