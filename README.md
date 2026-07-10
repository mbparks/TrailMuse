# FI-077 Trail Muse v2.7.9

A local-first, monochrome creative field prompt generator and journal for hikers, artists, writers, and photographers. Trail Muse runs as static HTML, CSS, and a single `app.js`, with no build step. All data stays in the browser and is included in full JSON archive exports.

## Workflow

Trail Muse follows one direct creative workflow:

1. Capture field notes in **Muse**. A phone-first Trail Mode handles quick captures, sessions, and prompts.
2. Create projects and assign captures in **Journal**.
3. Record finished artifacts in **Studio**.

Studio is focused on selecting a project, reviewing its source captures, recording finished artifacts, and exporting the project. It keeps three compact, collapsible support areas:

- Archive Health for JSON backup status, metadata readiness, and the guarded "Clear all stored data" control.
- Export Studio for project, contact-sheet, zine, gallery, harvest, Markdown, CSV, HTML, and print outputs.
- Prompt Deck Editor for creating, cloning, importing, exporting, and selecting Muse prompt decks.

An **Analytics** view provides review-only reporting: hike duration, capture frequency, entry-type mix, trail conditions, project readiness, timeline distribution, and per-hike rollups, filterable to one hike or the full archive.

Existing entry-level project names are migrated into Journal projects automatically on load.

## Lifecycle timestamps

Trail Muse records ISO date/time values when a hike starts, when it finishes, and when each field entry is created. Legacy `startedAt`, `endedAt`, and `createdAt` fields are preserved alongside explicit `startTimestamp`, `finishTimestamp`, and `capturedAt` fields. Captured time appears in the Journal and in JSON, CSV, HTML, and Markdown exports.

## Data controls

- All data is local-first and exportable as a full JSON archive.
- Archive Health includes a guarded **Clear all stored data** control that requires typing `CLEAR` before deletion is enabled. It removes locally stored hikes, entries, projects, artifacts, custom decks, drafts, backup metadata, and preferences.

## Changelog

### v2.7.9 (cleanup pass)

This release is a maintenance pass with no intended change to on-screen behavior. It removes accumulated dead code and fixes a latent crash.

- Fixed a missing `uid()` helper. The project and artifact normalizers referenced `uid()`, which was never defined. On any archive that needed project migration (an entry whose project name had no stored project record), this threw a `ReferenceError` inside `renderAll` and could take down rendering. Added the helper and confirmed legacy archives now migrate cleanly.
- Removed two shadowed copies of the app. Roughly 300 lines of duplicate `render*` and analytics functions were being overridden by later definitions and never ran. They are gone.
- Removed the previously retired features that were still present in code but disconnected from the interface: Make Later board, follow-up engine, project and specimen galleries, series builder, studio command center, studio workflow, darkroom review scoring, tag cloud, and the desktop session console, plus their helpers and exports.
- Collapsed four competing project-creation paths into one. Removed the inline bootstrap script, the button `onclick` handler, and two redundant event-binding installers. Project creation now uses a single in-app dialog with no full-page reload. Duplicate-name validation and edit-in-place are preserved.
- Pruned event bindings and cached element lookups that pointed at DOM removed from the page.
- `app.js` went from about 5,080 lines to about 3,520.

Removed source is snapshotted in `archive/removed-legacy-code.js` for reference. It is not loaded by the app.

### v2.7.8

- Restored Studio essentials (Archive Health, Export Studio, Prompt Deck Editor) as compact collapsible panels.
- Added lifecycle timestamps (`startTimestamp`, `finishTimestamp`, `capturedAt`) while preserving legacy fields.
- Added the review-only Analytics module.
- Added the guarded "Clear all stored data" control.
- Replaced browser prompts with a styled in-app project dialog, added duplicate-name validation, and used the same dialog for editing.

## Known limitations

- `manifest.webmanifest` declares no icons, so installed PWA instances fall back to a default icon.
- Analytics and exports operate on locally stored data only. There is no sync or backup beyond manual JSON export.
- The desktop layout and the phone Trail Mode share state but are separate interfaces. Very narrow desktop windows fall back to Trail Mode below 800px.

## License

GPL-3.0
