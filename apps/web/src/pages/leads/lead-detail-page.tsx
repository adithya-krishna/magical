import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  LeadDetailTabsNav,
  LeadEditTab,
  LeadFollowUpTab,
  LeadHistoryTab,
  LeadProfileSidebar,
  leadTabs,
  type UserListResponse,
} from "@/pages/leads/lead-detail"
import type {
  LeadDetailsResponse,
  LeadHistoryResponse,
  LeadNotesResponse,
  LeadStagesResponse,
  LeadTagsResponse,
} from "@/pages/leads/types"
import { authClient } from "@/lib/auth-client"

type LeadDetailPageProps = {
  id: string
  tab: string
}

export function LeadDetailPage({ id, tab }: LeadDetailPageProps) {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000"
  const queryClient = useQueryClient()
  const session = authClient.useSession()
  const userRole = (session.data?.user as { role?: string } | undefined)?.role ?? "student"
  const canManage = userRole === "super_admin" || userRole === "admin" || userRole === "staff"

  const [noteBody, setNoteBody] = useState("")
  const [noteSearch, setNoteSearch] = useState("")
  const [tagInput, setTagInput] = useState("")

  const activeTab = leadTabs.includes(tab as (typeof leadTabs)[number]) ? tab : "follow-up"

  const detailsQuery = useQuery({
    queryKey: ["lead-details", id],
    queryFn: async (): Promise<LeadDetailsResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/leads/${id}/details`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to load lead details")
      return response.json()
    },
  })

  const stagesQuery = useQuery({
    queryKey: ["lead-stages"],
    queryFn: async (): Promise<LeadStagesResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/lead-stages`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to load lead stages")
      return response.json()
    },
  })

  const staffQuery = useQuery({
    queryKey: ["lead-staff-options"],
    enabled: canManage,
    queryFn: async (): Promise<UserListResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/users?roles=staff`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to load staff")
      return response.json()
    },
  })

  const teacherQuery = useQuery({
    queryKey: ["lead-teacher-options"],
    enabled: canManage,
    queryFn: async (): Promise<UserListResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/users?roles=teacher`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to load teachers")
      return response.json()
    },
  })

  const notesQuery = useQuery({
    queryKey: ["lead-notes", id],
    queryFn: async (): Promise<LeadNotesResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/leads/${id}/notes`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to load notes")
      return response.json()
    },
  })

  const historyQuery = useQuery({
    queryKey: ["lead-history", id],
    queryFn: async (): Promise<LeadHistoryResponse> => {
      const response = await fetch(`${apiUrl}/api/v1/leads/${id}/history`, {
        credentials: "include",
      })
      if (!response.ok) throw new Error("Failed to load history")
      return response.json()
    },
  })

  const addNoteMutation = useMutation({
    mutationFn: async (body: string) => {
      const response = await fetch(`${apiUrl}/api/v1/leads/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body }),
      })
      if (!response.ok) throw new Error("Unable to add note")
      return response.json()
    },
    onSuccess: async () => {
      setNoteBody("")
      await queryClient.invalidateQueries({ queryKey: ["lead-notes", id] })
      await queryClient.invalidateQueries({ queryKey: ["lead-details", id] })
    },
    onError: () => toast.error("Unable to add note."),
  })

  const workflowMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch(`${apiUrl}/api/v1/leads/${id}/workflow`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error("Unable to update workflow")
      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lead-details", id] })
      await queryClient.invalidateQueries({ queryKey: ["lead-history", id] })
      await queryClient.invalidateQueries({ queryKey: ["leads"] })
    },
    onError: () => toast.error("Unable to update lead workflow."),
  })

  const profileMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const response = await fetch(`${apiUrl}/api/v1/leads/${id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error("Unable to update profile")
      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["lead-details", id] })
      await queryClient.invalidateQueries({ queryKey: ["lead-history", id] })
      await queryClient.invalidateQueries({ queryKey: ["leads"] })
      toast.success("Lead profile updated")
    },
    onError: () => toast.error("Unable to update lead profile."),
  })

  const tagMutation = useMutation({
    mutationFn: async (tags: string[]) => {
      const response = await fetch(`${apiUrl}/api/v1/leads/${id}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tags }),
      })
      if (!response.ok) throw new Error("Unable to save tags")
      return response.json() as Promise<LeadTagsResponse>
    },
    onSuccess: async () => {
      setTagInput("")
      await queryClient.invalidateQueries({ queryKey: ["lead-details", id] })
      await queryClient.invalidateQueries({ queryKey: ["lead-history", id] })
    },
    onError: () => toast.error("Unable to save tags."),
  })

  const data = detailsQuery.data?.data
  const lead = data?.lead

  const filteredNotes = useMemo(() => {
    const notes = notesQuery.data?.data ?? data?.notes ?? []
    const term = noteSearch.trim().toLowerCase()
    if (!term) return notes
    return notes.filter((note) => note.body.toLowerCase().includes(term))
  }, [data?.notes, noteSearch, notesQuery.data?.data])

  const stageMap = new Map((stagesQuery.data?.data ?? []).map((stage) => [stage.id, stage]))

  if (detailsQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Loading lead details...
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-3">
        <p className="text-sm text-muted-foreground">Lead not found.</p>
        <Button asChild variant="outline">
          <Link to="/leads">Back to leads</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-0 overflow-hidden rounded-xl border bg-background lg:grid-cols-[1.7fr_1fr]">
      <div className="flex h-full min-h-[80vh] flex-col overflow-hidden border-r bg-muted/20">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold">Lead Details</h1>
            <p className="text-xs text-muted-foreground">URL-based CRM view for this lead.</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/leads">Back</Link>
          </Button>
        </div>

        <div className="px-6 pt-4">
          <LeadDetailTabsNav leadId={lead.id} activeTab={activeTab} />
        </div>

        <div className="flex-1 overflow-hidden px-6 pb-6 pt-4">
          {activeTab === "follow-up" ? (
            <LeadFollowUpTab
              lead={lead}
              canManage={canManage}
              currentUserId={(session.data?.user as { id?: string } | undefined)?.id}
              notes={filteredNotes}
              noteSearch={noteSearch}
              noteBody={noteBody}
              isAddingNote={addNoteMutation.isPending}
              isUpdatingWorkflow={workflowMutation.isPending}
              stages={stagesQuery.data?.data ?? []}
              staffOptions={staffQuery.data?.data ?? []}
              teacherOptions={teacherQuery.data?.data ?? []}
              onNoteSearchChange={setNoteSearch}
              onNoteBodyChange={setNoteBody}
              onAddNote={() => noteBody.trim() && addNoteMutation.mutate(noteBody.trim())}
              onWorkflowChange={(payload) => workflowMutation.mutate(payload)}
            />
          ) : null}

          {activeTab === "history" ? (
            <LeadHistoryTab history={historyQuery.data?.data ?? data.history} />
          ) : null}

          {activeTab === "edit" ? (
            <LeadEditTab
              lead={lead}
              canManage={canManage}
              isSaving={profileMutation.isPending}
              onSubmit={(payload) => profileMutation.mutate(payload)}
            />
          ) : null}
        </div>
      </div>

      <LeadProfileSidebar
        lead={lead}
        tags={data.tags ?? []}
        alerts={data.alerts ?? []}
        canManage={canManage}
        tagInput={tagInput}
        stageName={stageMap.get(lead.stageId)?.name}
        onTagInputChange={setTagInput}
        onSaveTags={() => {
          const existing = (data.tags ?? []).map((item) => item.label)
          const incoming = tagInput
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
          tagMutation.mutate([...new Set([...existing, ...incoming])])
        }}
      />
    </div>
  )
}
