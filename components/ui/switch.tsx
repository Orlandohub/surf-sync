"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "@/lib/utils"
import { useFieldContext } from "@/components/ui/field"

/**
 * surfsync DS (COMPONENTS.md "Switch").
 * Track `bg-input` → `bg-primary` when on; thumb `bg-card shadow-card`,
 * travelling in `duration-instant ease-move`. 44×26 visual, 44×44 hit area.
 *
 * Settings lists apply a change immediately; on a form screen it waits for
 * "Guardar alterações". Works in forms: pass `name` (submits "on").
 * Most of the time you want <SwitchRow> (label left, switch right, the
 * whole row tappable) rather than a bare Switch.
 */
function Switch({
  className,
  ...props
}: SwitchPrimitive.Root.Props) {
  const field = useFieldContext()
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      id={props.id ?? field?.id}
      aria-describedby={props["aria-describedby"] ?? field?.describedBy}
      className={cn(
        "tap relative inline-flex h-6.5 w-11 shrink-0 cursor-pointer items-center rounded-full bg-input p-0.5 outline-none",
        "transition-colors duration-(--duration-fast) ease-move",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-40",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-5.5 rounded-full bg-card shadow-card transition-transform duration-(--duration-instant) ease-move data-checked:translate-x-4.5"
      />
    </SwitchPrimitive.Root>
  )
}

/**
 * A settings row: label (+ optional description) on the left, the switch
 * on the right; tapping anywhere on the row toggles. Min height 52px.
 *
 *   <SwitchRow label="Perfil ativo" description="Visível para escolas na pesquisa."
 *     checked={active} onCheckedChange={setActive} />
 */
function SwitchRow({
  label,
  description,
  className,
  ...props
}: SwitchPrimitive.Root.Props & {
  label: React.ReactNode
  description?: React.ReactNode
}) {
  const autoId = React.useId()
  const id = props.id ?? `switch${autoId.replace(/:/g, "")}`
  const descriptionId = description ? `${id}-description` : undefined
  return (
    <div
      data-slot="switch-row"
      className={cn("flex min-h-13 items-center justify-between gap-4 py-2", className)}
    >
      <label htmlFor={id} className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5">
        <span className="text-body text-foreground">{label}</span>
        {description && (
          <span id={descriptionId} className="text-meta text-muted-foreground">
            {description}
          </span>
        )}
      </label>
      <Switch id={id} aria-describedby={descriptionId} {...props} />
    </div>
  )
}

export { Switch, SwitchRow }
