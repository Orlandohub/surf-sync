"use client"

import * as React from "react"
import { Select } from "@/components/ui/select"
import { formatSlot, timeOptions } from "@/lib/format"

/**
 * surfsync DS — TimeSelect. 24-hour "HH:MM" picker on the native Select
 * (fixes the AM/PM that `<input type="time">` shows in some browsers).
 * Options are zero-padded slots every `step` minutes from `min` to `max`
 * (inclusive). Defaults: 06:00–22:00, every 30 min.
 *
 *   <Field label="Início">
 *     <TimeSelect name="start" defaultValue={slot.startTime} min="06:00" max="21:30" />
 *   </Field>
 *
 * Accepts DB values as they come ("09:00:00" → selects "09:00"). The
 * submitted value is always "HH:MM". A value outside the grid (legacy
 * "09:15") is kept as an extra option rather than silently dropped.
 */
type TimeSelectProps = Omit<React.ComponentProps<typeof Select>, "children" | "value" | "defaultValue"> & {
  value?: string
  defaultValue?: string
  /** First option, "HH:MM". */
  min?: string
  /** Last option, "HH:MM" (inclusive). */
  max?: string
  /** Minutes between options. */
  step?: number
  /** Optional empty first option (e.g. "Sem hora"); omitted by default. */
  placeholder?: string
}

function normalize(value: string | undefined): string | undefined {
  return value ? formatSlot(value) : value
}

function TimeSelect({
  value,
  defaultValue,
  min = "06:00",
  max = "22:00",
  step = 30,
  placeholder,
  ...props
}: TimeSelectProps) {
  const selected = normalize(value)
  const initial = normalize(defaultValue)
  const options = React.useMemo(() => {
    const grid = timeOptions({ min, max, step })
    const extra = [selected, initial].filter(
      (v): v is string => !!v && !grid.includes(v)
    )
    return extra.length ? [...grid, ...extra].sort() : grid
  }, [min, max, step, selected, initial])

  return (
    <Select
      {...props}
      {...(value !== undefined ? { value: selected } : { defaultValue: initial })}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </Select>
  )
}

export { TimeSelect }
