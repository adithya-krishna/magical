import { Link } from "@tanstack/react-router"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { leadTabs } from "@/pages/leads/lead-detail/helpers"

type LeadDetailTabsNavProps = {
  leadId: string
  activeTab: string
}

export function LeadDetailTabsNav({ leadId, activeTab }: LeadDetailTabsNavProps) {
  return (
    <Tabs value={activeTab}>
      <TabsList className="grid w-full max-w-md grid-cols-3">
        {leadTabs.map((item) => (
          <TabsTrigger key={item} value={item} asChild>
            <Link to="/leads/$id/$tab" params={{ id: leadId, tab: item }}>
              {item === "follow-up" ? "Follow-up" : item[0].toUpperCase() + item.slice(1)}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
