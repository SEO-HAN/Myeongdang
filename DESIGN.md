# 명당지도 Design System

> **"신비의 지도첩"** — Where ancient Korean wisdom meets modern digital craft.

This document is the single source of truth for all visual decisions. It synthesizes principles from the Claude, Airbnb, and Linear design systems, adapted to the unique cultural identity of 명당지도 — a Korean saju × pungsu map service targeting MZ-generation mobile users.

---

## 1. Visual Theme & Atmosphere

명당지도 feels like a **beautifully bound Korean heritage map journal that has been digitized with intention**. Not a generic "dark fortune app." Not a flashy pop-culture astrology product. An elevated cultural experience — warm, mysterious, and trustworthy.

The design operates on two surfaces:
- **Dark canvas** (`#0D0D1A` — deep indigo-black): The hero and hero-adjacent sections. Evokes a night sky rich with stars, a scholar's study at midnight, the still moment before divination. This is NOT generic `slate-950` — it carries a warm indigo undertone.
- **Cream surface** (`#FAF8F2` — aged map paper): The content and data sections. Warm off-white that evokes the texture of traditional Korean maps and silk-bound books.

The signature moves:
- **Noto Serif KR** for all headings — the weight of tradition, the gravitas of a published scroll
- **Warm gold accent** (`#C9973A`) — compass gold, the color of illuminated manuscripts, 금(金) 오행 energy
- **Ring shadows** on interactive elements — a border that's technically a shadow
- **Three-layer card elevation** — warm, natural lift (not CSS-effect-looking)
- **Five-element color system** — each 오행 has a living, breathing color identity

**Key Characteristics:**
- Deep indigo-black dark canvas with warm undertones — never cold blue-gray
- Noto Serif KR for emotional headlines, Noto Sans KR for all UI text
- Warm gold (`#C9973A`) as the singular brand accent — compass, heritage, illuminated
- Refined vermillion (`#D94F2A`) for primary CTAs — emotion, passion, fire
- Layered elevation system: ring border → three-layer shadow → floating glow
- 오행 (Five Elements) color system as the primary visual identity
- Mobile-first: every layout decision starts at 375px

---

## 2. Color Palette

### Dark Canvas (Hero Backgrounds)
- **Indigo Black** (`#0D0D1A`): Primary dark background. Deep indigo-tinted black, not cold.
- **Midnight Navy** (`#131230`): Mid-tone dark. Slightly richer purple undertone.
- **Deep Teal Night** (`#0D1520`): Edge gradient. Hints of water/navy.
- **Dark Elevated** (`#1A1A2E`): Cards on dark surfaces. Lifted from the base.

```css
/* Hero gradient */
background: linear-gradient(160deg, #0D0D1A 0%, #131230 50%, #0D1520 100%);
```

### Cream Surface (Content Backgrounds)
- **Map Parchment** (`#FAF8F2`): Primary light page background. Warm cream, aged paper feel.
- **Card White** (`#FFFFFF`): Card surfaces on parchment. Pure white for maximum contrast.
- **Warm Ivory** (`#F5F1E8`): Elevated containers on light surfaces.
- **Surface Muted** (`#F0ECE3`): Secondary surfaces, alternative card.

### Brand Accents
- **Compass Gold** (`#C9973A`): Primary brand accent. Warm gold — compass, heritage, 금(金) energy. Use for: active states, progress indicators, premium moments.
- **Gold Bright** (`#E8C060`): Lighter gold shimmer for hover states and sparkle.
- **Vermillion** (`#D94F2A`): Primary CTA color. Refined fire — the color of 화(火), energy, action. More sophisticated than raw red.
- **Vermillion Dark** (`#B83720`): Pressed/hover state for vermillion CTAs.

### Text System
- **Text Primary Dark** (`#F0EAD8`): Primary text on dark surfaces. Warm cream-white, not pure white.
- **Text Secondary Dark** (`#A09895`): Secondary/muted text on dark.
- **Text Primary Light** (`#1A1824`): Primary text on light surfaces. Warm near-black with slight purple.
- **Text Secondary Light** (`#6E6A7A`): Secondary text. Warm gray with subtle purple.
- **Text Tertiary** (`#A09AA8`): Metadata, captions, de-emphasized text.

### Semantic States
- **Error** (`#D94F2A`): Same as Vermillion — consistent, not jarring.
- **Success** (`#2D5A0E`): Forest green, earthy.
- **Warning** (`#C17D2A`): Earth gold, same family as 토(土).
- **Focus Ring** (`#C9973A`): Gold focus ring — consistent accessibility signal.

### 오행 (Five Elements) Color System

Each element has a refined, living color identity. These are NOT generic semantic colors — they carry cultural meaning.

| 오행 | 이름 | Background | Text | Hex (accent) |
|------|------|-----------|------|------------|
| 목(木) | 나무 / Forest | `#EBF5E1` | `#2D5A0E` | `#4B7D1F` |
| 화(火) | 불 / Ember | `#FDF0EB` | `#8C2E10` | `#D94F2A` |
| 토(土) | 흙 / Earth | `#FBF3E3` | `#7A4A0A` | `#C17D2A` |
| 금(金) | 금 / Silver | `#F3F1EC` | `#4A4843` | `#9E9A8E` |
| 수(水) | 물 / Deep Water | `#E8F1FA` | `#1B4F85` | `#2563EB` |

---

## 3. Typography

### Font Families

```css
/* Heading — Traditional authority, cultural weight */
font-family: 'Noto Serif KR', 'Georgia', serif;

/* Body / UI — Clean, modern Korean readability */
font-family: 'Noto Sans KR', '-apple-system', 'Apple SD Gothic Neo', sans-serif;
```

**Google Fonts import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&family=Noto+Serif+KR:wght@400;500;600;700&display=swap');
```

### Type Hierarchy

| Role | Font | Size | Weight | Line Height | Notes |
|------|------|------|--------|------------|-------|
| Display / App Name | Noto Serif KR | 28–32px | 700 | 1.20 | Dark hero only |
| Hero Headline | Noto Serif KR | 22–26px | 600 | 1.30 | Step headings, result headlines |
| Section Heading | Noto Sans KR | 18px | 700 | 1.25 | White card sections |
| Card Title | Noto Sans KR | 16px | 600 | 1.25 | Place cards, feature titles |
| Body | Noto Sans KR | 15–16px | 400 | 1.60 | Descriptions, explanations |
| Label / Caption | Noto Sans KR | 12–13px | 500 | 1.40 | Overlines, metadata |
| Overline | Noto Sans KR | 11px | 600 | 1.25 | `letter-spacing: 0.08em; text-transform: uppercase` |
| Button | Noto Sans KR | 15–16px | 600–700 | 1.00 | CTAs, actions |

### Principles
- **Serif for emotional authority**: 앱 이름, 결과 헤드라인, 단계 타이틀 — these get Noto Serif KR.
- **Sans for UI efficiency**: Buttons, labels, captions, form fields — Noto Sans KR only.
- **Body line-height 1.60**: Literary, never cramped. Inspired by the Claude design system.
- **Never bold (700+) in serif at small sizes**: Noto Serif KR at 700 looks heavy below 18px. Use 600.

---

## 4. Component Styling

### Buttons

**Primary CTA (Vermillion)**
```css
background: #D94F2A;
color: #FFFFFF;
border-radius: 16px;
padding: 16px 24px;
font: 700 16px/1 'Noto Sans KR';
box-shadow: 0px 0px 0px 1px #D94F2A, 0px 4px 16px rgba(217,79,42,0.3);
/* Hover: background #B83720 */
/* Active: scale(0.98) */
```

**Secondary (Gold Outline)**
```css
background: transparent;
border: 1.5px solid #C9973A;
color: #C9973A;
border-radius: 16px;
padding: 14px 24px;
font: 600 15px/1 'Noto Sans KR';
/* Hover: background rgba(201,151,58,0.08) */
```

**Ghost / Tertiary**
```css
background: rgba(255,255,255,0.08);
color: rgba(255,255,255,0.6);
border-radius: 12px;
padding: 12px 20px;
font: 500 14px/1 'Noto Sans KR';
/* Used for: "건너뛰기", "다시 분석하기" */
```

**Progress Chip (Active)**
```css
background: rgba(201,151,58,0.15);
border: 1px solid rgba(201,151,58,0.5);
color: #C9973A;
border-radius: 9999px;
/* Used for progress steps, active filters */
```

### Cards & Containers

**Light Surface Card**
```css
background: #FFFFFF;
border: 1px solid rgba(0,0,0,0.06);
border-radius: 20px;
box-shadow: rgba(0,0,0,0.02) 0px 0px 0px 1px,
            rgba(0,0,0,0.06) 0px 4px 16px,
            rgba(0,0,0,0.10) 0px 8px 32px;
padding: 20px;
```

**Dark Glass Card**
```css
background: rgba(255,255,255,0.06);
border: 1px solid rgba(255,255,255,0.12);
border-radius: 20px;
backdrop-filter: blur(12px);
padding: 16px;
```

**오행 Selection Card (active)**
```css
border-width: 2px;
border-color: [ohaeng.hex];
background: [ohaeng.bg];
border-radius: 16px;
transform: scale(1.02);
transition: all 150ms ease;
```

### Inputs & Forms

```css
background: #F5F1E8;  /* warm ivory — not cold gray */
border: 2px solid rgba(0,0,0,0.08);
border-radius: 16px;
padding: 14px 16px;
font: 700 20px/1 'Noto Sans KR';
color: #1A1824;
text-align: center;

/* Focus state */
border-color: #C9973A;
box-shadow: 0 0 0 3px rgba(201,151,58,0.15);
outline: none;
```

### Navigation / Header

```css
/* On dark surfaces */
background: transparent;
/* Icon buttons */
width: 44px; height: 44px;
border-radius: 50%;
background: rgba(255,255,255,0.08);
border: 1px solid rgba(255,255,255,0.12);
color: rgba(255,255,255,0.85);
```

### Bottom Sheet / Floating CTA

```css
/* Container */
background: #FFFFFF;
border-radius: 32px 32px 0 0;
box-shadow: 0 -4px 40px rgba(0,0,0,0.15);

/* Floating Banner */
border-radius: 20px;
box-shadow: 0 4px 24px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06);
```

### Progress Bar (Onboarding Steps)

```css
/* Inactive */
background: rgba(255,255,255,0.15);
height: 3px; border-radius: 9999px;

/* Active */
background: linear-gradient(90deg, #C9973A, #E8C060);
transition: width 300ms ease;
```

---

## 5. Layout Principles

### Spacing System (Base: 4px)

| Token | Value | Use |
|-------|-------|-----|
| `space-1` | 4px | Micro gaps |
| `space-2` | 8px | Component internal gaps |
| `space-3` | 12px | Form field gaps |
| `space-4` | 16px | Section padding horizontal |
| `space-5` | 20px | Card internal padding |
| `space-6` | 24px | Between major elements |
| `space-8` | 32px | Section vertical spacing |
| `space-12` | 48px | Major section breaks |

### Mobile Constraints (375px base)
- **Max content width**: 375px (single column always on mobile)
- **Horizontal padding**: 16px (never less than 12px)
- **Touch targets**: 44×44px minimum (48px preferred for primary CTAs)
- **Safe areas**: Always apply `env(safe-area-inset-*)` for iOS notch/home

### Grid
- **Single column**: Always on mobile
- **Dark hero + white card**: The signature layout — dark section collapses into white rounded-top sheet

### Border Radius Scale

| Scale | Value | Use |
|-------|-------|-----|
| `xs` | 8px | Chips, small badges, quick-select buttons |
| `sm` | 12px | Secondary buttons, inline elements |
| `md` | 16px | Primary buttons, input fields, standard cards |
| `lg` | 20px | Feature cards, banners |
| `xl` | 24px | Bottom sheet handle area |
| `2xl` | 32px | Bottom sheet top radius, large containers |
| `full` | 9999px | Pills, avatar circles, progress bars |

---

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (0) | No shadow, no border | Dark backgrounds, hero sections |
| Contained (1) | `1px solid rgba(0,0,0,0.06)` | Light section dividers |
| Card (2) | Three-layer warm shadow | White cards on light surfaces |
| Interactive (3) | Ring shadow `0 0 0 1px` + card shadow | Hover/active states |
| Float (4) | `rgba(0,0,0,0.20) 0px 8px 40px` | Floating banners, bottom sheets |
| Glass (dark) | `rgba(255,255,255,0.06)` + `backdrop-blur(12px)` | Cards on dark |

**Three-layer Card Shadow:**
```css
box-shadow:
  rgba(0,0,0,0.02) 0px 0px 0px 1px,
  rgba(0,0,0,0.06) 0px 4px 16px,
  rgba(0,0,0,0.10) 0px 8px 32px;
```

**Shadow Philosophy**: Depth comes from layering, not opacity spikes. Never use a single heavy shadow. Always warm — `rgba(0,0,0,*)` never `rgba(100,100,200,*)`.

---

## 7. Animation & Motion

```css
/* Micro-interactions */
transition: all 150ms ease;

/* Component transitions (slides, expands) */
transition: all 250ms ease;

/* Page-level (spring physics via framer-motion) */
type: 'spring', stiffness: 300, damping: 30

/* Entry animations */
initial: { opacity: 0, y: 16 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
```

**Rules:**
- Button tap: `scale(0.97)` on active, never `scale(0.9)` (too jarring)
- Progress bar fill: 0.8s ease-out on mount
- Stagger card lists: `delayChildren: 0.05s`
- Always respect `prefers-reduced-motion`

---

## 8. Icons

**Never use emojis as UI icons**. Emojis are used only for semantic 오행 content (🌳🔥🏔️⚡💧) because they carry cultural/domain meaning that SVGs cannot replace.

For all UI chrome — navigation, actions, indicators — use SVG icons from [Heroicons](https://heroicons.com/) or [Lucide](https://lucide.dev/).

| Use Case | Icon (Heroicons) | Class |
|----------|-----------------|-------|
| Back navigation | `ChevronLeftIcon` | `w-5 h-5` |
| Share / Link | `ShareIcon` | `w-5 h-5` |
| Copy link | `LinkIcon` | `w-5 h-5` |
| Check / Done | `CheckIcon` | `w-5 h-5` |
| Map pin | `MapPinIcon` | `w-5 h-5` |
| Calendar | `CalendarDaysIcon` | `w-5 h-5` |
| Sparkle / Magic | `SparklesIcon` | `w-5 h-5` |
| Clock / Time | `ClockIcon` | `w-5 h-5` |
| Arrow right | `ChevronRightIcon` | `w-4 h-4` |
| Toggle expand | `ChevronDownIcon` | `w-4 h-4` |
| Refresh | `ArrowPathIcon` | `w-4 h-4` |

---

## 9. Do's and Don'ts

### Do
- Use `#0D0D1A` (warm indigo-black) for dark hero — never `slate-950` or `#0F172A` (too cold)
- Use Noto Serif KR for all emotional/headline text (app name, step headings, result headlines)
- Apply three-layer card shadow for all elevated white cards
- Use gold (`#C9973A`) for active states, progress, and premium moments
- Touch targets: 44px minimum, 48px preferred for CTAs
- Apply `pb-safe` and `pt-safe` to all fixed/absolute elements
- Use `transform/opacity` only for animations (not `top`, `height`, `width`)
- Gap between adjacent touch targets: minimum 8px

### Don't
- Don't use pure `slate-900/950` (#0F172A/#020617) for dark backgrounds — too cold and generic
- Don't use emoji as UI icons (←, ✓, 🔗, 📅, ✨ as interface chrome) — use SVG
- Don't apply `scale` transforms that cause layout shift on hover
- Don't use `font-weight: 800+` with Noto Serif KR — 700 is the ceiling
- Don't use cool blue-gray for text on dark (use warm cream `#F0EAD8`)
- Don't use a single heavy shadow — always layer
- Don't skip `cursor-pointer` on interactive elements
- Don't reduce body line-height below 1.50

---

## 10. 오행 Component Patterns

### 오행 Chip (Inline)
```tsx
<span className="ohaeng-chip ohaeng-{mok|hwa|to|geum|su}">
  {OHAENG_EMOJI[ohaeng]} {ohaeng}
</span>
```

### 오행 Card (Selection)
- Unselected: warm ivory bg + subtle border
- Selected: `[ohaeng.bg]` + `2px solid [ohaeng.hex]` + `scale(1.02)` + gold ring shadow
- Transition: 150ms ease

### 오행 Radar Chart
- Chart lines: `rgba(201,151,58,0.3)` (gold-tinted grid)
- Active element highlight: `[ohaeng.hex]` with 0.3 opacity fill
- Background: warm cream surface

---

## References

| Source | Key Takeaway Applied |
|--------|---------------------|
| Claude (Anthropic) DESIGN.md | Warm ring shadows, editorial serif headings, parchment surfaces, warm-toned neutrals |
| Airbnb DESIGN.md | Mobile-first three-layer shadow, generous radius, photography/imagery-forward |
| UI/UX Pro Max | Noto Serif/Sans KR pairing, touch target standards, Korean mobile UX patterns |
| awesome-design-md repo | `./awesome-design-md/` — 60+ reference DESIGN.md files available |
