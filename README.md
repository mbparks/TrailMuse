# FI-077 Trail Muse v2.11.3

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

### v2.11.3 (mobile capture sheet)

Fixed the mobile capture sheet showing the type chooser buttons after a type was already selected. The chooser now collapses once you pick a type, leaving just the note field and attachments.

- Root cause: the mobile CSS set the chooser and the image preview to display with !important, which overrode the hidden attribute, so they never actually hid. Added [hidden] overrides for both, matching the pattern already used for the mobile stages.
- The same bug was leaving an empty "Selected field image" preview visible before any photo was added; that is fixed too.
- Added a regression test that checks both the toggle behavior and the presence of the CSS overrides.

### v2.11.2 (prompt label)

Renamed the "Expose prompt" quick-capture button to just "Prompt" on desktop, matching the mobile label. Updated the prompt-deck heading that references it. The photography-exposure language elsewhere (the EXPOSE / WALK / RETURN motif and similar) is unchanged.

### v2.11.1 (consistent field entry types)

Reconciled the field entry types across every capture surface. All of them now offer exactly the same set: Expose prompt, Thought, Object, Discovery, Sensory.

- Added Sensory to the desktop quick-capture row and the mobile active-screen grid.
- Removed a stale Photo card from the mobile active-screen grid, and Writing from the mobile type sheet.
- Dropped Drawing, Writing, and Make Later from the type dropdown and the capture library, leaving the five canonical entries.
- Added a consistency test that fails if any surface drifts from the canonical set, so this cannot silently regress again.

### v2.11.0 (photo and audio as attachments)

Removed "Photo" and "Audio" as dedicated field entry types. Photography and recording are now attachment elements available on any entry (thought, object, discovery, sensory, prompt response, and so on), rather than entry types of their own.

- Dropped both from the type dropdown, the Muse quick-capture row, the capture library, and the mobile type chooser.
- The photo attachment input and the ten-second recorder remain in the dialog and in Trail Mode for every entry, and playback still appears on cards and in the mobile lists.
- Existing Photography Note entries are unaffected: their type still displays and their photos still render. Only the ability to create new entries of those two types was removed.

### v2.10.2 (mobile audio playback)

Fixed Audio Notes not playing back in Trail Mode. The mobile recent-entries cards and the full entries list now render an inline audio player, matching the desktop journal and the way photos already appeared in the mobile list.

### v2.10.1 (audio quick capture)

Added an Audio card to the Muse module quick-capture row, next to Photo, so a field recording can be started in one tap like the other entry types. The quick-capture grid now holds six cards across.

### v2.10.0 (audio notes)

Added "Audio Note" as a field entry type with a short in-app recorder.

- The dialog and Trail Mode both gain a recorder that captures up to ten seconds of sound, then stops on its own. A live countdown shows the time left, and the clip can be played back or removed before saving.
- Recordings are stored in IndexedDB alongside photos (a second object store in the same media database), mirrored into a runtime cache so cards and exports stay synchronous. Nothing audio-related is written to local storage.
- Legacy or imported archives migrate inline audio into the store automatically, the same way photos do. JSON exports re-inline each recording as a data URL so an archive stays self-contained and portable.
- Journal cards play recordings inline with a standard audio control. Audio presence also feeds the "worth returning to" review scoring.
- Recording needs microphone permission and a browser that supports MediaRecorder. Where either is missing, the recorder reports the problem and the rest of the app is unaffected.

### v2.9.0 (image store)

Field photos now live in IndexedDB instead of local storage, so a photo-heavy archive no longer risks filling the local-storage quota.

- Entries carry a small `imageId` reference. The image bytes are kept in an IndexedDB store ("trail-muse" / "images"), mirrored into a runtime cache so rendering and exports stay synchronous.
- Legacy archives migrate automatically on load: any entry still holding an inline data URL is moved into IndexedDB once, then dropped from the saved state. The same migration runs after a JSON import, so imported photos are absorbed too.
- JSON exports re-inline each image as a data URL, so a `.json` archive stays fully self-contained and portable to another device.
- Migration is serialized and boot-load runs once, so a double trigger (for example a boot that overlaps an import) can never race or duplicate a stored image.
- `saveState` now guards against a full-storage error and warns the user to export a backup instead of failing silently.
- If IndexedDB is unavailable, images fall back to inline data URLs on the entry, preserving behavior without the quota relief.

### v2.8.0 (offline field support)

Trail Muse is now an installable, offline-capable PWA, which is the point of a field instrument you carry where there is no signal.

- Added a service worker (`sw.js`) that precaches the app shell (HTML, CSS, `app.js`, manifest, icons). After the first load, the app opens and runs with no network. Navigations are network-first so online loads stay fresh, with the cached shell as fallback; other assets are cache-first.
- Added a real icon set: `icons/icon-192.png`, `icons/icon-512.png`, a maskable 512 variant, an Apple touch icon, and an SVG favicon, generated from `icons/icon.svg`.
- Rewrote `manifest.webmanifest` with the icon set, an app `id`, an explicit `scope`, portrait orientation, and a dark `background_color` to match `theme_color`.
- Registered the service worker from `app.js`, feature-detected and error-guarded, so unsupported browsers and test environments are unaffected.

Deploy note: the cache is versioned as `trail-muse-2.8.0` and old caches are cleared on activation, so the `CACHE_VERSION` in `sw.js` must be bumped on every release. Make sure `sw.js` itself is not served with a long cache lifetime, or clients will not pick up new releases.

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

- After a release, an open tab keeps serving the previous cached shell until it is closed and reopened, since the new service worker activates on next load.
- Analytics and exports operate on locally stored data only. There is no sync or backup beyond manual JSON export.
- Field photos and audio recordings are stored in IndexedDB, whose quota is far larger than local storage but still finite and browser-managed. If IndexedDB is unavailable (for example some private-browsing modes), media falls back to inline storage and the older local-storage cap applies.
- Audio capture depends on the browser MediaRecorder API and microphone permission. Recording format follows whatever the browser produces (commonly WebM/Opus, or MP4/AAC on Safari); playback uses the same data, so a clip recorded in one browser plays back anywhere that supports its format.
- The desktop layout and the phone Trail Mode share state but are separate interfaces. Very narrow desktop windows fall back to Trail Mode below 800px.

## License

GPL-3.0
