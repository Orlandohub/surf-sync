# surfsync — COMPONENTS.md

Component specs for the shadcn/ui codebase. Each entry: **purpose → anatomy → variants → states → rules**. Class strings use the utilities defined in `tokens.css`; nothing here needs a raw value. Rules in DESIGN.md always win over this file.

Conventions used throughout: icons are Lucide, `strokeWidth={1.75}`, `size-5` (20 px) unless stated. "Muted" means `text-muted-foreground`. All copy examples are PT-PT.

---

## Actions

### Button

**Purpose.** Triggers an action. The filled primary is the scarcest element in the product.

**Variants** (map onto shadcn's `variant` prop)

| Variant | Look | Use | Per view |
|---|---|---|---|
| `default` (primary) | Filled `bg-primary`, white label | The one main action: "Entrar", "Quero participar", "Guardar alterações" | **max 1** |
| `outline` | Card fill, 1 px `border-input`, ink label | The alternative: "Criar conta" next to "Entrar" | max 1 next to a primary |
| `secondary` (tonal) | `bg-secondary`, teal-ink label | Compact in-card actions where outline is too heavy ("Ver disponibilidade" inside a school card list) | any, never next to a primary |
| `ghost` | No fill; hover `bg-accent` | Tertiary: "Cancelar", toolbar actions | any |
| `link` | Teal text, underline on hover | Inline and header links: "Ver todas" | any |
| `destructive` | Filled `bg-destructive` | Only inside a confirmation dialog/sheet | max 1, replaces primary |
| `glass` | `glass` utility, ink icon | Icon buttons floating on photography (back, share) | — |

**Sizes**

| Size | Height | Use |
|---|---|---|
| `sm` | 36 px (+ `tap` hit area) | Dense rows, back-office tables |
| `default` | 44 px | Standard |
| `lg` | 52 px | Full-width mobile CTA |
| `icon` | 44 × 44 | Icon-only |
| `icon-sm` | 36 × 36 (+ `tap`) | Icon-only on photos, in app bars |

**States.** Hover → `primary-hover` (darker, never lighter/transparent). Pressed → `primary-active` + `scale-98`, `duration-instant`. Focus → 2 px `ring`, 2 px offset. Disabled → 40 % opacity, no pointer. Pending → spinner replaces the leading icon, label switches to the gerund ("A guardar…"), width is locked so the layout doesn't jump.

**Rules**
- No stacked filled buttons. Two equal actions = primary + outline, primary on top (mobile) or right (desktop).
- Trailing `ArrowRight` only on forward navigation ("Entrar", "Ver aula", "Ver oportunidades"). Never on commit or destructive actions.
- Labels: infinitive + object, ≤ 3 words, sentence case. Never "OK", "Submeter", "Clique aqui".
- Icon-only buttons always carry a PT-PT `aria-label` ("Voltar", "Partilhar").
- Full-width `lg` primary pinned at the bottom of a screen sits on `bg-background` with `px-gutter pb-4`, above the tab bar.

```ts
// components/ui/button.tsx — replace buttonVariants
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-control text-label outline-none select-none " +
  "transition-[color,background-color,border-color,transform] duration-(--duration-fast) ease-move active:scale-98 " +
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
  "disabled:pointer-events-none disabled:opacity-40 aria-invalid:ring-2 aria-invalid:ring-destructive " +
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
        outline: "border border-input bg-card text-foreground hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-tint",
        ghost: "text-foreground hover:bg-accent",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline active:scale-100",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        glass: "glass text-foreground hover:bg-card",
      },
      size: {
        sm: "tap h-9 px-3 text-meta font-semibold",
        default: "h-11 px-5",
        lg: "h-13 w-full px-6",
        icon: "size-11 rounded-full",
        "icon-sm": "tap size-9 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)
```

### FAB

Floating compose button, **Mensagens only**. `size-14 rounded-full bg-primary text-primary-foreground shadow-float`, 16 px above the tab bar, right gutter. Icon `Pencil` 24 px. It *is* the view's primary action — no other filled button on that screen. Hides on scroll down, returns on scroll up (`duration-base ease-move`).

---

## Status & labels

### Badge

**Purpose.** Non-interactive metadata: lesson level, duration, verification, status. If it's tappable, it's a chip, not a badge.

| Variant | Classes | Use |
|---|---|---|
| `default` (soft) | `bg-tint text-tint-foreground` | Level (Iniciante / Intermédio / Avançado), duration ("2 h"), "Parceiro" |
| `neutral` | `bg-muted text-muted-foreground` | Low-priority facts ("Grupo", "Privada") |
| `success` | `bg-success-soft text-success-soft-foreground` | "Confirmada", "Escola verificada" (+ `BadgeCheck` icon) |
| `warning` | `bg-warning-soft text-warning-soft-foreground` | "Pendente", "Condições acima do nível" |
| `destructive` | `bg-danger-soft text-danger-soft-foreground` | "Cancelada" |
| `outline` | `border border-border text-muted-foreground` | Secondary tags on dense screens |
| `count` | `bg-primary text-primary-foreground rounded-full` | Unread counts only |

**Rules**
- Max 2 badges per card or row. Level first, then duration.
- Sentence case, no uppercase, no trailing punctuation.
- All three levels share the soft teal style — level is read from the word, not colour-coded. (Colour-coding levels turns them into a traffic light and adds hues.)
- Status variants always include an icon or an unambiguous word.
- Never a solid-filled badge except `count`.

```ts
// components/ui/badge.tsx — replace badgeVariants
export const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1 whitespace-nowrap rounded-chip h-6 px-2 text-caption [&_svg]:size-3.5 [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-tint text-tint-foreground",
        neutral: "bg-muted text-muted-foreground",
        success: "bg-success-soft text-success-soft-foreground",
        warning: "bg-warning-soft text-warning-soft-foreground",
        destructive: "bg-danger-soft text-danger-soft-foreground",
        outline: "border border-border text-muted-foreground",
        count: "h-5 min-w-5 justify-center rounded-full px-1.5 bg-primary text-primary-foreground tabular-nums",
      },
    },
    defaultVariants: { variant: "default" },
  }
)
```

### Rating

`Star` icon 14 px, filled `fill-rating text-rating` (the only filled icon in the product) + value `text-meta font-semibold tabular-nums` ("4,9") + count muted ("(128 avaliações)"). Never five-star rows in lists; one star + number.

---

## Containers

### Card

shadcn `Card`, retuned: `rounded-card border bg-card p-card shadow-card gap-3` (replace the default `rounded-xl py-6 gap-6 shadow-sm`). White on the off-white canvas. Cards stack with `gap-stack`. No card inside a card — nest with a divider or a `bg-muted` inset instead. Whole-card tap targets get `hover:bg-accent/50` and `active:scale-99` on mobile.

### Lesson row (the product's core unit)

```
┌──────────────────────────────────────────────┐
│ ┌──────┐  Praia de Carcavelos              › │
│ │ img  │  25 de maio · 9:00                  │
│ └──────┘  [Intermédio] [2 h]                 │
└──────────────────────────────────────────────┘
```

Card, `flex gap-3 items-center`, min-height 88 px. Thumbnail `size-18 rounded-thumb object-cover` (1:1 photo of the beach). Title `text-label`, meta `text-meta text-muted-foreground`, badges row `mt-1.5`. Trailing `ChevronRight` muted. Entire row is the link; no secondary buttons inside it. Relative date when within 6 days ("Amanhã · 9:00", "Sábado · 11:00").

### Action banner

The "Sincroniza a tua disponibilidade" pattern. Card with leading 48 px circle `bg-tint text-tint-foreground` holding the icon, title `text-label`, one-line reason `text-meta` muted, trailing chevron. **One per screen, at the end of the content**, never above the user's own data. Not dismissible more than once per week. Not sand, not a gradient.

### Stat tile

Two-up grid of cards. Value `text-headline text-primary tabular-nums` ("12", "98%"), label `text-meta` muted below ("Aulas este mês"). Optional sparkline: 1.5 px stroke `stroke-chart-1`, no fill, no axes, no dots except the final point; or a 24 px progress ring (`stroke-chart-1` on `stroke-muted`). Stats always have a period in the label.

### Ocean data tiles

Three-up grid on lesson detail: **Local · Condições · Temperatura**.

`rounded-control border bg-card p-3 text-center`, icon 20 px `text-foreground`, label `text-caption` muted, value `text-meta font-semibold tabular-nums` ("0,8–1,2 m", "18–20 °C"). When conditions exceed the lesson level, the Condições tile switches to `bg-warning-soft text-warning-soft-foreground` with `TriangleAlert` and the value adds a short reason. In charts (tide, swell), water is `chart-1/chart-2`, shore/land is `chart-5` (sand) — the one sanctioned data use of sand.

### Detail over hero

```
┌───────────────── photo (4:3) ─────────────────┐
│ (←)                                      (⇪)  │  glass icon-sm buttons on scrim-top
│                                               │
│ ╭─────────────────────────────────────────╮   │
└─┤ Praia de Carcavelos                     ├───┘  sheet overlaps hero by 24 px
  │ 25 de maio · 9:00                       │      rounded-t-sheet bg-card
  │ [Intermédio] [2 h]                      │
  │ …                                       │
  │ [        Quero participar         ]     │      lg primary, pinned
```

Hero image full-bleed, `scrim-top` behind controls. Content panel `-mt-6 rounded-t-sheet bg-card px-gutter pt-6`. Sections ("Sobre a aula", "Instrutor", "Participantes") use `text-title-sm` heads and `gap-section`. Hero never parallaxes.

---

## Navigation

### Bottom tab bar

Fixed, `glass`, height 56 px + safe-area inset, top hairline from the glass border. 4–5 items, always the same set and order: **Início · Aulas · Mensagens · Escolas · Perfil**. Icon 24 px above `text-caption` label. Inactive: muted. Active: `text-primary`, label `font-semibold`; no pill, no filled glyph, no dot. Unread count on Mensagens uses `Badge variant="count"` offset top-right of the icon. Labels never hide.

### App bar

- **Root tabs:** large left-aligned title `text-headline`, optional trailing icon button (calendar, filter). Becomes `glass` with a centred `text-title-sm` title once content scrolls under it.
- **Pushed screens:** back `ChevronLeft`/`ArrowLeft` icon button left, centred `text-title-sm` title, optional single trailing action.
- Never more than one trailing action; overflow goes into a `DropdownMenu`.

### Tabs (segmented content)

Underline tabs, not shadcn's default pill. `TabsList`: `w-full justify-between bg-transparent border-b border-border rounded-none p-0 h-11`. `TabsTrigger`: `text-label font-medium text-muted-foreground data-[state=active]:text-primary data-[state=active]:font-semibold`. Indicator: 2 px `bg-primary` bar under the active trigger, sliding with `duration-base ease-move`. 2–4 tabs, one word each where possible ("Próximas · Disponíveis · Histórico").

---

## Lists

### Menu row (Perfil, Definições)

Rows grouped in one card, dividers `border-border` inset to the text. Leading icon 20 px muted, label `text-body`, optional trailing value muted, `ChevronRight`. Row height 52 px. Destructive row ("Terminar sessão") is `text-destructive`, no chevron, last in its own group.

### Message row

Avatar 44 px, name `text-label`, last message `text-meta` muted, single line, truncated. Time `text-caption` muted, top-right, `tabular-nums` ("09:30", "Ontem", "2 mai."). Unread: name and preview in `text-foreground font-semibold` + `count` badge. Swipe actions: archive (neutral), never delete-without-undo.

### Notification row

Leading 36 px circle `bg-tint text-tint-foreground` with the event icon (or the actor's avatar). Text `text-body`, actor's name `font-semibold`. Time `text-caption` muted below. Groups headed "Hoje", "Ontem", "Esta semana" in `text-meta font-semibold text-muted-foreground`. Unread rows get a 6 px `bg-primary` dot leading the time — no background highlight.

### School row

Logo 48 px circle (school's own mark on its own colour is allowed — it's their content), name `text-label`, location `text-meta` muted, rating line. "Escola verificada" success badge only on detail, not in lists.

---

## Inputs

### Text field

Label above, `text-meta font-medium`, always visible. Input `h-12 rounded-control border border-input bg-card px-4 text-body-lg placeholder:text-placeholder`. Focus: `border-ring` + ring. Helper text `text-caption` muted below. Error: `border-destructive`, message `text-meta text-destructive` with `CircleAlert` 16 px — says what to fix ("Indica um email válido."). No floating labels, no placeholder-as-label.

### Search

`h-11 rounded-control bg-muted border-transparent pl-10` with leading `Search` icon muted. Placeholder names the object: "Pesquisar conversas", "Pesquisar escolas". Clear button appears once typing.

### Switch

shadcn `Switch`: track `bg-control-off data-[state=checked]:bg-primary`, thumb `bg-card shadow-card`, thumb travel `duration-instant ease-move`. The off track is `--control-off` (atlantic-500, 4.3:1 on a card), not the deck's pale `bg-input` (1.7:1): a switch's state must read at 3:1 (WCAG 1.4.11). Label on the left, switch on the right, full row tappable. Changes in a settings list apply immediately; on a form screen they wait for "Guardar alterações".

### Day chips (weekday selector)

`ToggleGroup type="multiple"`. Each chip `h-9 min-w-12 rounded-full px-3 text-caption`. Off: `bg-muted text-muted-foreground`. On: `bg-primary text-primary-foreground`. Labels SEG TER QUA QUI SEX SÁB DOM — the sanctioned uppercase (`// design-lint-disable-next-line SS09 -- weekday labels`). Multiple selected chips are toggles, not buttons; the one-primary rule doesn't apply.

### Time slots

Vertical list of `h-12 rounded-control border border-border bg-card text-body tabular-nums` rows ("08:00", "09:00"). Selected: `border-2 border-primary bg-secondary text-secondary-foreground font-semibold`. Unavailable slots are **removed**, not struck through or greyed — the list only shows what can be booked. Times always zero-padded here.

### Calendar

shadcn `Calendar`. Month header `text-title-sm`, chevrons as `ghost icon-sm`. Weekday header `text-caption` muted uppercase (SS09 exception). Day cells 40 px, `tabular-nums`. Today: `text-primary font-semibold`. Selected: `bg-primary text-primary-foreground rounded-full`. Days with lessons: 4 px `bg-brand` dot under the number. Outside-month days hidden, not greyed.

---

## People

### Avatar & stack

Circle, sizes 32 (stack, rows), 44 (messages), 88 (profile, matching), 96 (profile hero). Fallback: initials `text-tint-foreground bg-tint font-semibold`. Stack: `-space-x-2`, each `ring-2 ring-card`, max 4 faces then a `+N` circle `bg-muted text-caption font-semibold`. Verified instructor: `BadgeCheck` 16 px `text-primary` after the name, not on the avatar.

---

## Overlays & feedback

### Sheet / Drawer (mobile default)

Bottom sheet for anything modal on mobile. `rounded-t-sheet bg-card shadow-overlay`, grabber 36 × 4 `bg-input rounded-full` centred at top, backdrop `bg-overlay`. Enter `duration-slow ease-enter`, exit `duration-base ease-exit`. Footer actions: primary full-width, ghost "Cancelar" below.

### Dialog (back-office / desktop)

`rounded-card shadow-overlay max-w-md p-6`. Title `text-title` states the consequence ("Cancelar a aula de sábado?"), body says what happens next. Buttons right-aligned: ghost dismiss + one primary (or destructive). The destructive button names the action ("Cancelar aula"), the dismiss names the alternative ("Manter aula").

### Toast (sonner)

`bg-inverse text-inverse-foreground rounded-control shadow-float px-4 py-3 text-body`, above the tab bar, 4 s. Reuses the CTA verb in past participle ("Alterações guardadas.", "Pedido enviado à escola."). Max one action, styled as link in `ocean-300`. Errors that need fixing go inline, not in a toast.

### Empty state

Centred block, max-width 32 ch: optional cropped wave mark at ≤ 8 % contrast behind, title `text-title-sm`, body `text-body` muted (≤ 2 lines, says why it's empty and what to do), one button (primary if it's the only action on screen, otherwise outline). No illustrations of surfers.

### Loading

Skeletons (`bg-muted animate-pulse rounded-*` matching the real shapes) for lists and cards. Spinners only inside a pending button. Never a full-screen spinner after first launch.

---

## Brand surfaces

### Splash / welcome

Full-bleed coastline photo with `scrim`, logo lockup SVG (white or ink depending on photo), headline in Inter `text-headline` ("A conexão que impulsiona o surf."), one-line subhead `text-body`, then **primary "Entrar →" + outline "Criar conta →"** at the bottom (both navigate, so both carry the arrow).

### Matching

The only screen with ambient motion. Three concentric rings `border border-border rounded-full`, user avatar 88 px centred with `ring-4 ring-card shadow-float`, candidate photos (48 px) placed on rings. Rings rotate with `animate-orbit`; avatars counter-rotate to stay upright. Under reduced motion, static. Result sentence `text-body` ("Encontrámos 3 oportunidades que combinam com o teu perfil."), then primary "Ver oportunidades →".

### Marketing / web

This is where BD Sans lives: lowercase display headings (`font-display text-display-lg`), black (`#000`, marketing-only) or Azul Atlântico panels with `rounded-panel`, the oversized cropped mark as a background device, glass sculpture imagery. Body in Inter, gutters 24/48 px, content max-width 1200 px, text max 70 ch. Still one primary CTA per section.

### Back-office (school dashboard)

Same tokens, shadcn `Sidebar` (white, `sidebar-*` tokens). Tables: row 48 px, header `text-meta font-medium text-muted-foreground` sentence case, numbers right-aligned `tabular-nums`, row actions in a trailing `DropdownMenu` (ghost icon-sm). Density via `size="sm"` buttons — never smaller type than 13 px.

---

## In code

Where each spec above lives. Copy goes through next-intl; dates and times through `lib/format.ts`.

| Spec | Import | Notes |
|---|---|---|
| App bar, Bottom tab bar | `components/shell/*` (mounted in `app/layout.tsx`) | Session and unread-notification count read on the server; tabs per user type in `nav-items.ts` (`unread: true` marks the item that carries the count). `--top-chrome` / `--bottom-chrome` CSS vars give the bar heights. Focusable content and `[id]` anchors already keep clear of both bars (scroll-margin in `globals.css`). |
| Page frame | `PageContainer` — `components/shell/page-container` | `<main>`, `max-w-5xl` (or `width="narrow"` = `max-w-2xl`), `px-gutter`, `gap-section`. |
| App bar title | `PageHeader` — `components/ui/page-header` | `text-headline` h1, description, back link, one action. No eyebrow. |
| Section head | `SectionHeading`, `SectionLink` — `components/ui/section-heading` | `text-title-sm`; "Ver todas ›". |
| Button | `Button`, `buttonVariants` — `components/ui/button` | `pending` + `pendingLabel` (width locked); links styled with `buttonVariants()`; `variant="link"` is an inline text link at any size. |
| Badge / status | `Badge` — `components/ui/badge`; `StatusBadge`, `bookingStatusTone/Icon` — `components/brand/status-badge` | One booking-status → tone map for every screen. |
| Card | `Card…` — `components/ui/card` | |
| Lesson row, Action banner, Menu row | `LinkRow`, `RowIcon`, `ActionBanner`, `MenuGroup`, `MenuRow` — `components/ui/list-row` | Max 2 badges per row, status included. |
| Row with actions (booking requests) | `ItemRow` — `components/ui/list-row` | Same anatomy as LinkRow, not a link; `status` + `actions` slots. |
| Notification row | `NotificationGroup`, `NotificationRow` — `components/ui/list-row`; `groupNotifications()` — `lib/format` | Hoje · Ontem · Esta semana · Anteriores. |
| Stat tile | `StatTile` — `components/ui/stat-tile` | |
| Tabs | `Tabs…` — `components/ui/tabs` (client state); `LinkTabs` — `components/ui/link-tabs` (URL state) | Same look. |
| Text field | `Field`, `FieldError` + `Input` / `Textarea` / `Select` / `TimeSelect` / `DateSelect` | `Field` wires label, helper, error and aria onto the control and owns its id. Field errors are announced (live region); a standalone `FieldError` is `role="alert"`. |
| Date picker | `DateSelect` — `components/ui/date-select` | Native select of the next days ("Amanhã · 28 de outubro"), submits `YYYY-MM-DD`. Never `<input type="date">`. |
| Switch | `Switch`, `SwitchRow` — `components/ui/switch` | |
| Day chips | `DayChips`, `ChipToggleGroup` — `components/ui/chip-toggle-group` | `name` submits hidden inputs. |
| Avatar & stack | `Avatar`, `AvatarStack` — `components/ui/avatar` | Sizes 32 / 44 / 88 / 96. |
| Sheet / Dialog | `ConfirmDialog`, `Dialog…` — `components/ui/dialog` | Bottom sheet < md, centred dialog ≥ md. |
| Toast | `toast()` — `components/ui/toast` | `<Toaster />` is in the root layout. |
| Empty state | `EmptyState` — `components/ui/empty-state` | |
| Loading | `Skeleton`, `SkeletonRow` — `components/ui/skeleton` | |
| Availability glyph | `CalendarWave` — `components/brand/icons` | Every `icon` prop takes `IconComponent` (Lucide or ours). |
| Dates & times | `lib/format` | Calendar dates are `YYYY-MM-DD` only; convert timestamps with `lisbonDate()`. Its relative words (Hoje, Amanhã, Ontem, Agora, há N min) are locale data like date-fns' month names — the one exception to "all copy through next-intl". |
