"use client"

import { AuthProvider } from "@/components/providers/auth-provider"
import { TenantProvider } from "@/components/providers/tenant-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "sonner"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TenantProvider>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </TenantProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
