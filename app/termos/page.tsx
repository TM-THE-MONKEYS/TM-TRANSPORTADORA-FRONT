import Link from "next/link"
import { siteConfig } from "@/lib/site-config"

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 prose dark:prose-invert">
      <h1>Termos de uso</h1>
      <p>{siteConfig.name} — operado por {siteConfig.company}.</p>
      <p className="text-muted-foreground">
        Documento legal completo será publicado antes do go-live em produção.
      </p>
      <Link href="/" className="text-primary hover:underline">
        Voltar
      </Link>
    </div>
  )
}
