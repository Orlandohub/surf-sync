/**
 * surfsync DS (COMPONENTS.md "Text field") — the one recipe every form
 * control shares (Input, Textarea, Select, TimeSelect): card fill, 1px
 * `border-input`, `rounded-control`, `text-body-lg` (16px stops iOS zoom).
 *
 * Focus: border turns `ring` + 2px ring, 2px offset (DESIGN.md §8).
 * Error (`aria-invalid`, set for you inside <Field error=…>):
 * `border-destructive`, and the focus ring turns destructive too.
 */
export const controlClassName =
  "w-full min-w-0 rounded-control border border-input bg-card text-body-lg text-foreground outline-none " +
  "transition-[border-color,box-shadow] duration-(--duration-fast) ease-move " +
  "placeholder:text-placeholder " +
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive " +
  "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
