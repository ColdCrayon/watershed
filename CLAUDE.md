# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
python3 -m http.server 8080   # local dev server; open http://localhost:8080/
```

No build step, no dependencies, no linting or test tooling. Edit → refresh.

## Architecture

Single-page static marketing site for Watershed Technologies (institutional options ATS). Plain HTML/CSS/JS — three files, deploy-ready as-is.

- `index.html` — the entire page (nav, all sections, footer inlined). Loads Google Fonts, `css/main.css`, `js/main.js`.
- `css/tokens.css` — primitive values (oklch colors, spacing, font stacks). **Never write raw color or px values in main.css; always use a token.**
- `css/main.css` — imports tokens.css, then all component styles in section order matching the page.
- `js/main.js` — vanilla only, no dependencies. Six self-contained IIFEs:
  1. `[data-reveal]` scroll-reveal via IntersectionObserver (auto-staggers direct children of `.pillars`, `.stats`, `.compare`, `.audience`)
  2. `.reveal` variant for hero headline
  3. Hero parallax depth field (`#depth` SVG layers, `data-depth` attribute drives intensity)
  4. Magnetic button effect on `.btn` / `.cta-btn`
  5. Flow sequence player — 5-step lifecycle diagram with play/pause/reset, autoplay on viewport entry, crossfade between `.sd-pane` / `.sd-vis-pane` panels
  6. Active nav link tracking + mobile hamburger toggle

## Design conventions

- Color palette: oklch light theme — `--bg` (near-white cool), `--ink` / `--ink-2` / `--ink-3` ink scale, `--primary` (deep slate-teal), `--accent` (electric cyan)
- Fonts: `--display` = Newsreader (serif, variable — use `font-variation-settings: "opsz"` for optical sizing), `--body` = Geist, `--mono` = Geist Mono
- Layout: `.container` with `--maxw: 1400px` and `--gutter: clamp(20px, 4vw, 56px)`
- Section padding: `clamp(64px, 7vw, 120px) 0` via base `section` rule
- `.section-head` uses a 160px meta column + 1fr content grid; collapses to 1fr at ≤780px
- Responsive breakpoints: 980px (hero), 900px (pillars, flow, compare, audience, CTA), 780px (stats, footer, section-head), 640px (nav → hamburger), 600px (audience list), 480px (footer)
- The `.eyebrow` class uses Geist Mono with a prepended 18px rule via `::before`
- Scroll-reveal: add `data-reveal` to any element; set `--reveal-delay` inline for custom stagger
