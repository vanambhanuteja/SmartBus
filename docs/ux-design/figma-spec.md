# Figma design specification & prototype plan

Figma was **not accessed** from this environment, so no Figma file exists yet. Everything below is enough to recreate the file in ~2 hours: use `wireframes/*.svg` as references (Figma → File → Place image, or drag the SVGs in and redraw as components).

## Styles
* **Colour styles:** Primary `#0B5CAD`, Background `#F5F7FA`, Surface `#FFFFFF`, Text `#1C2430`, Border `#D5DBE3`; Crowd Low `#1B7F3B`, Moderate `#8A6D00`, High `#C2570C`, Overcrowded `#B3261E`. Contrast of white text on each (computed): Low 5.07, Moderate 4.92, High 4.50 (borderline – darken slightly if Figma reports <4.5), Overcrowded 6.54.
* **Text styles:** Font *Inter* (fallback system-ui). H1 28/36 Bold, H2 20/28 SemiBold, Body 16/24 Regular, Caption 13/18.
* **Spacing:** 8-pt grid (8/16/24/32). Corner radius 8 (inputs/buttons), 12 (cards). **Grids:** mobile 4-col/16 margin (375×812), desktop 12-col/1100 max (1440×1024).

## Components (with variants)
Button (primary/secondary/disabled/loading) · Text field (default/focus/error) · Select · Crowd badge (Low/Moderate/High/Overcrowded) · Route list item (default/selected) · Level radio card (unselected/selected) · Top bar (guest/passenger/admin) · Stat card · Bar chart bar · Table row · Toast/inline message (error/success).

## Frames (pages)
1. **Login** (login + register tabs) 2. **Passenger dashboard / Home** 3. **Route selection** (list + map) 4. **Crowd prediction** (inputs → result card) 5. **Crowd reporting** 6. **Admin dashboard** (stats, charts, tabs). Create each for mobile; frames 3 and 6 also for desktop.

## Prototype wiring (interactions)
Login → *On click "Log in"* → Crowd forecast · Home "Browse routes" → Route selection (Smart animate, 200 ms) · Route item tap → selected state + map highlight · "Check crowd level" → Prediction result (variants for each of 4 levels) · "Report crowd" → Reporting → *Submit* → success message · Admin login → Admin dashboard → tab switching. Set the starting frame to Login; share with "view" access for testers.

## Wireframes
See `wireframes/` (generated): `01-login`, `02-home`, `03-routes`, `04-predict`, `05-report`, `06-admin`.
