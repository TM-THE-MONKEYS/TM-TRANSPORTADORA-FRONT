import { Suspense } from "react"
import { MapPin, Package, Shield, Truck, Users } from "lucide-react"
import { ForceLightTheme } from "@/components/auth/force-light-theme"
import { LoginForm } from "@/components/auth/login-form"
import { RedirectIfAuthenticated } from "@/components/auth/redirect-if-authenticated"
import { Skeleton } from "@/components/ui/skeleton"
import { siteConfig } from "@/lib/site-config"

const highlights = [
  { icon: Truck, label: "Gestão de frota completa" },
  { icon: Users, label: "Motoristas e documentação" },
  { icon: Package, label: "Ordens de frete" },
  { icon: MapPin, label: "Rastreamento em tempo real" },
  { icon: Shield, label: "Segurança e conformidade" },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <ForceLightTheme />
      {/* ── Painel esquerdo — branding hero ── */}
      {/* rounded-r-[2.5rem] + z-10 + shadow criam o efeito de sobreposição na divisória */}
      <div className="relative z-10 hidden w-[55%] flex-col overflow-hidden rounded-r-[2.5rem] shadow-[6px_0_40px_rgba(0,0,0,0.35)] lg:flex">
        {/* Imagem de fundo */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${siteConfig.branding.loginImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
          aria-hidden
        />

        {/* Overlay gradiente escuro */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/65 to-black/45"
          aria-hidden
        />

        {/*
          Distribuição profissional (tipo Stripe/Linear):
          1. Logo ancorado no topo
          2. Copy na faixa superior (~1/3 superior)
          3. Rodapé ancorado embaixo
          Sem justify-center — evita o “bloco flutuando no meio”
        */}
        <div className="relative z-10 flex h-full flex-col px-12 py-10 text-white xl:px-16">
          {/* 1. Logo — topo */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{siteConfig.name}</p>
              <p className="text-xs text-white/60">{siteConfig.company}</p>
            </div>
          </div>

          {/* 2. Copy — começa logo abaixo do logo (usa a parte de cima) */}
          <div className="mt-14 max-w-xl space-y-6 xl:mt-16">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest backdrop-blur-sm">
              Operação logística inteligente
            </div>
            <h1 className="text-4xl font-bold leading-[1.15] tracking-tight xl:text-5xl">
              Sua transportadora sob controle,{" "}
              <span className="text-white/70">do pátio à entrega</span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-white/65">
              {siteConfig.description}
            </p>

            <ul className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
              {highlights.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-white/80">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10">
                    <Icon className="h-4 w-4" />
                  </div>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Rodapé — empurra para o fundo */}
          <p className="mt-auto pt-10 text-xs text-white/35">
            © {new Date().getFullYear()}{" "}
            <a
              href={siteConfig.companyWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:text-white/60 hover:underline"
            >
              {siteConfig.company}
            </a>{" "}
            — Todos os direitos reservados
          </p>
        </div>
      </div>

      {/* ── Painel direito — login (tokens do tema: evita texto claro em fundo claro) ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12 lg:px-16">
        {/* Logo mobile (visível só em telas pequenas) */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Truck className="h-5 w-5" />
          </div>
          <p className="text-lg font-semibold text-foreground">{siteConfig.name}</p>
        </div>

        <div className="w-full max-w-md space-y-6">
          {/* Saudação */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Bem-vindo de volta</h2>
            <p className="text-sm text-muted-foreground">
              Entre com suas credenciais para acessar o painel
            </p>
          </div>

          {/* Formulário de login */}
          <Suspense fallback={<Skeleton className="h-72 w-full" />}>
            <RedirectIfAuthenticated />
            <LoginForm variant="inline" />
          </Suspense>

          <p className="text-center text-xs text-muted-foreground">
            Problemas para acessar?{" "}
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              Contate o suporte
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

