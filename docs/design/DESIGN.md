# surfsync — DESIGN.md

**Ocean Operational UI · v1.0**
Source of truth: *SurfSync — Direção Visual & UI System* (identity deck). Implementation: `tokens.css` (Tailwind v4 + shadcn/ui), component specs in `COMPONENTS.md`, mechanical checks in `scripts/design-lint.mjs`.

Rules in this document use **MUST / NEVER**. Anything tagged `[SSxx]` is checked by the linter; everything else is a review-checklist item (§10).

---

## 1. What we are building

surfsync connects surf schools, instructors and students through location, availability and matching. The deck is explicit that it is **infrastructure for surf instruction**, not a surf app. Every design decision follows from that sentence.

| surfsync is | surfsync is not |
|---|---|
| profissional · tecnológico · humano | app lifestyle |
| premium · operacional · contemporâneo | rede social juvenil |
| | plataforma turística |

The test for any screen: *would an instructor checking it on the sand at 8:50, with wet hands and sun on the glass, get the answer in one look?*

## 2. Philosophy

**Operational first.** Every screen answers *what's next, where, when, with whom, in what conditions*. Data comes before atmosphere. If a decorative element competes with a time, a place or a level, the decoration loses.

**Calm surface, deep water.** Surfaces are light, quiet and mostly white-on-off-white. Depth comes from two things only: one ink (Azul Atlântico) and one current (Teal Oceânico). Nothing else is allowed to shout.

**Brand at the edges, product in the middle.** The wide BD Sans display face, the big cropped wave mark, the black panels — these live on splash, onboarding, auth and marketing. Operational screens (lists, details, calendars, forms, settings) are Inter on off-white with no display type at all. The mockups in the deck already do this; keep it that way.

**Glass is a lens, not a costume.** Translucency exists only where content actually moves behind a surface. It is functional, subtle, and never the point.

**Human, not cute.** Real faces, real beaches, real names. No mascots, no cartoon surfers, no illustrated avatars, no surf slang.

**Fluid, not playful.** Motion settles like a swell — fast in, long out — and only in answer to something the person did.

## 3. Voice & tone

**Language: Português europeu, second person "tu".** The deck mockups drift into Brazilian Portuguese in several places ("Buscar conversas", "avaliou sua aula", "Intermediário"). Those are bugs, not style.

**Voice:** an experienced instructor briefing the group before paddling out — calm, precise, warm, brief. Confident without hype. Says the time, the place and what to do.

**Tone shifts by moment:**

| Moment | Tone | Example |
|---|---|---|
| Routine info | Neutral, terse | "Amanhã · 9:00 · Praia de Carcavelos" |
| Confirmation | Warm, factual | "A tua aula em Carcavelos foi confirmada." |
| Nudge | Helpful, gives the reason | "Sincroniza a tua disponibilidade para receberes mais oportunidades." |
| Error | Plain: what happened + what to do. No apology, no "Ups". | "Não foi possível guardar. Verifica a ligação e tenta novamente." |
| Empty state | An invitation to act | "Ainda não tens aulas marcadas. Define a tua disponibilidade para começares a receber oportunidades." → **Definir disponibilidade** |
| Safety / conditions | Direct, never playful | "Ondulação acima do nível da aula. A escola pode reagendar." |

**Do / Don't**

| Do | Don't |
|---|---|
| "Aula confirmada para amanhã às 9:00." | "Bora! 🤙 A tua sessão épica está marcada!!" |
| "Encontrámos 3 oportunidades que combinam com o teu perfil." | "Uau, temos ondas perfeitas à tua espera! 🌊" |
| "Pesquisar escolas" | "Buscar escolas" |
| "Guardar alterações" | "Salvar" / "Submeter" |
| "A escola cancelou a aula. O valor será devolvido em 3–5 dias úteis." | "Infelizmente algo aconteceu com a tua aula 😢" |

**Vocabulary — PT-PT, enforced `[SS12]`**

| Use | Never |
|---|---|
| Pesquisar | Buscar |
| Guardar | Salvar |
| Utilizador | Usuário |
| Registo / Criar conta | Cadastro |
| Telemóvel | Celular |
| Ecrã | Tela |
| Definições | Configurações |
| Partilhar | Compartilhar |
| Ficheiro | Arquivo |
| Equipa | Time (team) |
| Intermédio | Intermediário |
| a tua / o teu | sua / seu (when addressing the user) |

**Product nouns** — always these, never synonyms: *aula*, *escola*, *instrutor*, *aluno* (not "cliente"), *disponibilidade*, *oportunidade*, *nível*. Levels are exactly **Iniciante · Intermédio · Avançado**.

**Formatting**

- Dates: lowercase months (AO90) — "25 de maio". Relative where it helps: *Hoje*, *Amanhã*, weekday name within 6 days, then the date.
- Time: 24 h. Running text "9:00"; time-slot grids "09:00" (column alignment).
- Separator between date and time: spaced middle dot " · ". One separator per line, maximum.
- Numbers: decimal comma, en-dash ranges, space before units — "0,8–1,2 m", "18–20 °C", "2 h", "4,9 (128 avaliações)", "35 €".
- Sentence case everywhere `[SS09]`. Uppercase only for three-letter weekday labels in calendars (SEG, TER, QUA…).
- Buttons: infinitive verb + object, ≤ 3 words — "Ver aula", "Guardar alterações", "Definir disponibilidade". The one sanctioned first-person CTA is **"Quero participar"** (a request the school still confirms). The resulting toast uses the same verb: *Guardar alterações* → "Alterações guardadas."
- Emoji: none in system copy `[SS13]`. The single exception is the greeting "Olá, João 👋" on Início. User-generated content is never filtered.

## 4. Colour

Five brand colours, one job each.

| Brand colour | Hex | Primitive | Role in product |
|---|---|---|---|
| Azul Atlântico | `#0D1B2A` | `atlantic-950` | Ink. All text, dark surfaces, product "black". |
| Teal Oceânico | `#0EA5A0` | `ocean-500` | Brand graphic teal: logo, illustration, charts, display type ≥ 24 px. |
| Azul Água | `#7EE0CF` | `ocean-300` | Tint/fill on light; **the primary action colour in dark mode**. |
| Off White Oceânico | `#F3F6F8` | `atlantic-50` | App canvas. |
| Sand Tone | `#F2D6A7` | `sand-300` | Warmth. Rare. |

**Why the button teal is darker than the brand teal.** White on `#0EA5A0` is 3.0:1 — it fails WCAG AA for a 15 px label. Interactive teal is therefore `ocean-700 #017473` (5.6:1 with white). This is also what the deck's own mockups render: their buttons and headings are a deeper petrol teal than the swatch. Brand teal and interactive teal are the same hue; it is still one colour.

**Colour rules**

- C1 — **One accent hue.** Teal is the only colour that means "you can act here". No blue links, no purple highlights, no second brand colour, ever `[SS01]`.
- C2 — Components consume **semantic tokens only** (`bg-primary`, `text-muted-foreground`, `bg-tint`). Primitives (`ocean-*`, `atlantic-*`, `sand-*`) appear only in `tokens.css`, charts and illustration. No hex, rgb or oklch literals in components `[SS02]`.
- C3 — `ocean-500` is never text below 24 px and never a fill behind white text.
- C4 — Azul Água is never text on a light surface (1.6:1). On light it is a fill; on dark it is the primary.
- C5 — **Sand is seasoning.** ≤ 5 % of any screen. Allowed: the shore band in tide/condition charts, onboarding/empty-state illustration, a single warm highlight surface (`bg-sand-soft`). Never on buttons, links, focus, borders or text.
- C6 — Product black is Azul Atlântico. Pure `#000` exists only in marketing and deck panels `[SS11]`. (`--color-black` is remapped, so `bg-black/50` overlays are already on-brand.)
- C7 — Status colours (success / warning / destructive) carry state only, always paired with an icon or explicit text. Never decorative. The success green is never used as a brand moment.
- C8 — No gradients in UI chrome `[SS07]`. The one exception is the photo scrim (`scrim`, `scrim-top` utilities) for legibility over imagery.

## 5. Glass

"Glassmorphism subtil e funcional. Nunca exagerado ou futurista."

- G1 — Glass only where something passes behind it: the bottom tab bar, controls floating on photos (back/share on a hero image), sheets over imagery. **Never on a card sitting on a flat background** — there is nothing to see through.
- G1a — **The top app bar is not glass.** It is an opaque `bg-background` bar that gains a `border-border` hairline once content scrolls under it. Over the landing's ink panels and photos the blur turned into a muddy band with dark smudges past the panels' rounded corners, and over the light product pages it looked the same as opaque. The tab bar keeps glass (content passes behind it on every screen).
- G2 — One layer deep. No glass on glass.
- G3 — Use the `glass` utility; never hand-roll `backdrop-blur-*` `[SS06]`. Blur 12 px default, 16 px absolute ceiling; background 64–80 % opaque.
- G4 — No tinted/coloured glass, no glow, no gradient borders, no noise textures, no refraction effects.
- G5 — The utility falls back to an opaque `--card` surface for `prefers-reduced-transparency` and unsupported browsers. Text on glass must still pass AA against the opaque fallback.

## 6. Typography

**Two families, total.**

| Family | Role | Where |
|---|---|---|
| **BD Sans** (the wordmark/deck face; fallback Lexend Zetta) | Display | Splash, onboarding, auth, marketing, deck |
| **Inter** | Everything in the product | All operational UI |

Montserrat appears in the deck as presentation body text; it is not part of the product system.

**Type scale (Inter)** — use the role utilities, not `text-sm/base/lg`.

| Utility | Size / line | Weight | Use |
|---|---|---|---|
| `text-caption` | 12 / 16 | 500 | Tab-bar labels, badges, helper text |
| `text-meta` | 13 / 18 | 400 | "25 de maio · 9:00", secondary lines |
| `text-body` | 15 / 22 | 400 | Default text |
| `text-body-lg` | 16 / 24 | 400 | Inputs (prevents iOS zoom) |
| `text-label` | 15 / 20 | 600 | Buttons, list-item titles |
| `text-title-sm` | 17 / 24 | 600 | App-bar titles, section heads ("Próximas aulas") |
| `text-title` | 20 / 28 | 600 | Detail titles ("Praia de Carcavelos") |
| `text-headline` | 24 / 32 | 600 | Greeting, top-level titles ("Mensagens"), stat values |

**Display scale (BD Sans)** — `text-display-sm` 32 · `text-display` 48 · `text-display-lg` 72 · `text-display-xl` 112. Weight 400.

**Type rules**

- T1 — `font-display` never appears in operational screens `[SS05]`.
- T2 — Display text is always lowercase, weight 400, never below 24 px. This is the deck's signature ("visão do app", "a experiência").
- T3 — UI weights are 400, 500, 600. Nothing heavier `[SS04]`.
- T4 — **No italic.** Neither family has an italic role in the product. Emphasis is weight 500/600 or colour, never slant `[SS03]`.
- T5 — No tracked-out uppercase eyebrows or labels `[SS09]`.
- T6 — Numbers that change, compare or align — stats, times, ratings, prices, slot grids — use `tabular-nums`.
- T7 — Minimum size 12 px. Body copy line length ≤ 70 characters on wide screens.
- T8 — The wordmark is a logo, not text. Never typeset "surfsync" in BD Sans; use the SVG lockup ("surf" regular + "sync" bold, all lowercase).

## 7. Layout, shape, elevation, motion

**Grid & spacing.** 4 px base. Screen gutter 20 px (`px-gutter`), card padding 16 px (`p-card`), gap between cards 12 px (`gap-stack`), between sections 28 px (`gap-section`). The gutter and card padding never grow past those sizes with larger text (`min(1.25rem, 20px)`, `min(1rem, 16px)`): text scales, margins don't, as with iOS Dynamic Type. An inset hairline that starts at a row's text uses `left-rule-icon`, `left-rule-circle` or `left-rule-avatar` (card padding + leading element + gap), never a fixed rem offset, so it stays on the text at any size. No arbitrary pixel values `[SS16]`.

**Touch.** Every interactive element is ≥ 44 × 44 (`size-tap`, or the `tap` utility to extend a smaller visual).

**One job per screen.** Each view has one primary action. On mobile, when that action concludes the screen ("Quero participar", "Guardar alterações"), it is full-width and pinned at the bottom above the tab bar.

**Radius follows hierarchy** — `rounded-chip` 6 → `rounded-thumb` 10 → `rounded-control` 12 → `rounded-card` 16 → `rounded-sheet` 24 → `rounded-panel` 32 (marketing only). A child is always less rounded than its parent. Circles are reserved for avatars, the logo mark, icon buttons and the FAB.

**Elevation is mostly borders.** Cards: white on off-white, 1 px `border`, `shadow-card` (near-invisible). Floating elements (FAB, popovers, menus): `shadow-float`. Sheets and dialogs: `shadow-overlay`. Nothing else `[SS10]`. In dark mode, cards lose their shadow entirely.

**Motion.**

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 100 ms | Press, switch thumb |
| `--duration-fast` | 160 ms | Hover, colour, small fades |
| `--duration-base` | 240 ms | Tabs indicator, accordion, popover |
| `--duration-slow` | 360 ms | Sheets, screen enter |
| `ease-enter` | `cubic-bezier(.22,1,.36,1)` | Things arriving ("swell") |
| `ease-move` | `cubic-bezier(.2,0,0,1)` | Position/size changes |
| `ease-exit` | `cubic-bezier(.4,0,1,1)` | Things leaving — always faster than their entrance |

- M1 — Motion answers an action. No ambient motion on operational screens. The only ambient loop in the product is the Matching orbit (`animate-orbit`, 40 s, stops under reduced motion).
- M2 — No bounce, overshoot, ping, wiggle or parallax `[SS08]`.
- M3 — Reduced motion is honoured globally in `tokens.css`; never override it.

## 8. Accessibility — verified pairings

All semantic pairings were computed against WCAG 2.x. AA requires 4.5:1 for text, 3:1 for large text and UI graphics.

| Pairing (light) | Ratio | | Pairing (dark) | Ratio |
|---|---|---|---|---|
| foreground / background | 16.0 | | foreground / background | 16.0 |
| foreground / card | 17.4 | | foreground / card | 13.8 |
| muted-foreground / background | 6.0 | | muted-foreground / background | 6.5 |
| muted-foreground / muted | 5.5 | | muted-foreground / muted | 4.8 |
| primary-foreground / primary | 5.6 | | primary-foreground / primary | 9.5 |
| primary (as text) / background | 5.2 | | primary (as text) / card | 9.6 |
| secondary-foreground / secondary | 7.3 | | secondary-foreground / secondary | 11.1 |
| tint-foreground / tint (badges) | 6.7 | | tint-foreground / tint | 7.9 |
| destructive-foreground / destructive | 5.0 | | destructive-foreground / destructive | 5.6 |
| ring / background (focus) | 3.8 | | ring / background | 8.1 |
| field-border / card (text fields, selects) | 3.3 | | field-border / card | 3.5 |
| field-border / background | 3.1 | | field-border / background | 4.1 |
| control-off / card (switch track off) | 4.3 | | control-off / card | 3.5 |
| *input / card (outline buttons only)* | *1.7 — decorative, the label identifies the button* | | *input / card* | *1.6* |
| status soft pairs (success / warning / danger) | 6.8 / 7.1 / 7.3 | | status soft pairs | 10.5+ |
| sand-foreground / sand | 7.8 | | | |
| rating star / card (graphic) | 3.6 | | | |
| *brand teal `ocean-500` / white* | *3.0 — graphics & ≥24 px only* | | | |

Further rules: focus is always visible (2 px `ring`, 2 px offset); never colour alone for state; inputs always have a persistent visible label (placeholder is never the label); icons that act have an `aria-label` in PT-PT.

**Field borders.** The border is all that shows where a text field or select is on a white card, so it must reach 3:1 against what is around it (WCAG 1.4.11). Controls use `border-field-border` — `--field-border`, halfway between `atlantic-400` and `atlantic-500` (`#828E9B`; `atlantic-500` in dark mode). The deck's pale `--input` (`atlantic-300`, `#BFC9D1`; `atlantic-700` in dark mode) stays on outline buttons only, whose label already identifies them; never use it for a field.

**Large text.** Every screen must work at 200 % text on a 360 px phone: no page scrolls sideways, no label or value is clipped or truncated (a title wraps, a long word breaks, a badge or button label wraps inside its box), and decorative leading icons give their room to the text in a row under 16rem. Layouts that must change with the text size use size containers with rem breakpoints (`@container`, `@max-3xs:`), not viewport media queries. A row's two-line clamp (a description, an instructor's zones) lifts under 16rem. The one exception is a preview of free text: a booking's note on Início stays at two lines, because its section's "Ver todas" opens the list where the note is shown in full.

## 9. Don't

The fastest way to stay on-brand is to never do these.

**Colour**
- No second primary colour. Teal is the only action hue `[SS01]`.
- No Tailwind default palette (`blue-500`, `gray-400`, `teal-600`…) in components `[SS01]`.
- No hex/rgb/oklch literals or `bg-[#…]` in components `[SS02]`.
- No pure black in product UI `[SS11]`.
- No white text on brand teal `#0EA5A0`. Use `bg-primary`.
- No Azul Água text on light backgrounds.
- No Sand on anything interactive. Sand is seasoning, not sauce.
- No gradients except the photo scrim `[SS07]`.
- No status colour as decoration (no green "success" banners for marketing).

**Type**
- **Italic is not part of the system** `[SS03]`.
- No bold above 600 `[SS04]`.
- No BD Sans in operational screens `[SS05]`; no BD Sans in title case or caps.
- No ALL-CAPS labels or tracked-out eyebrows `[SS09]`.
- No re-typeset wordmark.

**Buttons & actions**
- **No stacked filled buttons.** One filled primary per view; the second action is outline, the third is ghost or link.
- No trailing arrow on commit actions. The `→` means "takes you somewhere" ("Entrar", "Ver aula", "Ver oportunidades") — never on "Guardar", "Quero participar", "Confirmar" or anything destructive.
- No destructive action styled as primary teal.
- No "Submeter", "OK", "Clique aqui".

**Surfaces**
- No glass on flat backgrounds, no glass on glass, no hand-rolled blur `[SS06]`.
- No card inside a card.
- No heavy shadows (`shadow-xl`, `shadow-2xl`, arbitrary shadows) `[SS10]`.
- No arbitrary radius or spacing values `[SS16]`.

**Motion**
- No bounce, ping, wiggle, parallax `[SS08]`.
- No ambient animation outside Matching.
- No entrance animation on every list item.

**Content & imagery**
- No PT-BR vocabulary `[SS12]`.
- No emoji in system copy (one greeting exception) `[SS13]`.
- No surf clichés: shaka 🤙, hibiscus, tiki type, palm icons, sunset filters, "stoked", "épico", "brutal".
- No tourism language: "paraíso", "experiência inesquecível", "descobre o melhor do surf".
- No youth-social patterns: likes, streak flames, confetti, public leaderboards.
- No illustrated or cartoon avatars.

## 10. Imagery, icons, logo

**Photography.** The Atlantic as it actually looks: Portuguese coastline, natural daylight, mist and green cliffs, aerials of whitewater. Colour-true, slightly cool, never oversaturated or filtered. People appear *in context* — paddling, in the lineup, on the sand — not posing for the camera. Lesson thumbnails are 1:1, `rounded-thumb`. Text over photography always sits on a `scrim`.

**Avatars.** Real photos, or initials in `text-tint-foreground` on `bg-tint`. Circles only.

**Icons.** Lucide (shadcn default), outline only, `strokeWidth={1.75}`, 20 px in rows and tiles, 24 px in the tab bar, `currentColor` always. Active state is colour (`text-primary`), not a filled glyph. The custom calendar-with-wave glyph (availability) is the only bespoke icon; draw new ones on the same 24 px grid and stroke.

**Logo.** The wave-in-circle mark plus the lowercase wordmark. The mark may be rendered only in the five brand colours (as in the palette slide). Clear space = ½ mark height on all sides. Minimum: mark 16 px, lockup 88 px wide. Never rotate, outline, shadow, glass or animate it. The oversized, off-canvas cropped mark at very low contrast is a brand-surface device (splash, marketing, empty states) — never behind operational content.

## 11. Enforcement

`node scripts/design-lint.mjs` (run in CI and pre-commit). Errors fail the build; warnings print.

| ID | Level | Catches |
|---|---|---|
| SS01 | error | Tailwind default palette classes (`bg-blue-500`, `text-gray-400`, `teal-600`…) |
| SS02 | error | Colour literals in components: `[#…]`, `[rgb(…)]`, `[oklch(…)]`, inline `#rrggbb` |
| SS03 | error | `italic`, `font-style: italic` |
| SS04 | error | `font-bold`, `font-extrabold`, `font-black`, weight ≥ 700 |
| SS05 | error | `font-display` inside product route folders |
| SS06 | error | `backdrop-blur-*` / `backdrop-filter` outside `tokens.css` |
| SS07 | error | `bg-gradient-*`, `bg-linear-*`, `bg-radial-*`, `bg-conic-*`, `linear-gradient(` |
| SS08 | error | `animate-bounce`, `animate-ping` |
| SS09 | warn | `uppercase`, `tracking-wide(r/st)` |
| SS10 | error | `shadow-xl`, `shadow-2xl`, `shadow-inner`, `shadow-[…]` |
| SS11 | error | `#000`, `#000000`, `rgb(0 0 0)` |
| SS12 | warn | PT-BR vocabulary in strings and locale files |
| SS13 | warn | Emoji in source strings |
| SS14 | warn | More than one filled (default-variant) `<Button>` in a file |
| SS16 | warn | Arbitrary radius / spacing values (`rounded-[…]`, `p-[13px]`) |

Escape hatch, with a reason, reviewed in PR: `// design-lint-disable-next-line SS09 -- calendar weekday labels`.
Strict mode: uncomment `--color-*: initial;` in `tokens.css` and default Tailwind colours stop compiling at all.

**PR checklist (human-judged)**
- [ ] One primary action per view; no stacked filled buttons.
- [ ] Arrows only on forward navigation.
- [ ] Glass only over moving content or imagery.
- [ ] Copy is PT-PT, "tu", sentence case, verb-first CTAs; toast reuses the CTA verb.
- [ ] Dates/numbers formatted per §3.
- [ ] Sand ≤ 5 % of the screen and nowhere interactive.
- [ ] Works in dark mode and at 200 % text size; focus visible on every control.

## 12. Open decisions

1. **BD Sans web licence.** The deck embeds BD Sans Regular/Bold. Confirm the licence covers web/app embedding; until then the stack falls back to Lexend Zetta.
2. **Inter as product face.** Chosen to match the deck's app mockups and for small-size legibility and tabular figures. If the brand insists on Montserrat for UI, swap `--font-sans` and re-check the scale — Montserrat runs ~8 % wider.
3. **Dark mode priority.** Tokens are complete and contrast-checked; the deck shows only light screens. Decide whether dark ships at launch.
