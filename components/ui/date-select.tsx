"use client"

import * as React from "react"
import { Select } from "@/components/ui/select"
import { formatDayDate, upcomingDates, type DayKey, type IsoDate } from "@/lib/format"

/**
 * surfsync DS — DateSelect. Picks one of the next days on the native
 * Select, labelled the PT-PT way ("Amanhã · 28 de outubro", "Sexta · 30 de
 * outubro"). Replaces `<input type="date">`, whose display format follows
 * the browser's locale (mm/dd/yyyy in an en-US browser), not the page's.
 *
 *   <Field label="Dia">
 *     <DateSelect name="bookingDate" days={instructorDays} count={8} placeholder="Escolhe um dia" />
 *   </Field>
 *
 * Options start at Lisbon today. `days` keeps only those weekdays (DB
 * keys "mon" … "sun"), `count` is how many dates to offer (default 28).
 * Submits "YYYY-MM-DD". A value outside the list (an existing booking's
 * date) is kept as an extra option rather than silently dropped.
 */
type DateSelectProps = Omit<React.ComponentProps<typeof Select>, "children" | "value" | "defaultValue"> & {
  value?: IsoDate
  defaultValue?: IsoDate
  /** How many dates to offer. */
  count?: number
  /** Only these weekdays. */
  days?: readonly DayKey[]
  /** Optional empty first option ("Escolhe um dia"). */
  placeholder?: string
}

function DateSelect({
  value,
  defaultValue,
  count = 28,
  days,
  placeholder,
  ...props
}: DateSelectProps) {
  // A string key so a new `days` array each render doesn't recompute.
  const daysKey = days?.join(",")
  const options = React.useMemo(() => {
    const only = daysKey === undefined ? undefined : (daysKey.split(",").filter(Boolean) as DayKey[])
    const list = upcomingDates(count, { days: only })
    const extra = [value, defaultValue].filter((v): v is IsoDate => !!v && !list.includes(v))
    return extra.length ? [...list, ...extra].sort() : list
  }, [count, daysKey, value, defaultValue])

  const initial = defaultValue ?? (placeholder !== undefined ? "" : undefined)
  return (
    <Select {...props} {...(value !== undefined ? { value } : { defaultValue: initial })}>
      {placeholder !== undefined && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((date) => (
        // "Hoje" can flip at midnight between the server and client render.
        <option key={date} value={date} suppressHydrationWarning>
          {formatDayDate(date)}
        </option>
      ))}
    </Select>
  )
}

export { DateSelect }
