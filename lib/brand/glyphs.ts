/**
 * SurfSync DS wave glyphs (§08) — bathymetric single-line drawings
 * redrawn from the manual's concepts (80×80 grid, 1.4 stroke).
 * Each glyph maps to ONE concept (DESIGN.md) — never reuse for a
 * second meaning.
 */
export const GLYPHS = {
  // Incoming swell — stacked curves
  swell: [
    "M 12 52 C 20 40, 36 40, 44 52",
    "M 20 62 C 30 48, 50 48, 60 62",
    "M 8 42 C 14 33, 26 33, 32 42",
  ],
  // Point break — wave with crest line
  break: [
    "M 10 50 C 24 30, 50 30, 64 50",
    "M 18 50 C 30 36, 48 36, 58 50",
  ],
  // Tide level — rhythmic horizon
  tide: [
    "M 10 40 L 70 40",
    "M 16 52 L 64 52",
    "M 24 64 L 56 64",
  ],
  // Offshore wind — drifting strokes
  wind: [
    "M 14 36 C 28 30, 44 42, 60 36",
    "M 12 50 C 30 44, 48 56, 66 50",
    "M 16 62 C 30 58, 44 66, 58 62",
  ],
  // Conditions clear — radiant circle (core + rays, no full ring)
  sun: [
    "M 40 26 C 46.6 26, 52 31.4, 52 38 C 52 44.6, 46.6 50, 40 50 C 33.4 50, 28 44.6, 28 38 C 28 31.4, 33.4 26, 40 26",
    "M 40 12 L 40 18",
    "M 40 58 L 40 64",
    "M 14 38 L 20 38",
    "M 60 38 L 66 38",
    "M 22 20 L 26 24",
    "M 54 52 L 58 56",
    "M 58 20 L 54 24",
    "M 26 52 L 22 56",
  ],
  // Spot located — directional rose: ring + inner 4-point star
  compass: [
    "M 40 12 C 55 12, 68 25, 68 40 C 68 55, 55 68, 40 68 C 25 68, 12 55, 12 40 C 12 25, 25 12, 40 12",
    "M 40 20 L 46 40 L 40 60 L 34 40 Z",
    "M 20 40 L 40 34 L 60 40 L 40 46 Z",
  ],
  // Lesson start — 12-hour face with hands
  clock: [
    "M 40 12 C 55 12, 68 25, 68 40 C 68 55, 55 68, 40 68 C 25 68, 12 55, 12 40 C 12 25, 25 12, 40 12",
    "M 40 40 L 40 24",
    "M 40 40 L 52 46",
  ],
  // Crew paired — two figures side by side
  pair: [
    "M 16 24 C 16 17.2, 21.4 12, 28 12 C 34.6 12, 40 17.2, 40 24 C 40 30.8, 34.6 36, 28 36 C 21.4 36, 16 30.8, 16 24",
    "M 16 68 C 16 52, 21 44, 28 40 C 35 44, 40 52, 40 68",
    "M 50 26 C 50 20.6, 54.2 16, 59 16 C 63.8 16, 68 20.6, 68 26 C 68 31.4, 63.8 36, 59 36 C 54.2 36, 50 31.4, 50 26",
    "M 50 68 C 50 54, 54 47, 59 44 C 64 47, 68 54, 68 68",
  ],
} as const satisfies Record<string, readonly string[]>;

export type GlyphName = keyof typeof GLYPHS;
