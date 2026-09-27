"use client";

import { useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions";

export function DeleteButton({
  action,
  label,
}: {
  action: () => Promise<ActionResult>;
  label: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Delete ${label}`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await action();
          if (result.ok) toast.success(`Deleted ${label}`);
          else toast.error(result.error);
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
    </Button>
  );
}
