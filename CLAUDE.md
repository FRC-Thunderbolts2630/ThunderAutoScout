# FRC Auto Scout — Claude Guidelines

## Skills (Always Active)

Two skills are installed and must be applied to **all** UI/UX work in this project:

- **`ui-ux-pro-max`** — Comprehensive design intelligence. Priority rules to follow always:
  - P1 Accessibility: contrast ≥4.5:1, aria-labels on icon-only buttons, keyboard nav
  - P2 Touch & Interaction: min 44×44px touch targets, disable buttons during async, show loading feedback
  - P4 Style: SVG icons (Heroicons) — **never emoji as icons**, consistent icon stroke style
  - P7 Animation: 150–300ms transitions, use `transition-colors` / `opacity`, not width/height
  - P8 Forms & Feedback: progressive disclosure (don't show complex controls upfront), loading → success/error states

- **`frontend-design`** — Production-grade aesthetics. Chosen direction: **industrial/utilitarian refined minimalism**
  - Competition tool under pressure — clarity and speed over decoration
  - Committed palette: deep slate bg (`#0F172A`), green accent (`#22C55E`), subtle borders (`white/10`)
  - Typography system: Barlow Condensed (headings/labels) + Barlow (body)
  - No decorative animations — every motion must convey state or cause-effect

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0F172A` | Page background |
| Surface | `bg-[#1a1f2e]` / `bg-white/5` | Cards, panels |
| Accent | `#22C55E` / `green-500` | Success, set state, CTA |
| Red alliance | `text-red-400` / `bg-red-950/20` | Red robot cards |
| Blue alliance | `text-blue-400` / `bg-blue-950/20` | Blue robot cards |
| Border | `border-white/10` | Subtle separators |
| Text primary | `text-white` | Headings, values |
| Text muted | `text-gray-400` / `text-gray-500` | Labels, secondary |
| Mono values | `font-mono font-bold text-green-400` | Time values |

## UI Rules for This Project

1. **No emoji in buttons, status, or navigation** — use Heroicons (outline for actions, solid for confirmation)
2. **Progressive disclosure** — show only what's needed; reveal complexity on demand (e.g. match start slider hidden until user clicks "Adjust")
3. **Loading states** — every async op >300ms shows a spinner or skeleton; buttons disable during async
4. **Time display** — always `font-mono` for time values (tabular figures, no layout shift)
5. **Alliance colors** — red and blue alliance theming is semantic and must be consistent
6. **Touch targets** — minimum 32px height on desktop controls (competition use, gloves-friendly)
7. **Save feedback** — save button must cycle: idle → loading (disabled) → success/error

## Stack

- Next.js 14 App Router (RSC + Client Components)
- Tailwind CSS (no arbitrary values where tokens exist)
- Heroicons (`@heroicons/react/24/outline` for actions, `@heroicons/react/24/solid` for status)
- MongoDB for scouting data, TBA API for match/team data
