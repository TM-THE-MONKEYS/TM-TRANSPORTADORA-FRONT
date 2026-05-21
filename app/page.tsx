import Link from "next/link"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/lib/site-config"
import { Truck } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2 font-semibold">
          <Truck className="h-6 w-6 text-primary" />
          {siteConfig.name}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/cadastro">Começar grátis</Link>
          </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
          Gestão completa para transportadoras de caminhão
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Frota, fretes, motoristas, indicadores operacionais e controle logístico em um SaaS
          multi-tenant profissional.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/cadastro">Criar conta</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Acessar painel</Link>
          </Button>
        </div>
        <p className="mt-12 text-sm text-muted-foreground">
          Demo: admin@demo.tm / demo1234
        </p>
      </main>
    </div>
  )
}
