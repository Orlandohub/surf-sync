"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { toggleBookmarkAction } from "@/lib/actions/discovery";
import { toast } from "@/components/ui/toast";
import { byId, refocusWhenRemoved } from "@/components/school/focus";
import { cn } from "@/lib/utils";

/**
 * Save / unsave an instructor for the school (any staff member). An icon
 * toggle: aria-pressed carries the state, the accessible name stays
 * "Guardar Ana Marques". Optimistic; reverts with a toast if the action
 * fails or can't be reached. Removing offers "Anular" in the toast, which
 * does nothing if the instructor was saved again in the meantime.
 *
 * Sits on top of a row's stretched link (relative z-10), never inside it.
 * In Guardados an unsave removes the row, so pass `focusAfterUnsave` (an
 * id with tabIndex -1) to keep keyboard focus on the list.
 */
export function BookmarkToggle({
  instructorId,
  name,
  bookmarked,
  focusAfterUnsave,
  className,
}: {
  instructorId: string;
  name: string;
  bookmarked: boolean;
  focusAfterUnsave?: string;
  className?: string;
}) {
  const t = useTranslations("DiscoveryPage.bookmark");
  const router = useRouter();
  const [, startTransition] = React.useTransition();
  const ref = React.useRef<HTMLButtonElement>(null);
  const [on, setOn] = React.useState(bookmarked);
  const [busy, setBusy] = React.useState(false);
  // The latest state, for the toast's "Anular" (it runs later).
  const onRef = React.useRef(bookmarked);
  React.useEffect(() => {
    onRef.current = on;
  }, [on]);

  // Follow the server value after a refresh (another tab, the undo action).
  const [prev, setPrev] = React.useState(bookmarked);
  if (prev !== bookmarked) {
    setPrev(bookmarked);
    setOn(bookmarked);
  }

  const refresh = React.useCallback(() => startTransition(() => router.refresh()), [router]);

  async function undo() {
    if (onRef.current) return; // saved again meanwhile: nothing to undo
    try {
      const res = await toggleBookmarkAction(instructorId);
      if (!res.ok) throw new Error(res.error);
      toast(res.bookmarked ? t("saved") : t("removed"));
    } catch {
      toast.error(t("failed"));
    }
    refresh();
  }

  async function toggle() {
    if (busy) return;
    const next = !on;
    setOn(next);
    setBusy(true);
    try {
      const res = await toggleBookmarkAction(instructorId);
      if (!res.ok) throw new Error(res.error);
      setOn(res.bookmarked);
      if (res.bookmarked) {
        toast(t("saved"));
      } else {
        toast(t("removed"), { action: { label: t("undo"), onClick: () => void undo() } });
        if (focusAfterUnsave) refocusWhenRemoved(ref.current, byId(focusAfterUnsave));
      }
      refresh();
    } catch {
      setOn(!next);
      toast.error(t("failed"));
    } finally {
      setBusy(false);
    }
  }

  const Icon = on ? BookmarkCheck : Bookmark;
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={on}
      aria-label={t("label", { name })}
      aria-busy={busy || undefined}
      onClick={toggle}
      data-slot="bookmark-toggle"
      className={cn(
        "relative z-10 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none",
        "transition-[color,background-color,transform] duration-(--duration-fast) ease-move active:scale-98",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        on
          ? "bg-tint text-tint-foreground hover:bg-secondary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      <Icon aria-hidden className="size-5" strokeWidth={1.75} />
    </button>
  );
}
