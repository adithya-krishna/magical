import { useState } from "react"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type LeadRowActionsProps = {
  leadName: string
  onUpdate: () => void
  onDelete: () => void
}

export function LeadRowActions({ leadName, onUpdate, onDelete }: LeadRowActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <span className="sr-only">Open actions</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <DropdownMenuLabel>{leadName}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onUpdate}>Update</DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              setDeleteDialogOpen(true)
            }}
          >
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem disabled>Trigger Admission (Coming soon)</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={(event) => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {leadName} from active leads. You can’t undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.stopPropagation()
                onDelete()
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
