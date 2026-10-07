# Design Brief

## Direction

Aurum Commerce — a premium Russian e-commerce storefront («Интернет-магазин») with a confident indigo-violet identity and warm amber accents.

## Tone

Refined modern commerce: minimalist, generous whitespace, rounded surfaces and soft layered shadows — polished, never template-like.

## Differentiation

A deep indigo-violet brand paired with warm amber highlights and warm-tinted neutrals; product cards lift on a violet-tinted shadow at hover, giving a tactile, premium shelf feel.

## Color Palette

| Token      | Light OKLCH  | Dark OKLCH   | Role                        |
| ---------- | ------------ | ------------ | --------------------------- |
| background | 0.985 0.004 85 | 0.155 0.022 285 | Warm canvas / indigo night |
| foreground | 0.19 0.018 285 | 0.95 0.008 285 | Primary text              |
| card       | 1.0 0.002 85  | 0.195 0.025 285 | Product & panel surfaces  |
| primary    | 0.46 0.21 285  | 0.68 0.19 290  | Brand CTAs, links, active |
| accent     | 0.72 0.155 78  | 0.78 0.15 80   | Amber highlights, badges  |
| muted      | 0.955 0.008 85 | 0.235 0.024 285 | Section fills, skeletons |

## Typography

- Display: Space Grotesk — hero, section headings, prices, logo
- Body: Figtree — paragraphs, labels, navigation, UI text
- Mono: Geist Mono — SKUs, order numbers, price badges
- Scale: hero `text-5xl md:text-7xl font-bold tracking-tight`, h2 `text-3xl md:text-4xl font-bold tracking-tight`, label `text-xs font-semibold tracking-widest uppercase`, body `text-base md:text-lg`

## Elevation & Depth

Flat warm canvas; surfaces sit on `shadow-subtle` by default, product cards on `shadow-product`, and hover lifts to `shadow-product-hover` with a violet-tinted glow. Popovers use `shadow-elevated`.

## Structural Zones

| Zone    | Background          | Border     | Notes                                             |
| ------- | ------------------- | ---------- | ------------------------------------------------- |
| Header  | `bg-card/80 backdrop-blur` | `border-b` | Sticky, translucent, search + cart + theme toggle |
| Content | `bg-background`     | —          | Alternate every other section with `bg-muted/40`  |
| Footer  | `bg-muted/50`       | `border-t` | Multi-column links, payment icons, muted text     |

## Spacing & Rhythm

Sections separated by `py-16 md:py-24`; content grouped in `gap-6` grids; micro-spacing in `space-y-2`/`space-y-4`; page container `max-w-7xl px-4 md:px-6`.

## Component Patterns

- Buttons: `rounded-full` pills; primary = indigo gradient, secondary = `bg-secondary`, ghost = transparent; hover `-translate-y-0.5` + shadow, `transition-smooth`
- Cards: `rounded-2xl` `bg-card` with `border` and `shadow-product`; product image on `bg-muted` plate; hover lifts card and zooms image `scale-105`
- Badges: `rounded-full` pills — discount = amber `bg-accent`, new = primary, in-stock = success
- Inputs: `rounded-xl` `bg-background` `border-input`, focus `ring-2 ring-ring/40`
- Navigation: pill links with `bg-muted` active state; mobile bottom bar `bg-card/95 backdrop-blur border-t`

## Motion

- Entrance: `animate-fade-up` 0.5s staggered on section reveal; skeleton `animate-pulse` for loading
- Hover: `transition-smooth` 0.3s — lift, image zoom, color shift; no bounce
- Decorative: `animate-float` on hero accent only; shimmer on image loading

## Constraints

- Never use raw hex/rgb or arbitrary color classes — semantic tokens only
- Both themes must meet AA+ contrast; dark is intentionally tuned, not inverted
- Motion stays subtle — no more than one decorative animation per view
- Fully responsive: mobile bottom nav, tablet 2-col, desktop 4-col product grids

## Signature Detail

The violet-tinted hover shadow on product cards (`shadow-product-hover`) — a warm-to-violet elevation that makes browsing feel like handling premium goods.
