import { Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  formatDateTime,
  getStageCardStyle,
  stageUsageCopy,
  toDateInput,
  toDatetimeInput,
} from "@/pages/leads/lead-detail/helpers";
import type { SelectUser } from "@/pages/leads/lead-detail/types";
import type { Lead, LeadNote, LeadStage } from "@/pages/leads/types";

type LeadFollowUpTabProps = {
  lead: Lead;
  canManage: boolean;
  currentUserId?: string;
  notes: LeadNote[];
  noteSearch: string;
  noteBody: string;
  isAddingNote: boolean;
  isUpdatingWorkflow: boolean;
  stages: LeadStage[];
  staffOptions: SelectUser[];
  teacherOptions: SelectUser[];
  onNoteSearchChange: (value: string) => void;
  onNoteBodyChange: (value: string) => void;
  onAddNote: () => void;
  onWorkflowChange: (payload: Record<string, unknown>) => void;
};

export function LeadFollowUpTab({
  lead,
  canManage,
  currentUserId,
  notes,
  noteSearch,
  noteBody,
  isAddingNote,
  isUpdatingWorkflow,
  stages,
  staffOptions,
  teacherOptions,
  onNoteSearchChange,
  onNoteBodyChange,
  onAddNote,
  onWorkflowChange,
}: LeadFollowUpTabProps) {
  return (
    <>
      <Card className="mb-4 flex-1 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notes</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={noteSearch}
              onChange={(event) => onNoteSearchChange(event.target.value)}
              className="pl-9"
              placeholder="Search notes"
            />
          </div>
        </CardHeader>
        <CardContent className="flex h-full flex-col gap-3 overflow-hidden">
          <ScrollArea className="h-96 rounded-md border bg-background p-3">
            <div className="space-y-3">
              {notes.map((note) => {
                const mine = note.createdBy === currentUserId;

                return (
                  <div key={note.id} className="w-max max-w-xl grid">
                    <div className="px-3.5 py-2 bg-accent rounded justify-start items-center gap-3 inline-flex">
                      <h5 className="text-foreground text-sm font-normal leading-snug">
                        {note.body}
                      </h5>
                    </div>
                    <div className="justify-end items-center inline-flex mb-2.5 gap-3">
                      <h6 className="text-gray-500 text-xs font-normal leading-4 py-1">
                        {note.userFirstName} {note.userLastName}
                      </h6>
                      <h6 className="text-gray-500 text-xs font-normal leading-4 py-1">
                        {formatDateTime(note.createdAt)}
                      </h6>
                    </div>
                  </div>
                );
              })}
              {!notes.length ? (
                <p className="text-sm text-muted-foreground">No notes found.</p>
              ) : null}
            </div>
          </ScrollArea>
          <div className="space-y-2">
            <Textarea
              placeholder="Add lead note"
              value={noteBody}
              onChange={(event) => onNoteBodyChange(event.target.value)}
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={onAddNote}
                disabled={isAddingNote || !noteBody.trim()}
              >
                <Send className="mr-2 size-4" /> Send
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <RadioGroup
                value={lead.stageId}
                onValueChange={(stageId) =>
                  canManage && onWorkflowChange({ stageId })
                }
                className="space-y-3"
              >
                {stages.map((stage) => (
                  <label
                    key={stage.id}
                    htmlFor={`stage-${stage.id}`}
                    className="flex cursor-pointer gap-3 rounded-lg border p-3"
                    style={getStageCardStyle(stage.color)}
                  >
                    <RadioGroupItem
                      id={`stage-${stage.id}`}
                      value={stage.id}
                      disabled={!canManage || isUpdatingWorkflow}
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{stage.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {stageUsageCopy[stage.name] ??
                          "Use based on current lead progress."}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Change assignee</Label>
              <Select
                value={lead.ownerId ?? ""}
                onValueChange={(ownerId) => onWorkflowChange({ ownerId })}
                disabled={!canManage}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffOptions.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.firstName} {staff.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Assign instructor</Label>
              <Select
                value={lead.assignedTeacherId ?? ""}
                onValueChange={(assignedTeacherId) =>
                  onWorkflowChange({ assignedTeacherId })
                }
                disabled={!canManage}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teacherOptions.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Walk-in date</Label>
                <Input
                  type="date"
                  defaultValue={toDateInput(lead.walkInDate)}
                  onBlur={(event) =>
                    canManage &&
                    onWorkflowChange({ walkInDate: event.target.value || null })
                  }
                  disabled={!canManage}
                />
              </div>
              <div className="space-y-1">
                <Label>Follow-up date</Label>
                <Input
                  type="date"
                  defaultValue={toDateInput(lead.followUpDate)}
                  onBlur={(event) =>
                    canManage &&
                    event.target.value &&
                    onWorkflowChange({ followUpDate: event.target.value })
                  }
                  disabled={!canManage}
                />
              </div>
              <div className="space-y-1">
                <Label>Next follow-up</Label>
                <Input
                  type="datetime-local"
                  defaultValue={toDatetimeInput(lead.nextFollowUp)}
                  onBlur={(event) =>
                    canManage &&
                    onWorkflowChange({
                      nextFollowUp: event.target.value
                        ? new Date(event.target.value).toISOString()
                        : null,
                    })
                  }
                  disabled={!canManage}
                />
              </div>
              <div className="space-y-1">
                <Label>Demo date</Label>
                <Input
                  type="date"
                  defaultValue={toDateInput(lead.demoDate)}
                  onBlur={(event) =>
                    canManage &&
                    onWorkflowChange({ demoDate: event.target.value || null })
                  }
                  disabled={!canManage}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Contact attempts</Label>
                <Input
                  type="number"
                  min={0}
                  defaultValue={String(lead.numberOfContactAttempts ?? 0)}
                  onBlur={(event) => {
                    if (!canManage) return;
                    const parsed = Number(event.target.value);
                    onWorkflowChange({
                      numberOfContactAttempts: Number.isFinite(parsed)
                        ? Math.max(parsed, 0)
                        : 0,
                    });
                  }}
                  disabled={!canManage}
                />
              </div>
              <div className="space-y-1">
                <Label>Last contacted</Label>
                <Input
                  type="datetime-local"
                  defaultValue={toDatetimeInput(lead.lastContactedDate)}
                  onBlur={(event) =>
                    canManage &&
                    onWorkflowChange({
                      lastContactedDate: event.target.value
                        ? new Date(event.target.value).toISOString()
                        : null,
                    })
                  }
                  disabled={!canManage}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="demo-conducted"
                checked={lead.demoConducted}
                onCheckedChange={(checked: boolean) => {
                  if (!canManage) return;
                  onWorkflowChange({
                    demoConducted: Boolean(checked),
                    demoDate: checked
                      ? new Date().toISOString().slice(0, 10)
                      : lead.demoDate,
                  });
                }}
                disabled={!canManage}
              />
              <Label htmlFor="demo-conducted">Demo conducted</Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
