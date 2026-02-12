import { Loader2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { Lead } from "@/pages/leads/types"

function formatDate(value?: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString()
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 border-b py-2 text-sm last:border-b-0">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words">{value || "-"}</span>
    </div>
  )
}

type LeadDetailsSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: Lead | null
  isLoading: boolean
}

export function LeadDetailsSheet({
  open,
  onOpenChange,
  lead,
  isLoading,
}: LeadDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Lead details</SheetTitle>
          <SheetDescription>
            {lead ? `${lead.firstName} ${lead.lastName}` : "Review lead information"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 rounded-md border">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" /> Loading lead details...
            </div>
          ) : lead ? (
            <div className="p-4">
              <DetailRow label="Name" value={`${lead.firstName} ${lead.lastName}`} />
              <DetailRow label="Email" value={lead.email ?? "-"} />
              <DetailRow label="Phone" value={lead.phone} />
              <DetailRow label="Interest" value={lead.interest ?? "-"} />
              <DetailRow label="Source" value={lead.source ?? "-"} />
              <DetailRow
                label="Follow-up"
                value={`${formatDate(lead.followUpDate)} (${lead.followUpStatus})`}
              />
              <DetailRow label="Created" value={formatDate(lead.createdAt)} />
              <DetailRow label="Updated" value={formatDate(lead.updatedAt)} />
              <DetailRow label="Notes" value={lead.notes ?? "-"} />
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">Lead not found.</div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
