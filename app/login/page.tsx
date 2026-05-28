import { Suspense } from "react"
import { BrandingBackground } from "@/components/auth/login-branding-panel"
import { RedirectIfAuthenticated } from "@/components/auth/redirect-if-authenticated"
import { LoginForm } from "@/components/auth/login-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function LoginPage() {
  return (
    <BrandingBackground>
      <div className="flex flex-1 items-center justify-center p-4">
        <Suspense fallback={<Skeleton className="h-96 w-full max-w-md bg-background/80" />}>
          <RedirectIfAuthenticated />
          <LoginForm />
        </Suspense>
      </div>
    </BrandingBackground>
  )
}
