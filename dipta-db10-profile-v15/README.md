# Dipta Player Profile (DB10) — v9

Static, single-file site. Liquid-glass design, full animation, bilingual EN/ID,
scouting-oriented narrative.

## Deploy (Netlify drag-and-drop)
1. Unzip this package.
2. Drag the unzipped folder (containing index.html, _headers and the assets folder)
   onto the Netlify "Deploy" area, or upload the zip directly.
3. The contact form is wired for Netlify Forms (form name: "contact") with a honeypot.

## Local preview
Open index.html through a local server so the relative assets load, e.g.:
    python3 -m http.server 8080
then open http://localhost:8080

## Structure
- index.html            main page
- _headers              basic security headers for Netlify
- assets/images/        photos, logos and tournament marks
