import Link from "next/link"
import { siteConfig } from "@/lib/site-config"

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 prose dark:prose-invert">
      <h1>Política de privacidade (LGPD)</h1>
      <p>
        {siteConfig.name} trata dados pessoais conforme a Lei 13.709/2018. Controlador:{" "}
        {siteConfig.company}. Contato: {siteConfig.supportEmail}.
      </p>
      <Link href="/" className="text-primary hover:underline">
        Voltar
      </Link>
    </div>
  )
}
