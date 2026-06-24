export const siteConfig = {
  name: "TSV Transportes",
  shortName: "TSV Transportes",
  navbarBrand: "The Monkeys | TSV Transportes",
  tagline: "The Monkeys — a tecnologia no seu dia a dia",
  description:
    "Plataforma de gestão e operação logística para transportadoras — frota, fretes, motoristas e indicadores em tempo real.",
  company: "The Monkeys",
  /** Site institucional — landing oficial da organização */
  companyWebsite: "https://www.themonkeys.com.br/",
  locale: "pt-BR",
  currency: "BRL",
  supportEmail: "suporte@themonkeys.com.br",
  demoTenantSlug: "demo-transportadora",
  branding: {
    /**
     * Troque só o arquivo `public/branding/login.png` (mesmo nome).
     * Override opcional: NEXT_PUBLIC_LOGIN_IMAGE=/branding/outra-foto.png
     */
    loginImage: process.env.NEXT_PUBLIC_LOGIN_IMAGE ?? "/branding/login.jpg",
    loginImageAlt: "TSV Transportes — gestão logística",
    /** Navbar: PNG transparente recomendado (tema claro = traços escuros). */
    navbarLogo: process.env.NEXT_PUBLIC_NAVBAR_LOGO ?? "/branding/logo.png",
    /** Navbar tema escuro: traços claros em fundo transparente. */
    navbarLogoDark:
      process.env.NEXT_PUBLIC_NAVBAR_LOGO_DARK ?? "/branding/logo-dark.png",
    navbarLogoAlt: "The Monkeys — TSV Transportes",
  },
} as const
