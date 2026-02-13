import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhoneInput } from "@/components/ui/phone-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type RequestRole = "staff" | "teacher" | "admin"

export function RequestAccessPage() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000"
  const [roleRequested, setRoleRequested] = useState<RequestRole>("staff")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [phone, setPhone] = useState("")

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Request Access</CardTitle>
            <CardDescription>
              Submit your details for super admin approval. Students are provisioned after
              admissions and do not use this request form.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault()
                setIsSubmitting(true)
                setFeedback(null)
                setError(null)

                const formData = new FormData(event.currentTarget)

                try {
                  const response = await fetch(`${apiUrl}/api/v1/access-requests`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: formData.get("email"),
                      firstName: formData.get("firstName"),
                      lastName: formData.get("lastName"),
                      phone,
                      roleRequested,
                    }),
                  })

                  if (!response.ok) {
                    throw new Error("Unable to submit request")
                  }

                  setFeedback("Request submitted. You will be notified after approval.")
                  event.currentTarget.reset()
                  setRoleRequested("staff")
                  setPhone("")
                } catch {
                  setError("Unable to submit request. Please try again.")
                } finally {
                  setIsSubmitting(false)
                }
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input id="firstName" name="firstName" type="text" required disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input id="lastName" name="lastName" type="text" required disabled={isSubmitting} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required disabled={isSubmitting} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <PhoneInput
                  id="phone"
                  name="phone"
                  defaultCountry="IN"
                  international
                  value={phone}
                  onChange={(value) => setPhone(value ?? "")}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roleRequested">Requested role</Label>
                <Select
                  value={roleRequested}
                  onValueChange={(value) => setRoleRequested(value as RequestRole)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="roleRequested">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {feedback ? <p className="text-sm text-emerald-600">{feedback}</p> : null}
              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
