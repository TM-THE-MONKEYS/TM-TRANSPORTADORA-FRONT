import { redirect } from "next/navigation"

/** Fluxo legado — conta agora é criada em /dashboard/motoristas/novo. */
export default function NovaContaMotoristaPage() {
  redirect("/dashboard/motoristas/novo")
}
