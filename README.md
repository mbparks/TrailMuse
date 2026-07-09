# FI-077 Trail Muse v1.2

Trail Muse is a mobile-first creative field prompt generator and field journal for hikers, artists, writers, and photographers. The visual language is inspired by classic monochrome wilderness photography: silver gelatin prints, contact sheets, tonal zones, shadow detail, and patient looking.

## What is new in v1.2

v1.2 is the **Field Capture Upgrade**. It focuses on making Trail Muse faster and more useful outdoors.

- Added a one-tap **Field Console** on the Muse screen.
- Added a fast-capture panel on the Capture screen.
- Added thumb-friendly capture flows for Trail Thought, Photography Note, Found Object, Small Discovery, Sensory Note, and Make Later.
- Added field-condition metadata for entries and sessions:
  - light
  - weather
  - terrain
  - pace / use mode
- Added **Sunlight mode** for higher contrast and larger reading rhythm in bright outdoor conditions.
- Added draft recovery for unsaved field notes.
- Added **Save + keep walking** behavior.
- Added richer session context to the active session pill.
- Added field conditions to journal cards, CSV export, and HTML journal export.
- Updated demo data with session conditions.

## Core modules

- Random field prompt
- Sensory prompt
- Drawing prompt
- Photography prompt
- Writing prompt
- Found object note
- Trail thought
- Small discovery
- Make something from this later
- Creative follow-up queue
- Studio dashboard
- Field journal export

## Use model

Trail Muse is designed around two modes:

1. **Field Mode**: quick prompts and fast capture while outdoors.
2. **Studio Mode**: later review, sorting, exporting, and developing raw sparks into finished creative work.

## Storage

The app is a standalone HTML/CSS/JS web app. It uses browser localStorage for autosave. Export JSON regularly if you want a durable backup.

## Files

- `index.html` — app shell and UI structure
- `styles.css` — monochrome visual system and responsive layout
- `app.js` — local data model, prompt engine, autosave, exports, and interaction logic
- `manifest.webmanifest` — install metadata

## Version

Visible app version: **FI-077 · v1.2**
