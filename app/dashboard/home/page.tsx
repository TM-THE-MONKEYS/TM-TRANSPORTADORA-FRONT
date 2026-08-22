import { redirect } from "next/navigation"

/** Home legada — redireciona ao Dashboard (landing pós-login efetiva). */
export default function HomePage() {
  redirect("/dashboard")
}
