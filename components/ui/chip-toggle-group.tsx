"use client"

import * as React from "react"
import { Toggle } from "@base-ui/react/toggle"
import { ToggleGroup } from "@base-ui/react/toggle-group"
import { cn } from "@/lib/utils"
import { useFieldContext } from "@/components/ui/field"
import { DAY_KEYS, type DayKey, weekdayLong, weekdayShort } from "@/lib/format"

/**
 * surfsync DS (COMPONENTS.md "Day chips") — chip toggles.
 * Each chip is a toggle button (aria-pressed): off `bg-muted
 * text-muted-foreground`, on `bg-primary text-primary-foreground`. Selected
 * chips are toggles, not buttons — the one-primary rule doesn't apply.
 *
 *   <Field label="Zonas" group>
 *     <ChipToggleGroup
 *       name="locationIds"                      // hidden inputs, one per value
 *       options={locations.map((l) => ({ value: l.id, label: l.name }))}
 *       value={zones}
 *       onValueChange={setZones}
 *     />
 *   </Field>
 *
 * `multiple` (default) for any-of selections; `multiple={false}` for one-of
 * (add `required` so the last chip can't be switched off). Works
 * controlled (`value` + `onValueChange`) or uncontrolled (`defaultValue`).
 * Inside <Field group> the label names the group automatically; otherwise
 * pass `aria-label`.
 */

export type ChipOption<V extends string = string> = {
  value: V
  label: React.ReactNode
  /** Accessible name when the visible label is abbreviated. */
  ariaLabel?: string
  disabled?: boolean
}

type ChipToggleGroupProps<V extends string> = {
  options: readonly ChipOption<V>[]
  value?: readonly V[]
  defaultValue?: readonly V[]
  onValueChange?: (value: V[]) => void
  multiple?: boolean
  /** Single-select: keep one chip on. */
  required?: boolean
  /** Form field name — renders a hidden input per selected value. */
  name?: string
  disabled?: boolean
  className?: string
  /** Extra classes for every chip. */
  chipClassName?: string
  "aria-label"?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
}

// min-h, not h: a label longer than the group is wide ("Costa da Caparica
// Norte" at 200% text) wraps inside its chip instead of widening the page.
const chipClassName =
  "tap inline-flex min-h-9 max-w-full cursor-pointer items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-center text-meta font-medium text-balance wrap-break-word select-none outline-none " +
  "bg-muted text-muted-foreground transition-[background-color,color,transform] duration-(--duration-fast) ease-move " +
  "hover:text-foreground active:scale-98 " +
  "data-pressed:bg-primary data-pressed:text-primary-foreground data-pressed:hover:bg-primary-hover " +
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "data-disabled:pointer-events-none data-disabled:opacity-40"

function ChipToggleGroup<V extends string>({
  options,
  value,
  defaultValue,
  onValueChange,
  multiple = true,
  required = false,
  name,
  disabled,
  className,
  chipClassName: chipExtra,
  ...aria
}: ChipToggleGroupProps<V>) {
  const field = useFieldContext()
  const [internal, setInternal] = React.useState<readonly V[]>(defaultValue ?? [])
  const current = value ?? internal

  function handleChange(next: V[]) {
    if (required && next.length === 0) return
    if (value === undefined) setInternal(next)
    onValueChange?.(next)
  }

  return (
    <>
      <ToggleGroup<V>
        data-slot="chip-toggle-group"
        value={current}
        onValueChange={handleChange}
        multiple={multiple}
        disabled={disabled}
        aria-label={aria["aria-label"]}
        aria-labelledby={aria["aria-labelledby"] ?? (aria["aria-label"] ? undefined : field?.labelId)}
        aria-describedby={aria["aria-describedby"] ?? field?.describedBy}
        className={cn("flex flex-wrap gap-2", className)}
      >
        {options.map((option) => (
          <Toggle<V>
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            aria-label={option.ariaLabel}
            className={cn(chipClassName, chipExtra)}
          >
            {option.label}
          </Toggle>
        ))}
      </ToggleGroup>
      {name &&
        current.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
    </>
  )
}

/**
 * Weekday selector: SEG TER QUA QUI SEX SÁB DOM, Monday first, values are
 * the DB day keys ("mon" … "sun"). A 7-column grid, so the week is one
 * row of equal chips — down to 320px of content width at 100% text. The
 * wrapper is a size container (rem-based): below 17rem (larger text on a
 * phone) the chips keep a 44px minimum and wrap onto a second row instead
 * of running into each other.
 *
 *   <Field label="Dias da semana" group>
 *     <DayChips name="days" value={days} onValueChange={setDays} />
 *   </Field>
 *
 * `className` goes on the wrapper (width, margins).
 */
function DayChips({
  className,
  chipClassName: chipExtra,
  ...props
}: Omit<ChipToggleGroupProps<DayKey>, "options">) {
  const options = React.useMemo(
    () =>
      DAY_KEYS.map((day) => ({
        value: day,
        label: weekdayShort(day),
        ariaLabel: weekdayLong(day),
      })),
    []
  )
  return (
    <div data-slot="day-chips" className={cn("@container w-full max-w-md", className)}>
      <ChipToggleGroup<DayKey>
        {...props}
        options={options}
        className="grid grid-cols-7 gap-1.5 @max-[17rem]:flex @max-[17rem]:flex-wrap"
        chipClassName={cn(
          // design-lint-disable-next-line SS09 -- weekday labels (COMPONENTS.md "Day chips")
          "min-w-0 px-0 text-caption uppercase tabular-nums @max-[17rem]:min-w-11 @max-[17rem]:px-2",
          chipExtra
        )}
      />
    </div>
  )
}

export { ChipToggleGroup, DayChips }
