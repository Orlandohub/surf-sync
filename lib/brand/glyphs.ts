/**
 * SurfSync DS wave glyphs (§08) — bathymetric single-line drawings
 * extracted from the design manual (80×80 grid, 1.4 stroke).
 * Each glyph maps to ONE concept (DESIGN.md) — never reuse for a
 * second meaning.
 */
export const GLYPHS = {
  swell: [
    "M 12 52 C 20 40, 36 40, 44 52",
    "M 20 62 C 30 48, 50 48, 60 62",
    "M 8 42 C 14 33, 26 33, 32 42",
  ],
  break: [
    "M 10 50 C 24 30, 50 30, 64 50",
    "M 18 50 C 30 36, 48 36, 58 50",
  ],
  tide: [
    "M 10 40 L 70 40",
    "M 16 52 L 64 52",
    "M 24 64 L 56 64",
  ],
  wind: [
    "M 14 36 C 28 30, 44 42, 60 36",
    "M 12 50 C 30 44, 48 56, 66 50",
    "M 16 62 C 30 58, 44 66, 58 62",
  ],
  sun: [
    "M 40 20 C 52 20, 60 28, 60 40 C 60 52, 52 60, 40 60 C 28 60, 20 52, 20 40 C 20 28, 28 20, 40 20",
  ],
  compass: [
    "M 40 12 C 55 12, 68 25, 68 40 C 68 55, 55 68, 40 68 C 25 68, 12 55, 12 40 C 12 25, 25 12, 40 12",
    "M 46 34 L 58 22 L 34 46 L 22 58 Z",
  ],
  clock: [
    "M 40 12 C 55 12, 68 25, 68 40 C 68 55, 55 68, 40 68 C 25 68, 12 55, 12 40 C 12 25, 25 12, 40 12",
  ],
  pair: [
    "M 24 24 C 24 17.2, 29.4 12, 36 12 C 42.6 12, 48 17.2, 48 24 C 48 30.8, 42.6 36, 36 36 C 29.4 36, 24 30.8, 24 24",
    "M 44 68 C 44 52, 40 44, 36 40 C 44 44, 60 44, 68 36 C 72 46, 70 60, 64 68",
  ],
} as const satisfies Record<string, readonly string[]>;

export type GlyphName = keyof typeof GLYPHS;
