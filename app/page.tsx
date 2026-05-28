import Link from "next/link"
import { BrandingBackground } from "@/components/auth/login-branding-panel"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/lib/site-config"
import { MapPin, Package, Truck, Users } from "lucide-react"

const highlights = [
  { icon: Truck, label: "Frota e disponibilidade" },
  { icon: Users, label: "Motoristas e documentação" },
  { icon: Package, label: "Ordens de frete" },
  { icon: MapPin, label: "Rastreamento em tempo real" },
]

export default function HomePage() {
  return (
    <BrandingBackground>
      <header className="flex h-16 items-center justify-between border-b border-border/60 bg-background/75 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Truck className="h-5 w-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold leading-tight tracking-tight">{siteConfig.name}</p>
            <p className="text-xs text-muted-foreground">
              <a
                href={siteConfig.companyWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground/80 underline-offset-2 transition-colors hover:text-primary hover:underline"
              >
                {siteConfig.company}
              </a>
              {" — a tecnologia no seu dia a dia"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="mb-4 inline-flex rounded-full border border-primary/20 bg-background/70 px-4 py-1 text-xs font-medium uppercase tracking-wider text-primary backdrop-blur-sm">
          Operação logística inteligente
        </p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Sua transportadora sob controle,{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            do pátio à entrega
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground md:text-xl">
          {siteConfig.description}
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button size="lg" variant="outline" className="min-w-[160px] bg-background/70 backdrop-blur-sm" asChild>
            <Link href="/login">Acessar painel</Link>
          </Button>
        </div>

        <ul className="mt-14 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {highlights.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-background/70 px-3 py-4 text-sm text-muted-foreground backdrop-blur-sm"
            >
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              <span>{label}</span>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-xs text-muted-foreground">
          Desenvolvido e suportado pela{" "}
          <a
            href={siteConfig.companyWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground/80 underline-offset-2 transition-colors hover:text-primary hover:underline"
          >
            {siteConfig.company}
          </a>
        </p>
      </main>
    </BrandingBackground>
  )
}
