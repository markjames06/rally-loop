# RallyLoop Design System

## Visual Direction

**Inspiration:** Nike product campaign landing pages
**Aesthetic:** Athletic brand marketing with bold typography, minimal UI overlays, and advanced motion
**Theme:** Light theme with RallyLoop green accent (#39764d)

## Core Principles

1. **Bold, confident typography** - Display sizes with tight letter-spacing, inspired by athletic campaigns
2. **Minimal UI overlays** - Get out of the way, let the content shine
3. **Athletic micro-interactions** - Spring-based button hovers, staggered scroll reveals
4. **Generous whitespace** - Air and rhythm carry the structure, not borders
5. **Color restraint** - RallyLoop green used sparingly for primary actions and highlights
6. **Motion with purpose** - Scroll-triggered animations, parallax depth, athletic energy
7. **8px grid system** - All spacing follows 8px base unit for consistency
8. **Icon-first design** - Lucide icons instead of emoji for professional look

## Color Palette

```css
--ground: #f9fafb
--surface: #ffffff
--raised: #f3f4f6
--border: #e5e7eb
--rule: #f2f2f2
--control: #d1d5db
--text: #111827
--muted: #5f6672

/* RallyLoop green accent ladder */
--accent: #39764d
--accent-soft: #f0f7f2
--accent-track: #d4e8d8
--accent-ink: #1e4d30

/* Semantic colors */
--positive: #247b50
--negative: #c4242a
--warning: #92400e
```

## Typography

**Display tier:** Bold condensed (DM Sans), tight letter-spacing (-0.02em for headlines)
**Body tier:** DM Sans, comfortable measure (65-75ch)
**Scale:**
- Display: clamp(2rem, 5vw, 3rem) for hero headlines
- Section: clamp(1.75rem, 4vw, 2.5rem) for section headers
- Body: 0.8125rem - 1rem
- Small: 0.6875rem
- Line heights: 1.1 for headlines, 1.5-1.6 for body

## Spacing & Dimensions (8px Grid System)

```css
--radius-card: 8px
--radius-control: 6px
--gap: 24px (3 units)
--pad: 24px (3 units)
--control-height: 32px (4 units)
```

**Spacing scale:**
- Sections: 5rem (10 units)
- Section headers: 3rem bottom margin
- Card padding: 1.5-2rem (3-4 units)
- Grid gaps: 1-1.5rem (2-3 units)
- Button padding: 0.625-0.875rem vertical, 1-2rem horizontal

## Motion System

**Button interactions:** Spring-based scale (0.95 → 0.92 on tap)
**Scroll reveals:** Staggered fade-up with 100-300ms delays
**Hero parallax:** Scale and opacity transform on scroll
**Ball animation:** Continuous bounce with easing
**Easing:** cubic-bezier(0.25, 0.1, 0.25, 1) for smooth athletic feel
**Transition duration:** 0.15-0.2s for hover states, 0.2s for card lifts

## Component Patterns

### Buttons
- Primary: RallyLoop green background, white text, scale micro-interaction
- Secondary: Black background, white text
- Hover: Scale down slightly, color shift
- Padding: 0.625rem 1.5rem (small), 0.875rem 2rem (large)

### Cards
- White surface, subtle border, layered shadows for depth
- Green accent top border (3px gradient) for step cards
- Radial gradient overlays for subtle dimension
- Hover: 2px lift with enhanced shadow
- Padding: 1.5-2rem, border-radius: 8px

### Sections
- Centered headers with 3rem bottom margin
- Alternating backgrounds (white / raised with green tint)
- 80px gradient accent line at top
- Staggered item animations on scroll
- Max-width: 1200px for content, full-width for alt sections

### Icons
- Lucide React icons (not emoji)
- Size: 2.25-2.5rem for icon containers
- Gradient backgrounds (accent-soft to e8f5e9)
- Subtle shadow for depth
- Consistent padding in rounded containers

## Landing Page Structure

1. **Hero** - Full-bleed gradient background with grid pattern, floating shapes, bold headline, primary CTA, animated court illustration
2. **How It Works** - Three numbered steps with icons, gradient top border, radial overlays
3. **For Facilities** - Feature grid with secondary CTA, card hover effects
4. **Sports** - Icon grid with Lucide icons, consistent sizing
5. **Final CTA** - Green gradient background with rotating radial animation, centered content

## Authentication Pages

- Centered card layout with gradient background
- Brand mark with scale animation on load
- Staggered form field reveals (0.1s - 0.45s delays)
- Athletic button interactions matching landing page
- Error/success state animations with slide-in effect
- Grid pattern overlay for consistency

## Cross-Surface Reach

This visual system extends into:
- App shell navigation and typography
- Admin and player interfaces
- Status pills and badges
- Queue and match management UI
- Session cards and lists

## Animation Library

**Framer Motion variants:**
```javascript
containerVariants: { hidden, visible with stagger }
itemVariants: { hidden (opacity 0, y 40), visible }
```

**Scroll triggers:** `whileInView="visible"` with `viewport={{ once: true }}`

**Performance:** Use `transform` and `opacity` only, avoid layout thrashing

## UI Design Principles Applied

### Visual Hierarchy
- **Size:** Headlines use clamp() for responsive scaling, body text at 0.8125-1rem
- **Weight:** Bold (700-800) for headlines, medium (500-600) for labels, regular (400) for body
- **Color:** Text for primary, muted for secondary, accent for CTAs only
- **Spacing:** More space above headings (0.75rem) than below (0.5rem)

### Alignment
- **Center alignment** for section headers and CTA content
- **Left alignment** for card content and feature lists
- **Consistent max-width** containers for readability (1200px standard)

### Rhythm
- **8px grid system** for all spacing decisions
- **Consistent gaps:** 1-1.5rem between cards, 2rem between sections
- **Tight groups:** Related elements have smaller gaps (0.375-0.75rem)
- **Generous separation:** 5rem between major sections

### Depth
- **Layered shadows:** 1px + 4px shadow pattern for elevation
- **Hover lift:** 1-2px translate with shadow increase
- **Radial gradients:** Subtle overlays for texture without noise
- **Color layering:** Multiple background layers for richness

### Accessibility

- Respect `prefers-reduced-motion`
- Keyboard focus visible
- ARIA labels on interactive elements
- Contrast ≥ 4.5:1 for body text
- Consistent tap targets (minimum 44x44px for buttons)
