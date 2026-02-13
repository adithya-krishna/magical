import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { LoginForm } from "@/components/login-form"
import { authClient } from "@/lib/auth-client"

export function LoginPage() {
  const navigate = useNavigate()

  const loginMutation = useMutation({
    mutationFn: async (values: { email: string; password: string }) => {
      return authClient.signIn.email(values)
    },
    onSuccess: async () => {
      await authClient.getSession()
      navigate({ to: "/" })
    },
  })

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm
          isPending={loginMutation.isPending}
          errorMessage={
            loginMutation.error
              ? "Unable to sign in. Double-check your credentials."
              : undefined
          }
          onLoginSubmit={(values) => loginMutation.mutate(values)}
          requestAccessHref="/request-access"
        />
      </div>
    </div>
  )
}
