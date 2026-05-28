# DESIGN.md — CMES-USER Design System

> Visual reference สำหรับ User-facing app ของ CMES
> ใช้ร่วมกับ [`SKILL.md`](./SKILL.md) (coding rules & architecture)
> Source of truth: แต่ละ page มี CSS file แยก — `Home.css`, `Register.css`, etc.

---

## 1. Design Philosophy

| Principle | Detail |
|-----------|--------|
| **Theme** | ★ Dark mode only (ตรงข้ามกับ CMES-ADMIN ที่เป็น Light mode) |
| **Platform** | ★ Mobile-first — max-width `430px` ทุกหน้า |
| **Style** | Dark glassmorphism — `rgba()` on dark bg + `backdrop-filter: blur()` |
| **Feel** | Premium nightlife app — สีม่วง/ชมพู, ลึก, มี glow effect |
| **Language** | UI copy ภาษาไทย — ฟอนต์ Inter + Prompt |
| **Viewport** | ใช้ `100dvh` แทน `100vh` เสมอ |

---

## 2. Color System

### 2.1 Background Colors
| Color | Hex/Value | Usage |
|-------|-----------|-------|
| **Page gradient** | `linear-gradient(180deg, #0a0e27, #151338, #0f0c29)` | ★ Background หลักทุกหน้า |
| **Register bg** | `#0f111a` | หน้า Register |
| **Card bg** | `rgba(255, 255, 255, .06)` | ★ Glassmorphism cards |
| **Card bg light** | `rgba(255, 255, 255, .05)` | Header, lighter cards |
| **Card bg subtle** | `rgba(255, 255, 255, .04)` | List items |
| **Card bg minimal** | `rgba(255, 255, 255, .03)` | Auth wrapper |
| **Input bg** | `rgba(0, 0, 0, .2)` | Input fields |
| **Input bg focus** | `rgba(0, 0, 0, .4)` | Input focus state |
| **Modal bg** | `linear-gradient(180deg, #1a1f42, #0f1229)` | Bottom sheet modal |
| **Bottom nav bg** | `rgba(10, 14, 39, .92)` | Fixed bottom bar |
| **Overlay bg** | `rgba(0, 0, 0, .7)` | Modal backdrop |

### 2.2 Primary — Purple
| Color | Hex | Usage |
|-------|-----|-------|
| `#8b5cf6` | Primary | ★ Buttons, gradients, accents |
| `#7c3aed` | Primary dark | Gradient end, button gradient |
| `#a78bfa` | Primary light | ★ Active tab, links, gradient text |
| `#c4b5fd` | Primary pale | Tier-1 rank details |
| `#e9d5ff` | Primary ultralight | Tier-1 card text |
| `rgba(139, 92, 246, .15)` | Primary glow | Floating shapes, subtle bg |
| `rgba(139, 92, 246, .5)` | Primary border | Focus ring, avatar border |
| `rgba(139, 92, 246, .3)` | Primary shadow | Button box-shadow |
| `rgba(139, 92, 246, .1)` | Primary focus ring | Input focus `box-shadow` |

### 2.3 Accent Colors
| Color | Hex | Usage |
|-------|-----|-------|
| **Pink** `#ec4899` | Accent | Gradient border, floating shape |
| **Cyan** `#06b6d4` | Accent | Text service card, floating shape |
| **Amber** `#fbbf24` | Accent | Gift service, status icon, tier-2 rank |
| **Gold** `#fcd34d` | Accent | Tier-2 rank text |

### 2.4 Status Colors
| Color | Hex | Usage |
|-------|-----|-------|
| **Success** | `#10b981` | ★ Price, queue value, success message |
| **Danger** | `#ef4444` | Error message, notification badge |
| **Warning** | `#f59e0b` / `#d97706` | Tier-2 badge, pending |

### 2.5 Text Colors
| Color | Usage |
|-------|-------|
| `#fff` | ★ Primary text |
| `rgba(255, 255, 255, .8)` | Strong secondary text |
| `rgba(255, 255, 255, .6)` | Secondary text, labels |
| `rgba(255, 255, 255, .45)` | ★ Muted text, descriptions |
| `rgba(255, 255, 255, .4)` | Inactive nav items, divider text |
| `rgba(255, 255, 255, .35)` | Empty state text |
| `rgba(255, 255, 255, .3)` | Placeholder, disabled, faint elements |
| `rgba(255, 255, 255, .12)` | Very faint (empty state icons) |

### 2.6 Border Colors
| Color | Usage |
|-------|-------|
| `rgba(255, 255, 255, .1)` | Input borders, tab dividers |
| `rgba(255, 255, 255, .08)` | ★ Card borders |
| `rgba(255, 255, 255, .06)` | ★ Subtle borders (bottom nav, modal header, card footer) |
| `rgba(255, 255, 255, .05)` | Very subtle borders (list item dividers) |
| `rgba(139, 92, 246, .5)` | Focus state border |
| `rgba(139, 92, 246, .2)` | Image service card border |
| `rgba(6, 182, 212, .2)` | Text service card border |
| `rgba(251, 191, 36, .15)` | Gift service card border |
| `rgba(236, 72, 153, .2)` | Birthday service card border |

---

## 3. Typography

### 3.1 Font Stack
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```
- **Inter** (Google Fonts) — primary font ทุกหน้า
- Import ที่ต้นไฟล์ CSS: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap')`
- **ห้ามเปลี่ยน font** — ดู rules ใน SKILL.md
- Register page: `'Inter', 'Prompt', sans-serif` (เพิ่ม Prompt สำหรับไทย)

### 3.2 Font Sizes
| Element | Size | Weight |
|---------|------|--------|
| Auth page title (`h1`) | `2.2rem` | 800 |
| Section title | `1.1rem` | 800 |
| Modal title (`h3`) | `1.05rem` | 700 |
| Brand name (`h1`) | `1rem` | 700 |
| Card title (`h3`) | `.95rem` | 700 |
| Body / button text | `1rem` | 600 |
| Label / description | `.85rem` | 500-600 |
| Card description | `.8rem` | 400 |
| Brand subtitle | `.75rem` | 400 |
| Badge / feature tag | `.65rem` – `.7rem` | 600-800 |
| Nav label | `.68rem` | 600 |
| Smallest text | `.55rem` – `.6rem` | 600-800 |

### 3.3 Gradient Text (Auth Page)
```css
background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

---

## 4. Spacing & Layout

### 4.1 Mobile Container Pattern (★ ทุกหน้าใช้)
```css
.page-container {
  height: 100dvh;              /* ★ ไม่ใช้ 100vh */
  background: linear-gradient(180deg, #0a0e27, #151338, #0f0c29);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  position: relative;
  overflow: hidden;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-wrapper {
  width: 100%;
  max-width: 430px;            /* ★ Mobile constraint */
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px 14px 0;
  overflow: hidden;
}
```

### 4.2 Common Spacing
| Value | Usage |
|-------|-------|
| `6px` – `8px` | Element gap, tight spacing |
| `10px` – `12px` | Card gap, section margin |
| `14px` – `16px` | Card padding, modal padding |
| `20px` | Modal body side padding |
| `24px` | Large empty state padding |

### 4.3 Max Width
| Element | Max Width |
|---------|-----------|
| Page wrapper | `430px` |
| Bottom nav inner | `430px` |
| Modal content | `430px` |
| Auth wrapper | `400px` |

---

## 5. Shadows

| Type | Value | Usage |
|------|-------|-------|
| Card shadow | `0 4px 20px rgba(0, 0, 0, .2)` | ★ Standard glassmorphism cards |
| Button shadow | `0 4px 15px rgba(139, 92, 246, .25)` | Primary buttons |
| Button hover shadow | `0 6px 20px rgba(139, 92, 246, .4)` | Button hover state |
| Button CTA shadow | `0 6px 20px rgba(139, 92, 246, .3)` | Large CTA buttons |
| Auth wrapper shadow | `0 8px 32px rgba(0, 0, 0, .2)` | Auth card |
| Modal shadow | `0 -8px 30px rgba(0, 0, 0, .5)` | Bottom sheet |
| Rank index shadow | `0 2px 6px rgba(0, 0, 0, .2)` | Small badge |
| Nav icon glow | `drop-shadow(0 0 6px rgba(139, 92, 246, .4))` | Active nav icon |

---

## 6. Border Radius

| Value | Usage |
|-------|-------|
| `6px` | Tiny elements (feature tags) |
| `10px` | OTP button |
| `12px` | ★ Nav items, status icons, rank total, buttons |
| `14px` | ★ Input wrappers, rank cards, button variants |
| `16px` | ★ Header, service icons, primary buttons |
| `18px` | ★ Cards (service cards, rank panel) |
| `20px` | Service badge |
| `22px` | Modal top corners (`22px 22px 0 0`) |
| `24px` | Auth wrapper |
| `50%` | Avatars, floating shapes |
| `999px` | ★ Pill badges (rank index, rank badge) |

---

## 7. Component Styles

### 7.1 Glassmorphism Card (★ Core Pattern)
```css
.glass-card {
  background: rgba(255, 255, 255, .06);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, .08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, .2);
}
```

### 7.2 Gradient Border Effect (Pseudo-element)
```css
.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(139, 92, 246, .3), rgba(236, 72, 153, .2));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0;
  transition: opacity .3s;
}
.card:active::before { opacity: 1; }
```

### 7.3 Buttons
```css
/* Primary button */
.primary-btn {
  padding: 14px 24px;
  border-radius: 14px;
  border: none;
  font-weight: 600;
  font-size: 1rem;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: #fff;
  min-height: 48px;            /* ★ Touch target minimum */
  box-shadow: 0 4px 15px rgba(139, 92, 246, .25);
}

/* Auth button */
.auth-button.primary {
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: #fff;
  width: 100%;
  font-weight: 600;
}

/* Disabled state */
.btn:disabled {
  background: rgba(255, 255, 255, .1);
  color: rgba(255, 255, 255, .3);
  box-shadow: none;
  cursor: not-allowed;
}
```

### 7.4 Inputs (Dark Theme)
```css
.input-wrapper {
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 14px;
  background: rgba(0, 0, 0, .2);
  transition: all .3s ease;
}
.input-wrapper:focus-within {
  border-color: rgba(139, 92, 246, .5);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, .1);
  background: rgba(0, 0, 0, .4);
}
.input-wrapper input {
  padding: 14px 16px;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 1rem;
}
.input-wrapper input::placeholder {
  color: rgba(255, 255, 255, .3);
}
```

### 7.5 Bottom Navigation Bar
```css
.bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 100;
  background: rgba(10, 14, 39, .92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, .06);
  padding-bottom: env(safe-area-inset-bottom, 0);   /* ★ iPhone safe area */
}
.bottom-nav-inner {
  max-width: 430px;
  margin: 0 auto;
}
.bottom-nav-item {
  color: rgba(255, 255, 255, .4);
  min-width: 56px;
  min-height: 48px;             /* ★ Touch target */
}
.bottom-nav-item.active {
  color: #a78bfa;
}
.bottom-nav-item.active svg {
  filter: drop-shadow(0 0 6px rgba(139, 92, 246, .4));
}
```

### 7.6 Bottom Sheet Modal
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .7);
  z-index: 1000;
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.modal-content {
  background: linear-gradient(180deg, #1a1f42, #0f1229);
  border-radius: 22px 22px 0 0;
  max-width: 430px;
  width: 100%;
  max-height: 85vh;
  animation: slideUp .3s ease;
  border: 1px solid rgba(255, 255, 255, .06);
  border-bottom: none;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, .5);
}
```

### 7.7 Badges
```css
/* Service badge */
.service-badge {
  background: rgba(255, 255, 255, .08);
  color: rgba(255, 255, 255, .8);
  padding: 4px 8px;
  border-radius: 20px;
  font-size: .7rem;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, .06);
}

/* Rank badge (pill) */
.rank-badge {
  padding: 3px 8px;
  border-radius: 999px;
  font-size: .55rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Notification dot */
.bottom-nav-badge {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #ef4444;
  border: 1.5px solid rgba(10, 14, 39, .92);
}
```

### 7.8 Alert Messages
```css
.error-message {
  color: #ef4444;
  padding: 12px;
  background: rgba(239, 68, 68, .1);
  border-radius: 12px;
  border-left: 3px solid #ef4444;
}
.success-message {
  color: #10b981;
  padding: 12px;
  background: rgba(16, 185, 129, .1);
  border-radius: 12px;
  border-left: 3px solid #10b981;
}
```

### 7.9 Tab Navigation (Auth Page)
```css
.tab-btn {
  padding: .8rem;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  color: rgba(255, 255, 255, .4);
  font-weight: 600;
}
.tab-btn.active {
  color: #a78bfa;
  border-bottom-color: #a78bfa;
}
```

### 7.10 Empty State
```css
.empty-state {
  text-align: center;
  padding: 24px;
  color: rgba(255, 255, 255, .35);
}
.empty-state svg {
  color: rgba(255, 255, 255, .12);
  margin-bottom: 12px;
}
```

### 7.11 Scrollbar (Hidden)
```css
.scrollable-content {
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollable-content::-webkit-scrollbar {
  display: none;
}
```

### 7.12 Bottom Spacer (Prevent nav overlap)
```css
.content::after {
  content: '';
  display: block;
  min-height: 90px;     /* Bottom nav height + padding */
  flex-shrink: 0;
}
```

---

## 8. Service Card Accent Colors

| Service | Border Color | Gradient Border |
|---------|-------------|-----------------|
| **Image** (purple) | `rgba(139, 92, 246, .2)` | `rgba(139, 92, 246, .4) → rgba(168, 85, 247, .25)` |
| **Text** (cyan) | `rgba(6, 182, 212, .2)` | `rgba(6, 182, 212, .4) → rgba(59, 130, 246, .25)` |
| **Gift** (amber) | `rgba(251, 191, 36, .15)` | `rgba(251, 191, 36, .4) → rgba(249, 115, 22, .25)` |
| **Birthday** (pink) | `rgba(236, 72, 153, .2)` | `rgba(236, 72, 153, .4) → rgba(244, 63, 94, .25)` |

---

## 9. Ranking Tier Colors

| Tier | BG Gradient | Border | Text | Badge |
|------|------------|--------|------|-------|
| **1st** (Purple) | `rgba(139, 92, 246, .12) → .06` | `rgba(139, 92, 246, .2)` | `#c4b5fd` / `#a78bfa` | `rgba(139, 92, 246, .15)` |
| **2nd** (Gold) | `rgba(251, 191, 36, .1) → .05` | `rgba(251, 191, 36, .15)` | `#fcd34d` / `#fbbf24` | `rgba(251, 191, 36, .15)` |
| **3rd** (Silver) | `rgba(148, 163, 184, .08) → .04` | `rgba(148, 163, 184, .12)` | `#94a3b8` / `#cbd5e1` | `rgba(148, 163, 184, .1)` |

### Rank Index Badge Gradients
```css
.tier-1 .rank-index { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.tier-2 .rank-index { background: linear-gradient(135deg, #f59e0b, #d97706); }
.tier-3 .rank-index { background: linear-gradient(135deg, #64748b, #475569); }
```

---

## 10. Animation System

### 10.1 Keyframes
| Name | Effect | Duration | Usage |
|------|--------|----------|-------|
| `slideUp` | translateY(100%/20px) → 0 + fade | .3s – .4s ease | Modals, auth wrapper |
| `float` | translateY(0) → -15px + scale + opacity | 12s infinite | Floating background shapes |
| `homeSpin` | rotate(0 → 360deg) | .7s linear infinite | Spinner |
| `homePulse` | opacity .3 → .7 → .3 | looping | Pulse effect |

### 10.2 Transitions
```css
/* Standard transition */
transition: all .2s ease;
transition: all .3s ease;

/* Card press */
transition: transform .15s, box-shadow .15s;
```

### 10.3 Interaction Patterns
```css
/* ★ Mobile: ใช้ :active แทน :hover */
.card:active { transform: scale(.95); }
.button:active { transform: scale(.97); }
.nav-item:active { transform: scale(.9); }

/* Desktop (auth page only) */
.auth-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, .4);
}
```

### 10.4 Floating Background Shapes
```css
.floating-shapes { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  animation: float 12s ease-in-out infinite;
}
.shape-1 { background: rgba(139, 92, 246, .15); /* purple */ }
.shape-2 { background: rgba(236, 72, 153, .1);  /* pink, delay 4s */ }
.shape-3 { background: rgba(6, 182, 212, .08);  /* cyan, delay 7s */ }
```

---

## 11. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Default (`≤ 430px`) | ★ Primary target — ทุกอย่างออกแบบสำหรับนี้ |
| `min-height: 750px` | Service cards: larger gap (14px), larger icons (68px) |

### Mobile-specific Rules
```css
/* Touch optimization */
-webkit-tap-highlight-color: transparent;
user-select: none;
-webkit-user-select: none;

/* Safe area (iPhone notch) */
padding-bottom: env(safe-area-inset-bottom, 0);

/* Viewport */
height: 100dvh;   /* ★ ไม่ใช้ 100vh */

/* Touch scroll */
-webkit-overflow-scrolling: touch;
```

---

## 12. Z-index System

| Layer | Value | Usage |
|-------|-------|-------|
| Floating shapes | `0` | Background decorations |
| Content wrapper | `1` | Main content |
| Profile menu | `10` | Dropdown menus |
| Bottom nav | `100` | Fixed bottom bar |
| Modal overlay | `1000` | Bottom sheet backdrop + content |

---

## 13. Loading States

### 13.1 Spinner (Dark Theme)
```css
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(255, 255, 255, .08);
  border-top-color: rgba(255, 255, 255, .5);
  border-radius: 50%;
  animation: homeSpin .7s linear infinite;
}
```

### 13.2 Disabled Button
```css
.auth-button:disabled {
  background: rgba(255, 255, 255, .1);
  color: rgba(255, 255, 255, .3);
  box-shadow: none;
  cursor: not-allowed;
}
```

---

## 14. Icon System

| Library | Usage |
|---------|-------|
| **React Icons** (`react-icons`) | ★ Primary icons — `import { FaCamera } from "react-icons/fa"` |
| Custom SVG in `data-icon/` | Service card icons |
| Emoji | Decorative elements |

---

## 15. CSS Naming Convention

### Pattern
```
{page/component}-{element}-{modifier}
```

### Examples
| Class | Meaning |
|-------|---------|
| `.home-container` | Home page container |
| `.home-wrapper` | Home page wrapper (430px) |
| `.service-card` | Service card component |
| `.service-card.image-service` | Image type variant |
| `.rank-card.tier-1` | Rank card position 1 |
| `.bottom-nav-item.active` | Active nav item |
| `.auth-button.primary` | Primary auth button |
| `.modal-content` | Modal content area |

### Rules
- ใช้ **kebab-case** เสมอ
- State modifiers ใช้ class เสริม: `.active`, `.on`, `.off`, `.tier-1`
- Page-specific prefix: `home-`, `register-`, `payment-`

---

## 16. Design DO / DON'T

### DO ✅
- ใช้ **dark glassmorphism** สำหรับทุก card — `rgba(255,255,255,.06)` + `blur(16px)`
- ใช้ **`100dvh`** แทน `100vh`
- ใช้ **`:active` + `scale(.95)`** แทน `:hover` สำหรับ mobile
- ใช้ **`min-height: 48px`** สำหรับ touch targets
- ใช้ **`env(safe-area-inset-bottom)`** สำหรับ bottom nav
- ใช้ **gradient buttons** — `linear-gradient(135deg, #8b5cf6, #7c3aed)`
- ซ่อน **scrollbar** ทุก scrollable container
- เพิ่ม **bottom spacer** (`min-height: 90px`) เพื่อกัน content ซ้อน bottom nav
- ใช้ **Inter font** เสมอ — import จาก Google Fonts

### DON'T ❌
- **อย่าใช้ `100vh`** — จะ bug บน mobile browsers
- **อย่าใช้ `:hover`** เป็น primary interaction — mobile ไม่มี hover
- **อย่าใช้ light background** — dark theme เท่านั้น
- **อย่าเปลี่ยน font** จาก Inter
- **อย่าใช้ `border-radius` ต่ำกว่า 6px** (ยกเว้น strength bar)
- **อย่าลืม `-webkit-backdrop-filter`** — Safari ต้องใช้ prefix
- **อย่าใช้ opacity สูง** สำหรับ card bg — max `.06` เพื่อให้ดู premium
- **อย่าลืม `pointer-events: none`** บน decorative elements (shapes, pseudo-borders)
- **อย่าทำ tap target เล็กกว่า 44px** — ผู้ใช้กดไม่ถูก

---

## 17. Skeleton Loading (Dark Theme)

ใช้ใน list items และ cards ขณะ loading — สีต้องเข้ากับ dark background

```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, .05) 25%,
    rgba(255, 255, 255, .1) 50%,
    rgba(255, 255, 255, .05) 75%
  );
  background-size: 200% 100%;
  animation: skeletonPulse 1.6s ease-in-out infinite;
  border-radius: 8px;
}

@keyframes skeletonPulse {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### Usage Pattern (React)
```jsx
{loading ? (
  <div className="skeleton" style={{ width: '100%', height: '120px' }} />
) : (
  <ActualComponent />
)}
```

---

## 18. Content Bottom Padding

★ ทุก scrollable page ต้องมี padding ล่างเพื่อกัน content ซ้อนทับ bottom nav

```css
/* วิธีที่ 1: CSS ::after pseudo-element (แนะนำ) */
.content-scroll::after {
  content: '';
  display: block;
  min-height: 90px;     /* Bottom nav (~64px) + safe area + buffer */
  flex-shrink: 0;
}

/* วิธีที่ 2: padding-bottom ตรง */
.content-scroll {
  padding-bottom: 90px;
}

/* วิธีที่ 3: spacer element */
<div className="bottom-spacer" />
.bottom-spacer { min-height: 90px; flex-shrink: 0; }
```

### ทำไมต้อง 90px?
| Component | Height |
|-----------|--------|
| Bottom nav padding | `6px + 8px` |
| Nav item | `48px` |
| Safe area (iPhone) | `~34px` |
| **Total** | **~90px** |

