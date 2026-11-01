import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Superfícies reutilizáveis.
 * - `default`: telas comuns (fora do canvas de vidro).
 * - `glass` / `glass-strong` / `glass-subtle`: só dentro de `.dashboard-canvas`
 *   (tokens `--glass-*`). Nunca aninhar `glass`/`glass-strong` um dentro do outro.
 */
const cardVariants = cva("text-card-foreground", {
  variants: {
    variant: {
      default: "rounded-xl border border-border/80 bg-card shadow-sm",
      glass: "glass",
      "glass-subtle": "glass-subtle",
      "glass-strong": "glass-strong",
    },
    size: {
      /** Padding padrão dos slots Header/Content (`--card-pad`). */
      default: "[--card-pad:1.25rem] md:[--card-pad:1.5rem]",
      sm: "[--card-pad:1rem]",
      lg: "[--card-pad:1.75rem]",
      none: "[--card-pad:0px]",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
})

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant, size }), className)} {...props} />
  ),
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-[var(--card-pad,1.5rem)]", className)}
      {...props}
    />
  ),
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-base font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  ),
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-[var(--card-pad,1.5rem)] pb-[var(--card-pad,1.5rem)] pt-0", className)}
      {...props}
    />
  ),
)
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, cardVariants }
export type { CardProps }
