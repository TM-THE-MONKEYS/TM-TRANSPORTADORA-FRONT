import { Suspense } from "react"
import { RedirectIfAuthenticated } from "@/components/auth/redirect-if-authenticated"
import { RegisterForm } from "@/components/auth/register-form"
import { Skeleton } from "@/components/ui/skeleton"

export default function CadastroPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.12),transparent)] p-4">
      <Suspense fallback={<Skeleton className="h-96 w-full max-w-md" />}>
        <RedirectIfAuthenticated />
        <RegisterForm />
      </Suspense>
    </div>
  )
}
