import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDateTime } from "@/pages/leads/lead-detail/helpers"
import type { LeadHistoryItem } from "@/pages/leads/types"

type LeadHistoryTabProps = {
  history: LeadHistoryItem[]
}

export function LeadHistoryTab({ history }: LeadHistoryTabProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Lead history</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-4rem)]">
        <ScrollArea className="h-full rounded-md border p-3">
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="rounded-md border bg-background p-3">
                <p className="text-sm font-medium">{item.eventType.replace(/_/g, " ")}</p>
                <p className="text-xs text-muted-foreground">
                  {item.userFirstName} {item.userLastName} ({item.userRole})
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
              </div>
            ))}
            {!history.length ? (
              <p className="text-sm text-muted-foreground">No changes logged yet.</p>
            ) : null}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
