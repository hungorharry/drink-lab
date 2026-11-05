---
name: Warm Editorial Workspace
colors:
  surface: '#fef9ef'
  surface-dim: '#ded9d1'
  surface-bright: '#fef9ef'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3ea'
  surface-container: '#f3ede4'
  surface-container-high: '#ede8df'
  surface-container-highest: '#e7e2d9'
  on-surface: '#1d1c16'
  on-surface-variant: '#444748'
  inverse-surface: '#32302a'
  inverse-on-surface: '#f5f0e7'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#615e5a'
  on-secondary: '#ffffff'
  secondary-container: '#e7e2dc'
  on-secondary-container: '#676460'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001c39'
  on-tertiary-container: '#2785e5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#e7e2dc'
  secondary-fixed-dim: '#cbc6c0'
  on-secondary-fixed: '#1d1b18'
  on-secondary-fixed-variant: '#494643'
  tertiary-fixed: '#d4e3ff'
  tertiary-fixed-dim: '#a4c9ff'
  on-tertiary-fixed: '#001c39'
  on-tertiary-fixed-variant: '#004884'
  background: '#fef9ef'
  on-background: '#1d1c16'
  surface-variant: '#e7e2d9'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: -0.006em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 19px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  code-inline:
    fontFamily: JetBrains Mono
    fontSize: 12.5px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 4rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies an editorial, document-first sensibility rooted in functional minimalism. Inspired by high-craft personal knowledge bases and modern collaborative workspaces, the interface retreats entirely into the background to prioritize content creation, structuring, and synthesis.

### Brand Personality & Philosophy
- **Intentional & Calming:** Zero ornamental excess, neon glows, or gratuitous movement. The canvas feels like fine archival stationery brought to a digital medium.
- **Warm Architectural Rigor:** Neutral tones rely on subtle warm stone undertones rather than clinical cool grays, providing comfort during extended hours of reading and editing.
- **Clarity Through Type & Structure:** Hierarchy relies on typographic scale, rhythm, and crisp micro-borders rather than loud surface treatments or heavy drop shadows.

### Core Visual Principles
- **Monochrome Foundation:** Strict adherence to high-contrast monochrome texts over clean, off-white, and warm neutral canvases.
- **Delicate Boundaries:** Divisions between sections, cards, and contextual panels use hairline borders (`1px`) in muted warm grays.
- **Muted Semantic Accents:** Color enters the system exclusively as information cues—muted pastel fills for tags, callout tints, and status markers.

## Colors

The palette is engineered around warm monochrome neutrals, paired with an array of soft pastel semantic washes for tags, properties, and callout blocks.

### Base Canvases & Textures
- **Base Canvas (`#FFFFFF`):** Primary editor canvas and document reading plane.
- **Subtle Surface (`#FAF9F6`):** Secondary app chrome, contextual sidebars, and nested document trees.
- **Hover / Muted Surface (`#F1EFEA`):** Transient states, block highlights, active row selections, and table headers.

### Ink Hierarchy
- **Text Primary (`#37352F`):** Deep warm graphite. Provides near-black legibility with softer optical contrast than harsh `#000000`.
- **Text Secondary (`#787774`):** Mid-tone graphite for descriptions, subheadings, timestamps, and secondary metadata.
- **Text Muted / Placeholder (`#9B9A97`):** Disabled states, empty-state text, and input placeholders.

### Structural Lines
- **Hairline Border (`#E9E8E4`):** Standard structural dividers, subtle card boundaries, and grid lines.
- **Defined Border (`#D3D1CB`):** Active input outlines, focus perimeters, and key card boundaries.

### Functional Pastel Washes (Badges & Callouts)
- **Gray Neutral:** Text `#5A5A58` | Background `#F1F1EF` | Border `#E3E2DE`
- **Brown/Warm:** Text `#6E5646` | Background `#F4EEEE` | Border `#E8DFD8`
- **Orange/Amber:** Text `#98592A` | Background `#FAECE3` | Border `#F2DACB`
- **Yellow:** Text `#89632A` | Background `#FBEDCE` | Border `#F3E0B5`
- **Green:** Text `#346549` | Background `#EDF3EC` | Border `#D5E4D4`
- **Blue:** Text `#275D8B` | Background `#E7F3F8` | Border `#CDE5F1`
- **Purple:** Text `#684B77` | Background `#F6F3F9` | Border `#E6DFEE`
- **Pink:** Text `#8A4161` | Background `#F9EDF2` | Border `#F1D8E3`
- **Red:** Text `#8E3F3B` | Background `#FDEBEC` | Border `#F7D4D6`

## Typography

Typographic scale is structured for clean reading rhythms and clear structural hierarchy. The core type family is Inter, calibrated with slight negative tracking on display sizes to produce crisp, newspaper-grade headlines.

### Rules of Usage
- **Page Titles (`headline-xl`):** Strictly reserved for top-level document, project, or database names.
- **Section Headers (`headline-lg`, `headline-md`, `headline-sm`):** Directly maps to Markdown H1, H2, and H3 document structure. Top margins precede headers with 1.75x rhythm to clearly separate semantic sections.
- **Document Body (`body-lg`):** Main text areas use 16px with an open 26px line height, guaranteeing effortless scanning and reading comfort across wide desktop lines.
- **Data Densities (`body-md`, `body-sm`):** Reserved for tables, side navigation links, properties, metadata lists, and nested comments.
- **Inline Monospace (`code-inline`):** Monospaced phrases and key formulas render in JetBrains Mono with 0.85em scale inside a `#F1EFEA` badge container with 3px horizontal padding.

## Layout & Spacing

The layout model pairs a centered document frame with flexible side chrome. It prioritizes readable line lengths while providing modular data density.

### Canvas Grid & Layout Models
- **Standard Document Max-Width:** Clamped at `720px` to maintain optimal typographical reading measure (65–75 characters per line).
- **Full-Width Canvas Variant:** Expands dynamically across viewports up to `1440px` for database tables, kanban boards, and gallery views, keeping `margin-desktop` (64px) at page margins.
- **Navigation Pane:** Desktop sidebar docks left at a fixed width between `240px` and `280px`, collapsible via smooth inline transform.

### Responsive Breakpoints
- **Mobile (< 640px):** Single-column layout. Document margins shrink to `1rem`. Sidebars convert to an off-canvas drawer. Headings drop to their mobile typographic scale equivalents.
- **Tablet (640px – 1024px):** Margins expand to `2rem`. Kanban columns scroll horizontally on overflow; database filters collapse into an expandable sheet.
- **Desktop (> 1024px):** Margins set to `4rem`. Split views, simultaneous pane views, and contextual hovering toolbars activate.

## Elevation & Depth

Visual depth avoids heavy drop shadows, neon glares, and blur-heavy skeuomorphism. Instead, the interface relies on **low-contrast outlines** and **whisper shadows** to establish physical positioning.

### Depth Layers
- **Surface 0 (Base Canvas):** `#FFFFFF` or `#FAF9F6`. Flush flat background.
- **Surface 1 (Inset Cards & Blocks):** Grounded directly on the canvas with a `1px solid #E9E8E4` border. No drop shadow. Hover state gently shifts background color to `#FAF9F6` rather than elevating along the Z-axis.
- **Surface 2 (Flyouts & Popovers):** Context menus, page link dropdowns, emoji selectors, and slash-command palettes. Defined by a `1px solid #D3D1CB` border and a crisp micro-shadow: `0 4px 12px rgba(15, 15, 15, 0.05), 0 1px 2px rgba(15, 15, 15, 0.08)`.
- **Surface 3 (Modals & Focus Dialogs):** Centered overlays. Framed with `1px solid #D3D1CB` and a soft ambient shadow: `0 12px 32px rgba(15, 15, 15, 0.08), 0 2px 6px rgba(15, 15, 15, 0.04)`. Background backdrop uses a warm semi-translucent tint: `rgba(55, 53, 47, 0.25)` without heavy glassmorphism blurs.

## Shapes

The design uses soft, understated corner radii (`roundedness: 1`). Elements feel sharp, precise, and professional rather than playful or bubbly.

### Corner Radii Guidelines
- **Micro Radii (`4px` / `0.25rem`):** Applied to inline code blocks, badges, status chips, multi-select pill tags, checkboxes, and input fields.
- **Container Radii (`6px` / `0.375rem`):** Applied to callout blocks, action buttons, popovers, dropdown lists, and tooltips.
- **Structural Radii (`8px` / `0.5rem`):** Maximum radius applied across the system. Used exclusively for large cards, database table containers, and modal window borders.

## Components

### Buttons
- **Primary Action:** Solid background (`#191919`), crisp text (`#FFFFFF`), `4px` radius, padding `6px 12px`. Hover state: `#37352F`. Focus: `2px` ring in `#2383E2` with `1px` offset.
- **Secondary / Ghost (Default Action):** Transparent background, text `#37352F`, `4px` radius, padding `6px 10px`. Hover state applies `#F1EFEA`. Active state `#E9E8E4`.
- **Destructive:** Transparent background with `#8E3F3B` text. Hover state `#FDEBEC`.

### Callout Blocks
- Container with `1px solid #E9E8E4` border, background `#FAF9F6`, `6px` radius, padding `12px 16px`.
- Layout: Flex row. Left side houses an icon or emoji (size `20px`), right side holds editable content (`body-md`).
- Semantic callouts adopt the pastel wash palette (e.g., info callout uses `#E7F3F8` background with `#275D8B` icon/text).

### Chips & Badges
- Pill shape with `4px` radius. Typographic scale `label-md` or `label-sm`.
- Height: Fixed `20px` for dense lists, `24px` for property editors. Padding: `2px 6px`.
- Color pairs match muted pastels (e.g., Status In Progress: `#FBEDCE` fill with `#89632A` text).

### Lists & Tree Views
- Zero border on raw list items. Padding: `4px 8px`, `4px` radius.
- Leading icon or toggle chevron sized at `14px`, text `#787774`.
- Drag handles appear solely on item hover in `#9B9A97`.
- Hover row background: `#F1EFEA`.

### Checkboxes & Radio Buttons
- Checkbox: `16px x 16px` square with `3px` radius, `1.5px solid #D3D1CB`. Checked state fills with `#2383E2` (or `#191919` in strict monochrome mode) displaying a sharp `#FFFFFF` checkmark.
- Radio: `16px x 16px` circle with matching outline and a solid `6px` centered dot when active.

### Input Fields
- Text inputs and search bars: `1px solid #D3D1CB`, background `#FFFFFF`, `4px` radius, padding `6px 10px`, font size `14px`.
- Focus state: Border color transitions to `#2383E2` or `#191919` with no heavy box-shadow glow.

### Cards
- Surface: `#FFFFFF` with `1px solid #E9E8E4` border and `8px` radius.
- Padding: `16px` desktop, `12px` mobile.
- Hover behavior: Border transitions cleanly to `#D3D1CB` accompanied by a micro shadow: `0 2px 8px rgba(15, 15, 15, 0.04)`.

### Database Property Table Rows
- Hairline horizontal and vertical grid lines (`1px solid #E9E8E4`).
- Cells maintain `32px` minimum row height, cell padding `4px 8px`.
- Header row uses `#FAF9F6` background, `label-md` styling, and muted column type glyphs.