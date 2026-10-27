"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"

/**
 * surfsync DS (COMPONENTS.md "Sheet / Drawer" + "Dialog").
 *
 * One responsive surface: a bottom sheet on mobile (grabber,
 * `rounded-t-sheet`, slides up in `duration-slow ease-enter`, leaves
 * faster in `ease-exit`) and a centred dialog from md
 * (`rounded-card max-w-md p-6`, `shadow-overlay`). Backdrop `bg-overlay`.
 *
 * Most screens want <ConfirmDialog>. The parts (Dialog, DialogTrigger,
 * DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
 * DialogClose) are for anything else modal — e.g. a short form.
 */

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogClose = DialogPrimitive.Close

function DialogContent({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        data-slot="dialog-backdrop"
        className="fixed inset-0 z-50 bg-overlay transition-opacity duration-(--duration-slow) ease-enter data-ending-style:opacity-0 data-ending-style:duration-(--duration-base) data-ending-style:ease-exit data-starting-style:opacity-0"
      />
      <DialogPrimitive.Viewport className="fixed inset-0 z-50 flex items-end justify-center pt-12 md:items-center md:p-6">
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className={cn(
            "relative flex max-h-full w-full flex-col overflow-y-auto bg-card text-card-foreground shadow-overlay outline-none",
            // Mobile: bottom sheet.
            "rounded-t-sheet px-gutter pt-3 pb-5",
            "transition-[translate,scale,opacity] duration-(--duration-slow) ease-enter",
            "data-ending-style:duration-(--duration-base) data-ending-style:ease-exit",
            "max-md:data-starting-style:translate-y-full max-md:data-ending-style:translate-y-full",
            // md+: centred dialog.
            "md:max-w-md md:rounded-card md:p-6 md:duration-(--duration-base)",
            "md:data-starting-style:scale-95 md:data-starting-style:opacity-0 md:data-ending-style:scale-95 md:data-ending-style:opacity-0 md:data-ending-style:duration-(--duration-fast)",
            className
          )}
          {...props}
        >
          <div
            aria-hidden
            className="mx-auto mb-5 h-1 w-9 shrink-0 rounded-full bg-input md:hidden"
          />
          {children}
          {/* Keeps the last button clear of the home indicator. */}
          <div aria-hidden className="h-(--safe-bottom) shrink-0 md:hidden" />
        </DialogPrimitive.Popup>
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

/** States the consequence: "Cancelar a aula de sábado?" */
function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-title text-foreground", className)}
      {...props}
    />
  )
}

/** Says what happens next. */
function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-body text-muted-foreground", className)}
      {...props}
    />
  )
}

/**
 * Put the dismiss first and the primary last in the DOM: mobile stacks
 * them full-width with the primary on top; md+ right-aligns them with the
 * primary on the right.
 */
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "mt-6 flex flex-col-reverse gap-2 md:flex-row md:justify-end",
        "*:data-[slot=button]:max-md:h-13 *:data-[slot=button]:max-md:w-full",
        className
      )}
      {...props}
    />
  )
}

type ConfirmResult = void | boolean

/**
 * Confirmation for a consequential action (cancel, decline, remove).
 *
 *   <ConfirmDialog
 *     trigger={<Button variant="outline">Cancelar aula</Button>}
 *     title="Cancelar a aula de sábado?"
 *     description="A escola é avisada e a aula sai da tua agenda."
 *     cancelLabel="Manter aula"
 *     confirmLabel="Cancelar aula"
 *     pendingLabel="A cancelar…"
 *     tone="destructive"
 *     onConfirm={async () => {
 *       const res = await cancelBookingAction(id)
 *       if (!res.ok) { setError(res.error); return false } // stays open
 *       toast("Aula cancelada.")
 *     }}
 *     error={error}
 *     onOpenChange={(open) => { if (!open) setError(null) }} // no stale error next time
 *   />
 *
 * - Title states the consequence; the confirm button names the action and
 *   the dismiss names the alternative ("Manter aula"), never "OK".
 * - `tone="destructive"` for anything that removes or cancels — never teal.
 * - Focus starts on the dismiss, so Enter never confirms by accident.
 * - `onConfirm` may be async: the confirm button shows `pendingLabel` and
 *   the dialog can't be dismissed meanwhile. Return `false` to keep it open
 *   (show the reason via `error`, inline — not a toast; it is announced).
 *   If it throws, the dialog stays open with a generic error (logged).
 * - Clear your `error` state in `onOpenChange(false)` — works with
 *   `trigger` too (it's called on every open/close).
 * - Extra content (e.g. an optional reason field) goes in `children`.
 * - Controlled use: pass `open` + `onOpenChange` instead of `trigger`.
 * - On close, focus returns to whatever opened the dialog. When the
 *   confirmed action removed that element (the row it acted on left the
 *   list), it would fall to <body>: `finalFocus` says where it goes
 *   instead — a ref or a function returning an element (give a
 *   non-control `tabIndex={-1}`). Resolved after the exit animation, so
 *   it sees the updated page. While the opener is still there, focus
 *   goes back to it as usual.
 *
 *     <ConfirmDialog open={open} onOpenChange={setOpen} finalFocus={listRef} … />
 */
function ConfirmDialog({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  tone = "default",
  onConfirm,
  error,
  finalFocus,
}: {
  /** The element that opens the dialog, usually a Button. */
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  children?: React.ReactNode
  confirmLabel: React.ReactNode
  cancelLabel: React.ReactNode
  pendingLabel?: React.ReactNode
  tone?: "default" | "destructive"
  onConfirm: () => ConfirmResult | Promise<ConfirmResult>
  error?: React.ReactNode
  /** Where focus goes on close if the element that opened the dialog is gone. */
  finalFocus?: React.RefObject<HTMLElement | null> | (() => HTMLElement | null | undefined)
}) {
  const t = useTranslations("UI")
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const cancelRef = React.useRef<HTMLButtonElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const openerRef = React.useRef<Element | null>(null)
  const isOpen = open ?? internalOpen

  // Remember what opened the dialog: the trigger, or (controlled use) the
  // element focused at that moment. Layout effect: it runs before the
  // dialog moves focus inside.
  React.useLayoutEffect(() => {
    if (isOpen) openerRef.current = triggerRef.current ?? document.activeElement
  }, [isOpen])

  function resolveFinalFocus(): HTMLElement | boolean {
    const opener = openerRef.current
    const openerKnown = opener instanceof HTMLElement && opener !== document.body
    if (!finalFocus || (openerKnown && opener.isConnected)) return true
    const target = typeof finalFocus === "function" ? finalFocus() : finalFocus.current
    return target ?? true
  }

  function setOpen(next: boolean) {
    if (open === undefined) setInternalOpen(next)
    if (!next) setFailed(false)
    onOpenChange?.(next)
  }

  async function handleConfirm() {
    setPending(true)
    setFailed(false)
    try {
      const result = await onConfirm()
      if (result !== false) setOpen(false)
    } catch (err) {
      // Not silent: logged (Sentry picks up console errors once SUR-28 lands)
      // and shown inline; the dialog stays open so the person can retry.
      console.error(err)
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  const shownError = error || (failed ? t("actionFailed") : null)

  return (
    <AlertDialogPrimitive.Root
      open={isOpen}
      onOpenChange={(next) => {
        if (!pending) setOpen(next)
      }}
    >
      {trigger && <AlertDialogPrimitive.Trigger ref={triggerRef} render={trigger} />}
      <DialogContent initialFocus={cancelRef} {...(finalFocus ? { finalFocus: resolveFinalFocus } : {})}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children && <div className="mt-5 flex flex-col gap-4">{children}</div>}
        {shownError ? <FieldError className="mt-4">{shownError}</FieldError> : null}
        <DialogFooter>
          <AlertDialogPrimitive.Close
            ref={cancelRef}
            disabled={pending}
            render={<Button variant="ghost" />}
          >
            {cancelLabel}
          </AlertDialogPrimitive.Close>
          <Button
            variant={tone === "destructive" ? "destructive" : "default"}
            pending={pending}
            pendingLabel={pendingLabel}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </AlertDialogPrimitive.Root>
  )
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  ConfirmDialog,
}
