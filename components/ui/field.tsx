"use client"

import * as React from "react"
import { CircleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * surfsync DS (COMPONENTS.md "Text field") — Field.
 *
 * Label above (always visible, never placeholder-as-label) → control →
 * helper text, or the inline error in its place. The control inside
 * (Input, Textarea, Select, TimeSelect, ChipToggleGroup, DayChips, Switch)
 * picks up `id`, `aria-describedby` and `aria-invalid` automatically:
 *
 *   <Field label="Email" helper="Para as escolas te contactarem." error={errors.email}>
 *     <Input name="email" type="email" />
 *   </Field>
 *
 * Ids: the Field owns the control's id, so the label always points at it.
 * Put it on the Field (`<Field id="email">`); an `id` on a direct child
 * control is adopted too (`<Field label="Nome"><Input id="school-name" /></Field>`
 * labels `#school-name`). Deeper inside, the Field's id wins over the
 * control's (dev warning).
 * For a group of toggles (chips, day chips) pass `group` — the label then
 * names the group (aria-labelledby) instead of pointing at one input.
 *
 * Errors are announced: the message sits in a polite live region that is
 * always mounted, so an error that appears after submit is read out.
 * Error copy says what to fix ("Indica um email válido.").
 */

type FieldContextValue = {
  id: string
  labelId: string
  describedBy: string | undefined
  invalid: boolean
}

const FieldContext = React.createContext<FieldContextValue | null>(null)

/** For custom controls: the ids/aria a control inside a Field should carry. */
export function useFieldContext() {
  return React.useContext(FieldContext)
}

/**
 * Merges Field wiring into a control's props. Inside a Field the Field's
 * id wins (so its label stays connected); explicit aria-invalid wins; the
 * Field's describedby ids are prepended to any the control already has.
 */
export function useFieldControlProps<
  P extends {
    id?: string
    "aria-describedby"?: string
    "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  },
>(props: P): P {
  const field = React.useContext(FieldContext)
  if (!field) return props
  if (process.env.NODE_ENV !== "production" && props.id && props.id !== field.id) {
    console.warn(
      `[Field] A control inside <Field> has id="${props.id}", but the Field's label points at "${field.id}". ` +
        `Put the id on the <Field> instead; the Field's id is used.`
    )
  }
  const describedBy =
    [field.describedBy, props["aria-describedby"]].filter(Boolean).join(" ") || undefined
  return {
    ...props,
    id: field.id,
    "aria-describedby": describedBy,
    "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined),
  }
}

/** The `id` of the first direct child element that has one. */
function childControlId(children: React.ReactNode): string | undefined {
  let found: string | undefined
  React.Children.forEach(children, (child) => {
    if (found || !React.isValidElement(child)) return
    const id = (child.props as { id?: unknown }).id
    if (typeof id === "string" && id) found = id
  })
  return found
}

type FieldProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode
  /** One line under the control (format hints, consequences). */
  helper?: React.ReactNode
  /** Inline error; replaces the helper while present. */
  error?: React.ReactNode
  /** The control's id. Else a direct child's `id`, else generated. */
  id?: string
  /** Label a group of controls (chips, day chips) rather than one input. */
  group?: boolean
  /** Hide the label visually but keep it for screen readers. */
  hideLabel?: boolean
  children: React.ReactNode
}

function Field({
  label,
  helper,
  error,
  id: idProp,
  group = false,
  hideLabel = false,
  className,
  children,
  ...props
}: FieldProps) {
  const autoId = React.useId()
  const id = idProp ?? childControlId(children) ?? `field${autoId.replace(/:/g, "")}`
  const labelId = `${id}-label`
  const helperId = `${id}-helper`
  const errorId = `${id}-error`
  const hasError = error != null && error !== false && error !== ""
  const hasHelper = !hasError && helper != null && helper !== false && helper !== ""

  const value = React.useMemo<FieldContextValue>(
    () => ({
      id,
      labelId,
      describedBy: hasError ? errorId : hasHelper ? helperId : undefined,
      invalid: hasError,
    }),
    [id, labelId, hasError, hasHelper, errorId, helperId],
  )

  return (
    <FieldContext.Provider value={value}>
      <div
        data-slot="field"
        data-invalid={hasError || undefined}
        className={cn("flex flex-col gap-2", className)}
        {...props}
      >
        <Label
          id={labelId}
          htmlFor={group ? undefined : id}
          className={cn(hideLabel && "sr-only")}
        >
          {label}
        </Label>
        {children}
        {hasHelper && <FieldHelper id={helperId}>{helper}</FieldHelper>}
        {/* Always mounted so screen readers notice the error appearing.
            Empty, its negative margin cancels the flex gap. */}
        <div data-slot="field-message" aria-live="polite" className="empty:-mt-2">
          {hasError && (
            <FieldError id={errorId} announce={false}>
              {error}
            </FieldError>
          )}
        </div>
      </div>
    </FieldContext.Provider>
  )
}

/** Helper line under a control — `text-caption` muted. */
function FieldHelper({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-helper"
      className={cn("text-caption text-muted-foreground", className)}
      {...props}
    />
  )
}

/**
 * Inline error — `text-meta text-destructive` with CircleAlert 16px.
 *
 * On its own (a form-level error under the submit button, a failed action
 * in a dialog) it is `role="alert"`, so it is announced when it appears:
 *
 *   {state.error && <FieldError>{state.error}</FieldError>}
 *
 * Render it only while there is an error (don't keep an empty one around).
 * `announce={false}` when something else already announces it (Field does).
 */
function FieldError({
  className,
  children,
  announce = true,
  ...props
}: React.ComponentProps<"p"> & { announce?: boolean }) {
  return (
    <p
      data-slot="field-error"
      role={announce ? "alert" : undefined}
      className={cn("flex items-start gap-1.5 text-meta text-destructive", className)}
      {...props}
    >
      <CircleAlert aria-hidden className="mt-px size-4 shrink-0" strokeWidth={1.75} />
      <span>{children}</span>
    </p>
  )
}

export { Field, FieldHelper, FieldError }
