# FI-077 Trail Muse v1.1

Trail Muse is a mobile-first creative field prompt generator and field journal for hikers, artists, writers, photographers, and wandering thinkers.

Version 1.1 shifts the app toward the feeling of classic monochrome wilderness photography: deep blacks, luminous highlights, silver print panels, contact-sheet review, tonal-zone language, and quieter field prompts focused on light, weather, scale, texture, and patience.

## What is included

- Random field prompt generator with themed prompt decks
- New monochrome prompt decks: Silver Light, Tonal Zones, and Contact Sheet
- Quick capture modules for trail thoughts, found objects, small discoveries, sensory notes, drawing notes, photography notes, and writing notes
- Local autosave using browser localStorage
- Mobile bottom navigation and desktop side navigation
- Journal search, type filter, and status filter
- Darkroom-style follow-up queue for “develop something from this later”
- Studio dashboard with creative harvest stats and recurring tonal signals
- Trail session / exposure roll start-close workflow
- Light/dark mode with high-contrast silver-print styling
- JSON import/export
- CSV export
- Monochrome HTML field journal export
- Print / Save PDF support through the browser print dialog
- Sample trail data loader

## Files

- `index.html` — app markup
- `styles.css` — responsive visual design
- `app.js` — app logic and local persistence
- `manifest.webmanifest` — basic install metadata

## Installation

Upload all files in this folder to a web server directory. Open `index.html` in a browser. No build step is required.

## Data note

Trail Muse stores data locally in the browser on the current device. Use JSON export/import to move or back up a journal.
