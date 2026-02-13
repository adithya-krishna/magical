import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Lead } from "@/pages/leads/types"

type LeadEditTabProps = {
  lead: Lead
  canManage: boolean
  isSaving: boolean
  onSubmit: (payload: Record<string, unknown>) => void
}

export function LeadEditTab({ lead, canManage, isSaving, onSubmit }: LeadEditTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit lead details</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!canManage) return
            const formData = new FormData(event.currentTarget)
            onSubmit({
              firstName: String(formData.get("firstName") ?? ""),
              lastName: String(formData.get("lastName") ?? ""),
              phone: String(formData.get("phone") ?? ""),
              email: String(formData.get("email") ?? "") || undefined,
              area: String(formData.get("area") ?? "") || undefined,
              community: String(formData.get("community") ?? "") || undefined,
              address: String(formData.get("address") ?? "") || undefined,
              guardianName: String(formData.get("guardianName") ?? "") || undefined,
              age: formData.get("age") ? Number(formData.get("age")) : undefined,
              source: String(formData.get("source") ?? "") || undefined,
              interest: String(formData.get("interest") ?? "") || undefined,
              expectedBudget: Number(formData.get("expectedBudget") ?? 0),
              notes: String(formData.get("notes") ?? "") || undefined,
            })
          }}
        >
          <div className="space-y-1">
            <Label>First name</Label>
            <Input name="firstName" defaultValue={lead.firstName} disabled={!canManage} />
          </div>
          <div className="space-y-1">
            <Label>Last name</Label>
            <Input name="lastName" defaultValue={lead.lastName} disabled={!canManage} />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input name="phone" defaultValue={lead.phone} disabled={!canManage} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input name="email" type="email" defaultValue={lead.email ?? ""} disabled={!canManage} />
          </div>
          <div className="space-y-1">
            <Label>Area</Label>
            <Input name="area" defaultValue={lead.area ?? ""} disabled={!canManage} />
          </div>
          <div className="space-y-1">
            <Label>Community</Label>
            <Input name="community" defaultValue={lead.community ?? ""} disabled={!canManage} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Address</Label>
            <Input name="address" defaultValue={lead.address ?? ""} disabled={!canManage} />
          </div>
          <div className="space-y-1">
            <Label>Guardian name</Label>
            <Input name="guardianName" defaultValue={lead.guardianName ?? ""} disabled={!canManage} />
          </div>
          <div className="space-y-1">
            <Label>Age</Label>
            <Input name="age" type="number" min={0} max={120} defaultValue={lead.age ?? ""} disabled={!canManage} />
          </div>
          <div className="space-y-1">
            <Label>Source</Label>
            <Input name="source" defaultValue={lead.source ?? ""} disabled={!canManage} />
          </div>
          <div className="space-y-1">
            <Label>Interested instrument</Label>
            <Input name="interest" defaultValue={lead.interest ?? ""} disabled={!canManage} />
          </div>
          <div className="space-y-1">
            <Label>Expected budget</Label>
            <Input name="expectedBudget" type="number" min={0} defaultValue={String(lead.expectedBudget ?? 0)} disabled={!canManage} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Profile notes</Label>
            <Textarea name="notes" defaultValue={lead.notes ?? ""} disabled={!canManage} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={!canManage || isSaving}>
              Save edits
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
