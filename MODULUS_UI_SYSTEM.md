# MODULUS — UI & Design System for AI Agent

> This file defines every visual and interaction decision for MODULUS.
> Read this entire file before writing any UI code. Every component, every screen, every detail must follow what is described here. Never deviate from this system.

---

## 1. Design Identity

MODULUS uses **NeoBrutalism + Memphis Design**. This is the non-negotiable visual language of the entire app.

### What This Means in Practice

**NeoBrutalism** means:
- Heavy, visible black borders (2px to 3px solid black) on cards, buttons, and inputs
- Bold offset drop shadows (4px to 6px solid black, no blur) — the "sticker on paper" effect
- Flat, solid fills — no gradients, no glassmorphism, no blur effects
- Elements feel physical, tactile, and stamped onto the page

**Memphis Design** means:
- Geometric decorative shapes used as background accents and dividers (dots, squiggles, triangles, stars, checker patterns)
- Playful but structured — shapes are intentional, not random
- Bold colour blocking in constrained areas
- Patterns used sparingly as texture, not wallpaper

**Together they create**: an app that feels bold, confident, modern, and student-friendly — like a well-designed zine or a premium sticker pack, not a corporate SaaS tool.

---

## 2. Colour System

Use these exact values. Store them all as CSS custom properties on `:root`.

### Core Palette

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#FFD600` | Primary buttons, active states, highlights, badges |
| `--color-danger` | `#FF3B30` | Destructive actions, error states, delete buttons, alerts |
| `--color-black` | `#0A0A0A` | All borders, shadows, body text, icon strokes |
| `--color-white` | `#FFFFFF` | Page background, card fills, input backgrounds |
| `--color-surface` | `#F5F5F0` | Subtle off-white for secondary surfaces (sidebar bg, code blocks) |
| `--color-muted` | `#E8E8E0` | Dividers, disabled states, placeholder fills |
| `--color-text-primary` | `#0A0A0A` | All primary readable text |
| `--color-text-secondary` | `#555550` | Metadata, timestamps, helper text |
| `--color-text-muted` | `#999990` | Placeholder text, disabled labels |

### Accent Colours (Memphis Palette — for decorative shapes only)

These are used only for decorative Memphis shapes, pattern fills, and illustration accents. Never use them for text or interactive elements.

| Token | Hex |
|---|---|
| `--color-accent-blue` | `#0057FF` |
| `--color-accent-green` | `#00C853` |
| `--color-accent-orange` | `#FF6B00` |
| `--color-accent-pink` | `#FF3CAC` |

### Rules
- **No gradients anywhere.** Backgrounds, buttons, cards — all flat solid fills.
- **No opacity washes on colour.** Use the full hex value or don't use it.
- The primary yellow (`#FFD600`) should feel like a highlight marker — punchy and purposeful.
- Red (`#FF3B30`) is reserved for danger and destruction only. Do not use it decoratively.

---

## 3. Typography

Use these exact font families. Load them from Google Fonts.

### Font Families

| Role | Font | Weight Used |
|---|---|---|
| Headlines & Display | **Plus Jakarta Sans** | 700 (Bold), 800 (ExtraBold) |
| Body Text | **Be Vietnam Pro** | 400 (Regular), 500 (Medium) |
| Labels & Technical | **Space Grotesk** | 400, 500 |

### Type Scale

| Name | Size | Font | Weight | Letter Spacing | Line Height |
|---|---|---|---|---|---|
| Display | 3rem (48px) | Plus Jakarta Sans | 800 | -0.02em | 1.1 |
| H1 | 2.25rem (36px) | Plus Jakarta Sans | 700 | -0.02em | 1.15 |
| H2 | 1.75rem (28px) | Plus Jakarta Sans | 700 | -0.015em | 1.2 |
| H3 | 1.375rem (22px) | Plus Jakarta Sans | 700 | -0.01em | 1.25 |
| Body Large | 1.125rem (18px) | Be Vietnam Pro | 400 | 0 | 1.65 |
| Body | 1rem (16px) | Be Vietnam Pro | 400 | 0 | 1.6 |
| Body Small | 0.875rem (14px) | Be Vietnam Pro | 400 | 0 | 1.55 |
| Label | 0.875rem (14px) | Space Grotesk | 500 | 0.01em | 1.4 |
| Caption | 0.75rem (12px) | Space Grotesk | 400 | 0.02em | 1.4 |

### Rules
- Headlines always use Plus Jakarta Sans. Never use it for body copy.
- Body copy always uses Be Vietnam Pro. Line height must always be comfortable (1.55 minimum).
- Metadata (file sizes, timestamps, member counts, tags) always use Space Grotesk.
- Never use system fonts, Inter, Roboto, or Arial anywhere in this app.

---

## 4. Spacing System

Use an 8px base unit. All spacing values are multiples of 8.

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Tight inline gaps (icon + label) |
| `--space-2` | 8px | Small internal padding |
| `--space-3` | 12px | Compact component padding |
| `--space-4` | 16px | Standard padding |
| `--space-5` | 24px | Card internal padding |
| `--space-6` | 32px | Section gaps |
| `--space-7` | 48px | Large section separators |
| `--space-8` | 64px | Page-level vertical rhythm |

**Be generous with whitespace.** Crowded layouts are not the MODULUS aesthetic. When in doubt, add more space.

---

## 5. Borders, Radius & Shadows

These are the most important NeoBrutalist details. Apply them consistently.

### Borders
- **Standard border**: `2px solid var(--color-black)`
- **Heavy border** (for primary CTAs and featured cards): `3px solid var(--color-black)`
- All interactive elements (buttons, inputs, cards, modals) must have a visible black border.

### Border Radius
- **Cards**: `1.5rem` (24px) — large and rounded
- **Featured/Hero cards**: `2rem` (32px)
- **Buttons**: `0.875rem` (14px) — rounded but not pill
- **Inputs**: `0.75rem` (12px)
- **Tags/Badges**: `6.25rem` (100px) — full pill
- **Small chips**: `0.5rem` (8px)

### Shadows (NeoBrutalist Offset)
Shadows are **solid black with zero blur**. They create the "lifted sticker" effect.

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `3px 3px 0px var(--color-black)` | Small interactive elements, tags |
| `--shadow-md` | `4px 4px 0px var(--color-black)` | Standard cards, inputs on focus |
| `--shadow-lg` | `6px 6px 0px var(--color-black)` | Featured cards, modals, primary CTA buttons |
| `--shadow-xl` | `8px 8px 0px var(--color-black)` | Drawers, dropdown menus |

**Hover interaction for shadows**: On hover, elements with shadows shift by the shadow offset in the opposite direction and the shadow disappears — creating a "press" effect. For example: a card with `shadow-md` (4px 4px) shifts `translate(4px, 4px)` on hover and shadow becomes 0. Use `transition: all 0.15s ease` for this.

---

## 6. Component Patterns

### Buttons

There are three button types:

**Primary Button**
- Background: `#FFD600`
- Border: `3px solid #0A0A0A`
- Shadow: `--shadow-lg` (6px 6px 0 black)
- Text: Plus Jakarta Sans, 700, `#0A0A0A`
- Hover: translate(6px, 6px), shadow disappears, slight darken on fill
- Radius: `0.875rem`

**Secondary Button**
- Background: `#FFFFFF`
- Border: `2px solid #0A0A0A`
- Shadow: `--shadow-md`
- Text: Plus Jakarta Sans, 700, `#0A0A0A`
- Hover: translate(4px, 4px), shadow disappears

**Danger Button**
- Background: `#FF3B30`
- Border: `2px solid #0A0A0A`
- Shadow: `--shadow-md`
- Text: Plus Jakarta Sans, 700, `#FFFFFF`
- Hover: translate(4px, 4px), shadow disappears

Never use ghost buttons, text-only buttons, or icon-only unlabelled buttons for primary actions.

### Cards

All cards have:
- Background: `#FFFFFF`
- Border: `2px solid #0A0A0A`
- Border Radius: `1.5rem`
- Shadow: `--shadow-md`
- Internal padding: `--space-5` (24px)
- Hover: translate(4px, 4px), shadow disappears, `transition: all 0.15s ease`

Featured or highlighted cards may use a yellow (`#FFD600`) or surface (`#F5F5F0`) background fill instead of white.

### Inputs & Form Fields

- Background: `#FFFFFF`
- Border: `2px solid #0A0A0A`
- Border Radius: `0.75rem`
- Shadow: none by default, `--shadow-md` on focus
- Font: Be Vietnam Pro, 16px
- Placeholder: Space Grotesk, `--color-text-muted`
- Label above input: Space Grotesk, 500, 14px, `--color-text-primary`
- Error state: border becomes `#FF3B30`, error message in Be Vietnam Pro, 14px, red below input

### Tags & Badges

- Full pill radius (`100px`)
- Border: `1.5px solid #0A0A0A`
- Shadow: `--shadow-sm`
- Background: `#FFD600` for primary tags, `#F5F5F0` for neutral tags
- Font: Space Grotesk, 500, 12px
- Padding: 4px 12px

### Modals & Drawers

- Background: `#FFFFFF`
- Border: `3px solid #0A0A0A`
- Border Radius: `2rem` on modals, `1.5rem` top corners on bottom-sheet drawers
- Shadow: `--shadow-xl`
- Backdrop: `rgba(10, 10, 10, 0.5)` — no blur
- Enter animation: slide up + fade in (Framer Motion)
- Exit animation: slide down + fade out

---

## 7. Memphis Decorative Elements

Memphis shapes are used as background texture and section decoration. They are never interactive.

### When to Use
- Auth pages (login/signup) — rich Memphis pattern in the background panel
- Empty states — a central illustration surrounded by floating Memphis shapes
- Community banners — geometric shapes in corners
- Section dividers — a row of small repeating shapes (dots, stars, triangles)

### Shape Rules
- Shapes use the accent colour palette (`--color-accent-blue`, `--color-accent-green`, `--color-accent-orange`, `--color-accent-pink`) plus black and yellow
- Shapes are: filled circles, outlined squares, squiggly lines, 5-pointed stars, triangles, checker squares, diagonal stripes
- Shapes always have a black stroke (`1.5px to 2px`)
- Shapes are placed with intention — corners, behind headlines, as list bullet replacements
- Never overcrowd. 3 to 5 shapes per decorative zone maximum.
- Shapes are `pointer-events: none` and `user-select: none`

---

## 8. Navigation Layout

MODULUS uses a **hybrid navigation** approach.

### Global Top Navigation Bar

Present on all authenticated pages. Contains:
- **Left**: MODULUS wordmark (Plus Jakarta Sans, 800, 24px, black on yellow pill background)
- **Centre**: Global search bar (search Communities and own Vault)
- **Right**: User avatar button (opens profile dropdown), link to Vault, link to Explore

Style: white background, `2px solid #0A0A0A` bottom border, no shadow, height 64px, generous horizontal padding.

### Community Sidebar (Left)

Present only when inside a Community (`/c/:id/*`). Contains:
- Community name and banner at the top (with role badge)
- Sub-navigation links: Vault, Tasks, Threads, Focus, Circles
- Member count at the bottom
- Collapsible: collapses to icon-only (56px wide). Expands to 240px.

Style: `#F5F5F0` background, `2px solid #0A0A0A` right border, no shadow. Active nav item gets a yellow (`#FFD600`) background fill with black border on the left side.

### Page Layout Grid

All page content sits in a centred container. Max width `1280px`. Horizontal padding `32px` on desktop, `16px` on mobile.

---

## 9. Page-by-Page UI Notes

### Auth Pages (`/login`, `/signup`, `/reset`)
- Two-column layout on desktop: left column is a bold Memphis illustration panel (yellow background, large Memphis shapes, MODULUS wordmark large), right column is the form.
- Single column on mobile (form only).
- Form card has white background, `2px solid black` border, `1.5rem` radius, `--shadow-lg`.

### Profile Setup Wizard (`/setup`)
- Full-page centred card, white background, `2rem` radius, `--shadow-xl`, `3px solid black`.
- Step indicator at top: small numbered circles, active step filled yellow.
- Each step is a single focused form section. Skip button top right. Progress dots bottom.

### Vault Page (`/vault`)
- Left panel: folder tree (collapsible, 220px wide)
- Main area: file grid (3 columns desktop, 2 tablet, 1 mobile) OR list view (user can toggle)
- File cards: white background, `2px black border`, `1.5rem radius`, `--shadow-md`. Shows file type icon (coloured by type), filename, size in Space Grotesk, tags below.
- Upload button: primary yellow button, always pinned top right of main area.
- Quota bar: thin progress bar at top of page. Turns red when above 80%.

### Explore Page (`/explore`)
- Hero search bar centre, large (full-width, `3rem` height, `1rem` radius, `3px border`, `--shadow-lg`).
- Community cards in a responsive grid. Each card shows banner, name (H3), member count, category tags, and a Join/Request button.

### Community Layout (`/c/:id`)
- Top nav stays. Left sidebar appears (Community-specific).
- Main content area fills the rest.
- Sub-pages (Vault, Tasks, Threads, Focus, Circles) render in the main content area.

### Community Vault
- Same grid/list toggle as Personal Vault.
- Community folder nav on the left (narrower than personal, 180px).
- Each file card has an extra "Save to My Vault" button (secondary style) if the viewer doesn't own the file.

### Tasks Panel
- Each task is a full-width card. Left side: checkbox + task title + creator name. Right side: progress bar showing community-wide completion %, and a member count of completors.
- Pending (suggested) tasks shown in a separate section below with "Approve / Reject" buttons for Owner/Curator.

### Discussion Threads
- Thread list: each thread is a card. Left: vote column (upvote/downvote count). Right: post content, author, type badge (Question/Text/Image), reply count.
- Thread detail view: full thread at top, replies nested below with indent lines.
- Composer: card-style textarea with post type selector (tab buttons above).

### Focus Dashboard
- Top section: timer selector tabs (Pomodoro / Stopwatch). Large countdown display in Display font size. Label picker dropdown. Start/Stop/Reset controls.
- Below: two-column layout — left is Community Leaderboard (ranked list), right is Personal Analytics (Recharts charts).
- Timer display numbers: Plus Jakarta Sans, 800, 4rem, black.

### Study Circle Room (`/c/:id/circle/:circleId`)
- Full-screen layout. No top nav or sidebar.
- Left 70%: video grid (up to 5 tiles) above, Excalidraw whiteboard below (togglable).
- Right 30%: text chat panel with participant list at top.
- Bottom control bar: mute, camera, screen share, snapshot (saves whiteboard to Vault), leave button (red, danger style).
- Leave button: `#FF3B30` background, `3px black border`, white text.

### Settings Page (`/settings`)
- Vertically stacked sections: Profile, Storage Quota, Password Change, Danger Zone.
- Each section is a white card. Danger Zone card has `#FF3B30` left border accent (4px).

### Admin Dashboard (`/admin`)
- Full table of all Communities with filters. Each row has force-delete controls.
- Delete buttons are always the Danger Button style.

---

## 10. Empty States

Every list or grid that can be empty must have a custom empty state. Never show a blank white space.

Empty state anatomy:
- A Memphis-style illustration (geometric shapes + a central icon, SVG)
- A headline in H2 (Plus Jakarta Sans, 700)
- A short explanation in Body (Be Vietnam Pro)
- A primary action button if applicable (e.g. "Upload your first file", "Create a Community")

Examples:
- Empty Vault: "Nothing here yet" + upload button
- Empty Community search: "No communities found" + create button
- Empty Threads: "Start the conversation" + compose button
- Empty Circles: "No one's studying right now" + start circle button

---

## 11. Loading States

- **Skeleton screens** for all lists and grids. Skeleton blocks have `#E8E8E0` background, `1rem` radius, a shimmer animation (left-to-right highlight sweep, 1.5s loop).
- **Buttons** show a small spinner (Lucide `Loader2` icon, `animate-spin`) and become disabled while loading. Never remove button text during loading — show spinner alongside it.
- **Page transitions**: Framer Motion fade-in (opacity 0→1, 0.2s ease) on all route changes.
- **File upload**: a progress bar inside the upload button or a small toast notification at the bottom right.

---

## 12. Responsive Behaviour

- **Breakpoints**: Mobile `< 768px`, Tablet `768px–1024px`, Desktop `> 1024px`
- Minimum supported viewport: `375px` wide
- No horizontal scroll on any page
- Community sidebar collapses fully on mobile (hidden behind a hamburger toggle in the top nav)
- Grids collapse: 3 col → 2 col → 1 col
- The Study Circle room on mobile: video tiles stack vertically, Excalidraw is a toggle overlay, chat becomes a bottom drawer

---

## 13. Animation Principles

Use Framer Motion for all animations.

- **Duration**: Keep it fast. Most transitions are `0.15s` to `0.25s`. Nothing slower than `0.4s` for UI interactions.
- **Easing**: `ease` for most. `spring` for the NeoBrutalist shadow hover press effect.
- **Page load**: Staggered fade-up for card grids (each card delays by `0.04s` more than the previous).
- **Modal open**: Slide up 20px + fade in. Close: slide down + fade out.
- **Shadow hover press**: Translate + shadow removal on hover. `transition: all 0.15s ease`.
- **Button click**: Brief scale down `scale(0.97)` on `mousedown`, back on `mouseup`.
- No infinite looping animations except skeleton shimmer and the Pomodoro timer pulse.

---

## 14. Iconography

Use **Lucide React** exclusively. No other icon library.

- Standard icon size: `20px` (w-5 h-5 in Tailwind)
- Small icons (inside tags, captions): `16px`
- Large icons (empty states, feature highlights): `40px` to `48px`
- Icon stroke width: `2px` (Lucide default)
- Icon colour always matches the text it sits alongside, or `--color-text-secondary` for decorative use
- Icons inside buttons must have a visible text label alongside them — never icon-only for primary actions

---

## 15. shadcn/ui Usage

MODULUS uses shadcn/ui as its component base. However, all shadcn components must be restyled to match the MODULUS design system.

Override these defaults on every shadcn component:
- Replace default radius with MODULUS radius values
- Replace default shadow with NeoBrutalist offset shadow
- Replace default border colours with `#0A0A0A`
- Replace default font with Be Vietnam Pro or Plus Jakarta Sans as appropriate
- Replace default primary colour with `#FFD600`

The shadcn components to use: Button, Input, Textarea, Select, Dialog, Sheet, Tabs, Progress, Avatar, Badge, Dropdown Menu, Separator, Skeleton, Toast (Sonner), Card, Checkbox, Switch.

Do not use shadcn's default styling as-is. Always customise.
