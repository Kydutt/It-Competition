# Design System & UI/UX Specification

## 1. Project Overview

**Project type:** Website for a national technology festival and IT competition  
**Primary reference:** https://www.find-it.id/  
**Design direction:** Futuristic, cinematic, premium, editorial, technology-focused, and responsive.

Create an original event website inspired by the reference's overall event experience and visual ambition. Do not copy its logo, brand assets, exact copy, or proprietary visual elements. The final design must have its own event identity.

### Core UX goals

1. Explain the event and its value within the first screen.
2. Help visitors discover competitions quickly.
3. Make eligibility, schedules, prizes, and rules easy to find.
4. Guide eligible visitors toward registration.
5. Deliver a consistent and accessible experience on desktop, tablet, and mobile.

## 2. Target Users

- Students interested in technology and innovation.
- Individuals or teams looking for IT competitions.
- Teachers, mentors, and institutional representatives.
- Sponsors, partners, and media visitors.

Design for first-time visitors who may not understand the event or competition formats yet. Avoid unexplained acronyms and make critical information scannable.

## 3. Brand Personality

The experience should feel:

- **Innovative:** digital-first visuals and forward-looking language.
- **Credible:** clear information, consistent spacing, and restrained effects.
- **Energetic:** bold typography, strong contrast, and memorable visual moments.
- **Inclusive:** readable content, clear navigation, and accessible controls.
- **Premium:** deliberate composition rather than generic template patterns.

## 4. Visual Design System

### Color tokens

| Token | Value | Usage |
|---|---|---|
| `color-bg` | `#100B08` | Main page background, warm near-black |
| `color-surface` | `#1C1410` | Cards and secondary sections |
| `color-surface-raised` | `#2A1B14` | Hover surfaces and elevated panels |
| `color-primary` | `#FF7A1A` | Primary links and main actions |
| `color-orange-light` | `#FFB36B` | Warm highlights, gradients, and secondary accents |
| `color-orange` | `#FF6A00` | High-priority CTAs and key visual highlights |
| `color-text` | `#FFF7F0` | Main text, warm off-white |
| `color-text-muted` | `#C4B3A7` | Secondary text |
| `color-border` | `rgba(255,179,107,0.16)` | Dividers and subtle outlines |
| `color-focus` | `#FFD0A6` | Keyboard focus indicator |

Use orange as the primary brand accent, balanced with warm near-black surfaces and off-white text. Use bright orange for primary actions, lighter orange for secondary highlights, and restrained amber gradients for depth. Avoid adding unrelated neon colors. Maintain sufficient text contrast; never rely on color alone to communicate status.

### Typography

- Use a modern sans-serif family such as **Space Grotesk** for display headings and **Inter** for body text, or equivalent locally available fonts.
- Hero headline: large, bold, tightly spaced, with intentional line breaks.
- Section headings: strong and concise, clearly smaller than the hero headline.
- Body copy: comfortable line length and generous line height.
- Labels: small uppercase text with modest letter spacing.
- Avoid using too many font families or styling every phrase as a highlight.

### Layout and spacing

- Use a centered content container with a maximum width around `1200–1320px`.
- Desktop side padding: `48–72px`; tablet: `28–36px`; mobile: `20–24px`.
- Base spacing scale: `4, 8, 12, 16, 24, 32, 48, 64, 96, 128px`.
- Use large vertical spacing between major sections and tighter spacing within related content.
- Prefer asymmetrical editorial compositions and varied card sizes over repeating the same grid in every section.
- Use rounded corners selectively. Cards should not all look like identical pill-shaped containers.

### Shape, borders, and effects

- Use subtle 1px borders and low-contrast surfaces.
- Add soft orange/amber ambient glow behind selected visual elements. Keep the glow localized so the page remains premium rather than looking uniformly illuminated.
- Use gradients as supporting atmosphere, not as a substitute for visual design.
- Add faint grids, technical linework, or abstract geometry only where they improve depth.
- Avoid excessive glassmorphism, heavy blur, neon on every element, and constant particle movement.

## 5. Information Architecture

### Main navigation

- Home
- About
- Competitions
- Timeline
- FAQ
- Primary CTA: **Register Now**

Use anchor navigation on the landing page where appropriate. Competition cards should lead to dedicated detail pages. Use clear active, hover, and keyboard-focus states. On mobile, provide a working menu with a clear close action.

### Required pages

1. Homepage / event landing page.
2. Competition listing or showcase section.
3. Reusable competition detail page.
4. Registration destination or registration instructions page.
5. FAQ section or page.
6. Privacy policy and any required legal information.

Only implement pages and flows supported by the actual project scope. Do not present a decorative button as a completed feature.

## 6. Homepage Specification

### 6.1 Navigation bar

- Minimal logo lockup on the left.
- Navigation links and registration CTA on desktop.
- Initially blends with the hero background.
- On scroll, gains a subtle surface or border for legibility.
- Mobile menu must be keyboard accessible and usable with touch.

### 6.2 Hero section

**Purpose:** Communicate the event identity, audience, and main action immediately.

**Composition:**
- Small event/edition label above the headline.
- Large headline, ideally two or three deliberate lines.
- Short supporting paragraph, limited to roughly two or three lines on desktop.
- Primary CTA: `Register Now`.
- Secondary CTA: `Explore Competitions`.
- Cinematic abstract 3D object, digital landscape, or original technology-themed artwork.
- Optional date/location metadata only when confirmed.
- Discreet scroll indicator.

**Example copy, replaceable with official event content:**

> EXPLORE THE NEXT DIMENSION OF INNOVATION.
>
> A gathering of bold minds, emerging technologies, and groundbreaking ideas shaping the digital future.

Keep text readable over imagery. On mobile, prioritize the headline and actions, and simplify or reposition decorative art.

### 6.3 About the event

- Small section label such as `ABOUT THE EVENT`.
- Strong editorial headline.
- Concise explanation of the event's mission and audience.
- Supporting photo, illustration, or abstract visual.
- Optional verified statistics such as competition categories, participating institutions, or prize pool.

Do not invent statistics. Hide unavailable figures or use clearly identified temporary placeholders during development.

### 6.4 Why participate

Communicate benefits such as technical growth, portfolio development, collaboration, and real-world problem solving.

Use short copy and a mix of text blocks, small icons, and subtle dividers. Avoid turning every benefit into an oversized identical card.

### 6.5 Competition showcase

Example categories, subject to confirmation:

- Competitive Programming
- Capture The Flag
- Data Analytics
- UI/UX Competition
- Hackathon
- Informatics Competition

Each item should contain:
- Competition name.
- One-sentence summary.
- Category or participation format, if confirmed.
- Original visual or minimal icon.
- `Explore Details` link.

Use an asymmetrical grid or varied card proportions. Ensure every card has a visible interactive state and leads to the correct detail page.

### 6.6 Competition detail template

Each detail page should support:

- Competition title and introduction.
- Eligibility and participant requirements.
- Individual/team format.
- Registration fee, if applicable.
- Competition stages and format.
- Confirmed prize information.
- Important dates and deadlines.
- Rules or guidebook download.
- Competition-specific FAQ.
- Registration CTA.

Make essential requirements easy to scan. Do not invent fees, dates, rules, prizes, or downloadable files.

### 6.7 Timeline

- Present event milestones in chronological order.
- Desktop: horizontal timeline when labels remain readable.
- Mobile: vertical timeline.
- Distinguish completed, upcoming, and current stages using text and visual indicators.
- Dates must come from official event data. If dates are unknown, show stage labels without fabricated dates.

### 6.8 Prize pool

- Use oversized typography for the confirmed total prize pool.
- Pair it with a concise supporting message and a strong CTA.
- Use subtle lighting or a trophy-inspired illustration.
- If the amount is unconfirmed, do not display a made-up figure.

### 6.9 FAQ

- Use an accessible accordion.
- Questions may cover eligibility, registration, teams, event format, fees, rules, guidebooks, and contact information.
- Support keyboard operation, visible focus, and appropriate expanded/collapsed states.
- Add categories only if the FAQ is large enough to justify them.

### 6.10 Sponsors and partners

- Display only confirmed sponsors and partners.
- Preserve logo proportions and provide appropriate contrast.
- Group logos by role when needed.
- Avoid fabricated names or placeholder logos in production.

### 6.11 Final call to action

Example headline:

> YOUR NEXT BIG IDEA STARTS HERE.

Include a short message, a primary registration CTA, and a secondary competition-discovery link. Use one strong visual moment rather than a crowded collection of effects.

### 6.12 Footer

Include:
- Event logo and short description.
- Quick navigation.
- Competition links.
- Official social media and contact links.
- Privacy policy.
- Copyright statement.

Use real destinations for all links. Hide optional links until their destinations exist.

## 7. Interaction Design

- Smooth scrolling for in-page navigation.
- Subtle section-reveal animations.
- Restrained hover and pressed states for buttons and cards.
- Sticky navigation with clear scroll behavior.
- Functional mobile navigation.
- Working competition-detail links.
- Functional FAQ accordion.
- Clear loading, success, validation, and error states for forms that are actually implemented.
- Respect `prefers-reduced-motion` and avoid essential information that only appears through animation.
- Avoid scroll hijacking, excessive parallax, and movement that interferes with reading.

## 8. Responsive Behavior

### Desktop: 1024px and above

- Cinematic hero with text and visual balanced across the viewport.
- Multi-column and asymmetrical layouts.
- Large display typography and generous whitespace.

### Tablet: 768–1023px

- Reduce headline scale and section spacing.
- Adapt grids to fewer columns.
- Keep CTAs visible and prevent cramped navigation.

### Mobile: below 768px

- Single-column layouts where appropriate.
- Compact, functional navigation.
- Readable text and comfortable touch targets.
- Full-width CTAs where useful.
- Stacked competition cards and vertical timeline.
- Simplified background effects and optimized images.
- No horizontal overflow.

Test at narrow mobile widths as well as common tablet and desktop sizes.

## 9. Accessibility Requirements

- Use semantic landmarks and heading levels in a logical order.
- Ensure all interactive elements are keyboard accessible.
- Provide visible focus indicators.
- Give meaningful images appropriate alternative text; mark decorative images as decorative.
- Maintain sufficient contrast for text and controls.
- Use descriptive link text instead of vague labels where context is unclear.
- Provide accessible names and expanded states for menus and accordions.
- Do not communicate errors or statuses using color alone.
- Respect reduced-motion preferences.

## 10. Technical Implementation Guidance

If the project uses React, a suitable stack is:

- React + TypeScript.
- Tailwind CSS or the project's existing styling system.
- Framer Motion for restrained animation.
- Lucide React for icons.

Before adding dependencies, inspect the existing codebase and preserve its framework and conventions unless there is a clear reason to change them.

Implementation principles:
- Create reusable components for navigation, buttons, section headings, competition cards, timeline items, accordions, and footer.
- Centralize design tokens and content data.
- Keep official event data separate from presentation components.
- Use optimized, appropriately licensed assets.
- Avoid unnecessary client-side JavaScript.
- Ensure links, buttons, forms, and navigation have real behavior.
- Include loading, empty, and error states when relevant.
- Follow the project's existing linting, formatting, and testing conventions.

## 11. Content and Data Integrity

The following information must be verified before publication:

- Event name, edition, date, and venue.
- Competition categories and descriptions.
- Eligibility and team size.
- Fees and prizes.
- Registration deadlines.
- Timeline and rules.
- Sponsor and partner names/logos.
- Contact details and social links.

Never fabricate official details. Use clearly marked placeholders during development and replace them before launch.

## 12. Quality Assurance Checklist

### Visual
- [ ] Strong, recognizable hero section.
- [ ] Consistent typography, spacing, and colors.
- [ ] Varied section compositions, not repetitive cards.
- [ ] Readable text over all backgrounds.
- [ ] Effects are subtle and purposeful.

### Functional
- [ ] Navigation links work.
- [ ] Mobile menu opens, closes, and navigates correctly.
- [ ] Competition cards open the correct details.
- [ ] FAQ accordion works with mouse, touch, and keyboard.
- [ ] Registration CTAs lead to a real destination.
- [ ] No broken links or misleading placeholder interactions.

### Responsive and accessible
- [ ] No horizontal overflow at mobile widths.
- [ ] Controls have adequate touch targets.
- [ ] Keyboard focus is visible.
- [ ] Semantic structure and alternative text are present.
- [ ] Reduced-motion preference is respected.
- [ ] Contrast and readability are checked.

### Performance
- [ ] Images are optimized.
- [ ] Animation is lightweight.
- [ ] Unnecessary dependencies are avoided.
- [ ] Main content remains usable if decorative effects fail.

## 13. Definition of Done

The design is ready when the website has a coherent original identity, responsive layouts, clear competition discovery, reliable event information, accessible interactions, and working navigation. The result should feel like a premium technology festival: bold, immersive, credible, and memorable, without sacrificing usability for visual effects.
