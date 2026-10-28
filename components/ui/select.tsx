"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { controlClassName } from "@/components/ui/control"
import { useFieldControlProps } from "@/components/ui/field"

/**
 * surfsync DS — Select. A styled native <select>: the text-field recipe
 * (h-12, rounded-control, text-body-lg) with a muted ChevronDown. Native
 * on purpose — the OS picker is the most usable one on a phone, it works
 * with forms and Server Actions, and it is accessible for free.
 *
 *   <Field label="Zona">
 *     <Select name="location" defaultValue="">
 *       <option value="">Qualquer zona</option>
 *       {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
 *     </Select>
 *   </Field>
 *
 * `className` is layout only (width, margins) and goes on the wrapper,
 * which the select fills. To restyle the control itself (rare) use
 * `selectClassName`.
 *
 * Long values: a native select shows its value on one line, so a long
 * option label truncates ("Esco…" at 200% text on a phone). For short
 * values that must always show (times), give the select a rem-based
 * minimum width (TimeSelect has one) and let the row around it wrap. For
 * long ones (a date, "Amanhã · 28 de outubro") pass `wrap`: once
 * hydrated, the value is drawn by a copy that wraps (the field grows
 * taller), laid over the select, which stays the control — focus, the OS
 * picker, the accessible name and value are all still the native ones.
 */
function Select({
  className,
  selectClassName,
  wrap = false,
  children,
  ref,
  onChange,
  ...props
}: React.ComponentProps<"select"> & {
  /** Classes for the <select> itself; `className` sizes the wrapper. */
  selectClassName?: string
  /** Long option labels wrap instead of truncating (see above). */
  wrap?: boolean
}) {
  const fieldProps = useFieldControlProps(props)
  const own = React.useRef<HTMLSelectElement>(null)
  // The shown option's text; null until hydrated (and without `wrap`), so
  // the server render and a no-JS page show the plain native select.
  const [shown, setShown] = React.useState<string | null>(null)
  const sync = React.useCallback(() => {
    if (wrap) setShown(own.current?.selectedOptions[0]?.text ?? "")
  }, [wrap])
  // After every render: a controlled value or new options may change it
  // (setState bails out when the text is the same).
  React.useLayoutEffect(sync)
  const setRef = React.useCallback(
    (node: HTMLSelectElement | null) => {
      own.current = node
      if (typeof ref === "function") return ref(node)
      if (ref) ref.current = node
    },
    [ref]
  )
  const overlay = wrap && shown !== null

  return (
    // grid-cols-1 (minmax(0, 1fr)): the field is as wide as its container,
    // never as wide as its longest word; a word that can't fit breaks.
    <div data-slot="select" className={cn("relative w-full", overlay && "grid grid-cols-1", className)}>
      <select
        ref={setRef}
        data-slot="select-control"
        className={cn(
          controlClassName,
          // The chevron's gutter (pr-10) stays as small as it can: every rem
          // of padding doubles at 200% text and comes out of the value.
          "h-12 cursor-pointer appearance-none truncate pr-10 pl-4 tabular-nums",
          // The copy below draws the value; the select fills its cell (as
          // tall as the copy) and keeps the border, focus ring and states.
          // Options keep their colour in the OS list.
          overlay && "peer col-start-1 row-start-1 h-auto min-h-12 text-transparent disabled:text-transparent *:text-foreground",
          selectClassName
        )}
        onChange={(event) => {
          onChange?.(event)
          sync()
        }}
        {...fieldProps}
      >
        {children}
      </select>
      {overlay ? (
        // The value uses the full width; the chevron floats after it, at
        // the right end of its last line (where a one-line value has it
        // anyway), or under it when that line is full. In forced-colors
        // mode the select's own text shows again (system colours override
        // transparent), so the copy steps aside.
        <span
          aria-hidden
          data-slot="select-value"
          className="pointer-events-none col-start-1 row-start-1 self-center py-2.5 pr-3 pl-4 text-body-lg text-pretty wrap-break-word hyphens-auto text-foreground tabular-nums peer-disabled:text-muted-foreground forced-colors:hidden"
        >
          {shown}
          <ChevronDown strokeWidth={1.75} className="float-right ms-2 mt-0.5 size-5 text-muted-foreground" />
        </span>
      ) : (
        <ChevronDown
          aria-hidden
          strokeWidth={1.75}
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground"
        />
      )}
    </div>
  )
}

export { Select }
