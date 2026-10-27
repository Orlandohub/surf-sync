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
 * Give the id to the Field (`id="email"`), not the control. For a group
 * of toggles (chips, day chips) pass `group` — the label then names the
 * group (aria-labelledby) instead of pointing at one input.
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
 * Merges Field wiring into a control's props. Explicit props win; the
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
  const describedBy =
    [field.describedBy, props["aria-describedby"]].filter(Boolean).join(" ") || undefined
  return {
    ...props,
    id: props.id ?? field.id,
    "aria-describedby": describedBy,
    "aria-invalid": props["aria-invalid"] ?? (field.invalid || undefined),
  }
}

type FieldProps = Omit<React.ComponentProps<"div">, "children"> & {
  label: React.ReactNode
  /** One line under the control (format hints, consequences). */
  helper?: React.ReactNode
  /** Inline error; replaces the helper while present. */
  error?: React.ReactNode
  /** The control's id. Generated when omitted. */
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
  const id = idProp ?? `field${autoId.replace(/:/g, "")}`
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
        {hasError && <FieldError id={errorId}>{error}</FieldError>}
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
 * Also usable on its own for a form-level error under the submit button.
 */
function FieldError({ className, children, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-error"
      className={cn("flex items-start gap-1.5 text-meta text-destructive", className)}
      {...props}
    >
      <CircleAlert aria-hidden className="mt-px size-4 shrink-0" strokeWidth={1.75} />
      <span>{children}</span>
    </p>
  )
}

export { Field, FieldHelper, FieldError }
