"use client"

import { SWRConfig } from "swr"
import { AuthProvider } from "@/components/providers/auth-provider"
import { TenantProvider } from "@/components/providers/tenant-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "sonner"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SWRConfig
        value={{
          revalidateOnFocus: false,
          dedupingInterval: 5000,
          keepPreviousData: true,
        }}
      >
        <AuthProvider>
          <TenantProvider>
            {children}
            <Toaster richColors position="top-right" closeButton />
          </TenantProvider>
        </AuthProvider>
      </SWRConfig>
    </ThemeProvider>
  )
}
