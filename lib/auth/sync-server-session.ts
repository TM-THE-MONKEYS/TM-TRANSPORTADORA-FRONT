/** Sets httpOnly tmt_session cookie after client login/register. */
export async function syncServerSession(accessToken: string): Promise<void> {
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: accessToken }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? "Não foi possível iniciar a sessão no servidor")
  }
}
