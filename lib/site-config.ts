export const siteConfig = {
  name: "TSV Transportes",
  shortName: "TSV Transportes",
  tagline: "The Monkeys — a tecnologia no seu dia a dia",
  description:
    "Plataforma de gestão e operação logística para transportadoras — frota, fretes, motoristas e indicadores em tempo real.",
  company: "The Monkeys",
  /** Site institucional — landing oficial da organização */
  companyWebsite: "https://v0-neurallink-landingpage-opal.vercel.app/",
  locale: "pt-BR",
  currency: "BRL",
  supportEmail: "suporte@themonkeys.com.br",
  demoTenantSlug: "demo-transportadora",
  branding: {
    /**
     * Troque só o arquivo `public/branding/login.jpg` (mesmo nome).
     * Override opcional: NEXT_PUBLIC_LOGIN_IMAGE=/branding/outra-foto.jpg
     */
    loginImage: process.env.NEXT_PUBLIC_LOGIN_IMAGE ?? "/branding/login.jpg",
    loginImageAlt: "TSV Transportes — gestão logística",
  },
} as const
