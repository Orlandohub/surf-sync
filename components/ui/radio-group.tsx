"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"

/**
 * surfsync DS — one-of-many choice on Base UI's RadioGroup (role
 * "radiogroup", arrow keys move and check, roving focus). For short
 * options prefer <ChipToggleGroup multiple={false} required>; this is for
 * choices that need room — e.g. the sign-up account-type cards.
 *
 *   <RadioGroup aria-labelledby={labelId} value={type} onValueChange={setType} className="flex flex-col gap-3">
 *     <Radio value="instructor" className="group … data-checked:border-primary">
 *       …title, description, a dot styled with group-data-checked:…
 *     </Radio>
 *   </RadioGroup>
 *
 * Radio has no look of its own: style it and its children with
 * `data-checked:` / `group-data-checked:`. It renders a <span
 * role="radio">, so name it with aria-labelledby (and aria-describedby).
 *
 * Space checks the focused radio. Base UI 1.4.1 doesn't inside a group:
 * its composite Space handling prevents the event before the radio's own
 * click handler, which then bails out. Radio fixes that here, so callers
 * need no key handler.
 */
function RadioGroup<Value>({ ...props }: RadioGroupPrimitive.Props<Value>) {
  return <RadioGroupPrimitive data-slot="radio-group" {...props} />
}

function Radio<Value>({ onKeyDown, ...props }: RadioPrimitive.Root.Props<Value>) {
  return (
    <RadioPrimitive.Root
      data-slot="radio"
      {...props}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (
          event.key !== " " ||
          event.repeat ||
          event.defaultPrevented ||
          event.target !== event.currentTarget ||
          props.disabled ||
          props.readOnly
        ) {
          return
        }
        // The same path as a pointer click: Base UI checks the radio and
        // calls the group's onValueChange. Already checked → no change.
        event.currentTarget.click()
      }}
    />
  )
}

export { RadioGroup, Radio }
