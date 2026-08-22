import { Suspense } from "react"
import { ForceLightTheme } from "@/components/auth/force-light-theme"
import { BrandingBackground } from "@/components/auth/login-branding-panel"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function EsqueciSenhaPage() {
  return (
    <BrandingBackground>
      <ForceLightTheme />
      <div className="flex flex-1 items-center justify-center p-4">
        <Suspense fallback={<Skeleton className="h-96 w-full max-w-md bg-background/80" />}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </BrandingBackground>
  )
}
