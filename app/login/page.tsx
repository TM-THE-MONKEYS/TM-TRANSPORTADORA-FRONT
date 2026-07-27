import { redirect } from "next/navigation"

/**
 * /login foi consolidado na home (/).
 * Redirecionamento permanente para não quebrar links externos ou bookmarks.
 */
export default function LoginPage() {
  redirect("/")
}
