import { authClient } from "@/lib/auth-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ProfilePage() {
  const session = authClient.useSession()
  const user = session.data?.user

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Basic account details from your current session.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Name:</span> {user?.name ?? "-"}
          </div>
          <div>
            <span className="font-medium">Email:</span> {user?.email ?? "-"}
          </div>
          <div>
            <span className="font-medium">Role:</span> {(user as { role?: string })?.role ?? "-"}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
