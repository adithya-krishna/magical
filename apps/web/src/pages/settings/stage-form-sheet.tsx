import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
import { ColorPicker } from "@/components/color-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { LeadStage } from "@/pages/leads/types";

export type StageFormValues = {
  name: string;
  color: string;
};

type StageFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage?: LeadStage | null;
  isSaving: boolean;
  onSubmit: (values: StageFormValues) => Promise<void>;
};

const DEFAULT_STAGE_COLOR = "bg-blue-500";

function getErrorMessage(error: unknown): string | null {
  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : null;
  }

  return null;
}

function toFormValues(stage?: LeadStage | null): StageFormValues {
  return {
    name: stage?.name ?? "",
    color: stage?.color ?? DEFAULT_STAGE_COLOR,
  };
}

export function StageFormSheet({
  open,
  onOpenChange,
  stage,
  isSaving,
  onSubmit,
}: StageFormSheetProps) {
  const isNew = !stage;

  const form = useForm({
    defaultValues: toFormValues(stage),
    onSubmit: async ({ value }) => {
      if (!value.name.trim() || !value.color.trim()) {
        return;
      }

      await onSubmit({
        name: value.name.trim(),
        color: value.color,
      });
    },
  });

  useEffect(() => {
    form.reset(toFormValues(stage));
  }, [form, stage, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[425px]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <SheetHeader>
            <SheetTitle>{isNew ? "Create Stage" : "Edit Stage"}</SheetTitle>
            <SheetDescription>
              {isNew
                ? "Add a new stage to your pipeline"
                : "Make changes to your stage here"}
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-4 py-2">
            <form.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  value.trim().length > 0 ? undefined : "Stage name is required",
              }}
              children={(field) => (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="stage-name" className="text-right">
                    Stage Name
                  </Label>
                  <Input
                    id="stage-name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    placeholder="e.g. New, Contacted"
                    className="col-span-3"
                    disabled={isSaving}
                  />
                  {field.state.meta.errors[0] ? (
                    <p className="col-span-4 text-right text-xs text-destructive">
                      {getErrorMessage(field.state.meta.errors[0])}
                    </p>
                  ) : null}
                </div>
              )}
            />

            <form.Field
              name="color"
              validators={{
                onChange: ({ value }) =>
                  value.trim().length > 0 ? undefined : "Color is required",
              }}
              children={(field) => (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Select Color</Label>
                  <ColorPicker
                    value={field.state.value}
                    onChange={(value) => field.handleChange(value)}
                    className="col-span-3"
                  />
                  {field.state.meta.errors[0] ? (
                    <p className="col-span-4 text-right text-xs text-destructive">
                      {getErrorMessage(field.state.meta.errors[0])}
                    </p>
                  ) : null}
                </div>
              )}
            />
          </div>

          <SheetFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : isNew ? "Create Stage" : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
