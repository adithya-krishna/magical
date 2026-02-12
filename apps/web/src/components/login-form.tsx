import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type LoginFormValues = {
  email: string
  password: string
}

export function LoginForm({
  onLoginSubmit,
  isPending = false,
  errorMessage,
  requestAccessHref = "/request-access",
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  onLoginSubmit: (values: LoginFormValues) => void
  isPending?: boolean
  errorMessage?: string
  requestAccessHref?: string
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your credentials to access Muzigal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              const formData = new FormData(event.currentTarget)
              onLoginSubmit({
                email: String(formData.get("email") ?? ""),
                password: String(formData.get("password") ?? ""),
              })
            }}
          >
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  disabled={isPending}
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  disabled={isPending}
                  autoComplete="current-password"
                />
              </div>
              {errorMessage ? (
                <p className="text-sm text-destructive">{errorMessage}</p>
              ) : null}
              <Button type="submit" className="w-full">
                {isPending ? "Signing in..." : "Login"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              Need access?{" "}
              <a
                href={requestAccessHref}
                className="underline underline-offset-4"
              >
                Request for access
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
