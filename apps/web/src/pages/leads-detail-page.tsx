import { useParams } from "@tanstack/react-router"
import { LeadDetailPage } from "@/pages/leads/lead-detail-page"

export function LeadsDetailPage() {
  const { id, tab } = useParams({ strict: false }) as { id: string; tab: string }
  return <LeadDetailPage id={id} tab={tab} />
}
