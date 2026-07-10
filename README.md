# Watershed Technologies

Static marketing site for Watershed Technologies (institutional options ATS). Plain HTML/CSS/JS — no build step, no dependencies.

## Local dev

```bash
python3 -m http.server 8080
```

Open http://localhost:8080/. Edit files, refresh.

## Deploy

Serve the repo root as static files. Any static host works (Netlify, Vercel, S3, GitHub Pages, nginx).

## Structure

```
index.html       full page (nav + sections + footer inlined)
css/tokens.css   design tokens (colors, spacing, fonts) — edit here first
css/main.css     component styles, imports tokens.css
js/main.js       vanilla JS (scroll reveal, parallax, flow player, nav)
```

See `CLAUDE.md` for design conventions and JS module breakdown.
