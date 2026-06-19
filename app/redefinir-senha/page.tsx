import { Suspense } from "react"
import { BrandingBackground } from "@/components/auth/login-branding-panel"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function RedefinirSenhaPage() {
  return (
    <BrandingBackground>
      <div className="flex flex-1 items-center justify-center p-4">
        <Suspense fallback={<Skeleton className="h-96 w-full max-w-md bg-background/80" />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </BrandingBackground>
  )
}
