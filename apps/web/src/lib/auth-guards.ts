import { redirect } from "@tanstack/react-router"
import { authClient } from "@/lib/auth-client"

export async function requireAuthSession() {
  const session = await authClient.getSession()

  if (!session.data?.user || !session.data?.session) {
    throw redirect({ to: "/login" })
  }

  return session.data
}

export async function redirectIfAuthenticated() {
  const session = await authClient.getSession()

  if (session.data?.user && session.data?.session) {
    throw redirect({ to: "/" })
  }
}
