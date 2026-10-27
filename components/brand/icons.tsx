import * as React from "react"

/**
 * surfsync's one bespoke glyph (DESIGN.md §10): the calendar-with-wave for
 * availability. Drawn on Lucide's 24px grid with round caps/joins so it
 * sits with Lucide icons; takes the same props (`className`,
 * `strokeWidth`, `size`), `currentColor` always.
 */
export function CalendarWave({
  size = 24,
  strokeWidth = 1.75,
  className,
  ...props
}: React.SVGProps<SVGSVGElement> & { size?: number | string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M6.5 16q1.375-1.75 2.75 0t2.75 0 2.75 0 2.75 0" />
    </svg>
  )
}
