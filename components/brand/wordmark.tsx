/**
 * DS §05 The mark — inline lockup: `surf ~ sync` with the tilde as a
 * wave glyph in italic teal. Renders as text (crisp at any size);
 * the `~` sits in the display serif italic per the manual.
 */
export function Wordmark({
  height = 28,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-baseline font-display leading-none ${className ?? ""}`}
      style={{ fontSize: height }}
    >
      <span>surf</span>
      <span className="display-serif-italic px-1 text-teal-500">~</span>
      <span>sync</span>
    </span>
  );
}
