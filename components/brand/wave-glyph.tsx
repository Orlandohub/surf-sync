import { GLYPHS, type GlyphName } from "@/lib/brand/glyphs";

/**
 * SurfSync DS wave glyphs (§08) — single-line bathymetric drawings,
 * 1.4 stroke on an 80×80 grid. Each glyph maps to ONE concept.
 */
export function WaveGlyph({
  name,
  size = 24,
  className,
}: {
  name: GlyphName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      {GLYPHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
