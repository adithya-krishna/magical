import { CheckCircle2, CircleAlert, Plus, TriangleAlert } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatCurrency,
  formatDateTime,
  getInitials,
} from "@/pages/leads/lead-detail/helpers";
import type { Lead, LeadAlert, LeadTag } from "@/pages/leads/types";

type LeadProfileSidebarProps = {
  lead: Lead;
  tags: LeadTag[];
  alerts: LeadAlert[];
  canManage: boolean;
  tagInput: string;
  stageName?: string;
  onTagInputChange: (value: string) => void;
  onSaveTags: () => void;
};

export function LeadProfileSidebar({
  lead,
  tags,
  alerts,
  canManage,
  tagInput,
  stageName,
  onTagInputChange,
  onSaveTags,
}: LeadProfileSidebarProps) {
  return (
    <div className="h-full min-h-[80vh] overflow-y-auto bg-background px-5 py-5">
      <div className="flex items-start justify-between">
        <div />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                window.location.assign(`/admissions?leadId=${lead.id}`)
              }
            >
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Create admission</TooltipContent>
        </Tooltip>
      </div>

      <div className="mt-2 flex flex-col items-center text-center">
        <Avatar className="h-20 w-20 border">
          <AvatarFallback className="text-lg font-semibold">
            {getInitials(lead)}
          </AvatarFallback>
        </Avatar>
        <h2 className="mt-3 text-2xl font-semibold">
          {lead.firstName} {lead.lastName}
        </h2>
      </div>

      <div className="mt-5 space-y-4 rounded-lg border p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Community / Area</span>
          <span>
            {lead.community ?? "-"} / {lead.area ?? "-"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Age</span>
          <span>{lead.age ?? "-"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Source</span>
          <span>{lead.source ?? "-"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Interest</span>
          <span>
            <Badge variant="secondary">{lead.interest ?? "Not set"}</Badge>
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Expected budget</span>
          <span>{formatCurrency(lead.expectedBudget)}</span>
        </div>
        <div className="pt-2">
          <p className="text-xs text-muted-foreground">Phone</p>
          <p className="font-mono text-sm">{lead.phone}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Email</p>
          <p className="break-all text-sm">{lead.email ?? "-"}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          Tags
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="outline">
              {tag.label}
            </Badge>
          ))}
        </div>
        {canManage ? (
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(event) => onTagInputChange(event.target.value)}
              placeholder="Add comma-separated tags"
            />
            <Button variant="secondary" onClick={onSaveTags}>
              Save
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-medium uppercase text-muted-foreground">
          Alerts
        </p>
        <ScrollArea className="h-40 rounded-lg border p-2">
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-2 rounded-md border p-2 text-xs ${alert.severity === "critical" ? "border-red-500/50 bg-red-500/10" : alert.severity === "warning" ? "border-amber-500/50 bg-amber-500/10" : "border-emerald-500/40 bg-emerald-500/10"}`}
              >
                {alert.severity === "critical" ? (
                  <CircleAlert className="mt-0.5 size-3.5" />
                ) : alert.severity === "warning" ? (
                  <TriangleAlert className="mt-0.5 size-3.5" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-3.5" />
                )}
                <p>{alert.message}</p>
              </div>
            ))}
            {!alerts.length ? (
              <p className="text-xs text-muted-foreground">
                No active alerts for this lead.
              </p>
            ) : null}
          </div>
        </ScrollArea>
      </div>

      <div className="mt-4 rounded-lg border p-3 text-xs text-muted-foreground">
        <p>
          Stage: <span className="text-foreground">{stageName ?? "-"}</span>
        </p>
        <p className="mt-1">Last updated: {formatDateTime(lead.updatedAt)}</p>
      </div>
    </div>
  );
}
