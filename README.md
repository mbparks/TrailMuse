# FI-077 Trail Muse v2.2

Trail Muse is a local-first, mobile-first creative field journal and desktop darkroom studio for hikers, artists, writers, and photographers.

## v2.2 focus: Trail Mode Simplification

v2.2 responds to real trail-use feedback. The app now does less while the user is outside. The Muse screen becomes the main hiking surface: start the walk, save one sentence, expose a prompt, or open one of four useful capture cards. Everything else can wait until later review on a PC.

## New in v2.2

- Consolidated the outdoor workflow into a new **Trail Mode** console on the Muse screen.
- Removed the separate sunlight mode button so there is now only one visible **Light/Dark** mode toggle.
- Added a **Start session** button directly to the Muse screen when there is no active session.
- Added quick session starter fields:
  - trail / walk name
  - weather
  - terrain
- Added a **Save + keep walking** quick note box for one-sentence captures without opening the full form.
- Reduced the main outdoor quick actions to four essentials:
  - Thought
  - Photo
  - Object
  - Discovery
- Added a dedicated **Expose prompt** button to Trail Mode.
- Expanded weather choices with partly cloudy, overcast, fog, drizzle, thunderstorm nearby, flurries, frost, ice, high wind, humid, hot/hazy, cold/clear, and damp ground.
- Expanded terrain choices with canal trail, towpath, lake trail, river trail, mountain trail, wetland/marsh, boardwalk, gravel path, paved greenway, and rail trail.
- Reframed the prompt-side quick panel as a trail rule: capture one useful trace, pocket the phone, and keep walking.
- Updated visible version to **FI-077 · v2.2**.

## Design intent

Trail Muse should not compete with the hike. The v2.2 outdoor workflow is designed around a simple principle:

> Capture the trace. Pocket the phone. Keep walking.

The deeper features still exist for later review: journal, contact sheet, Make Later queue, darkroom review, sessions, prompt decks, specimen drawer, export studio, series builder, and archive health.

## Local-first behavior

Trail Muse stores data locally in the browser with localStorage. Use JSON export as the backup mechanism before clearing browser data or moving to another device.

## Files

- `index.html` — app shell and UI
- `styles.css` — monochrome, mobile-first, silver-print visual system
- `app.js` — state, prompts, sessions, capture, journal, studio, exports
- `manifest.webmanifest` — installable web app metadata

Field Instrument 077 · Trail Muse v2.2
