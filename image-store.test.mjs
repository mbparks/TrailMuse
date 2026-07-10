/* v2.9.0 IndexedDB image store: migration, reload rehydration, export inlining,
   dialog re-save, and clear-all. Verified through the app's observable outputs
   (DOM + localStorage) using a shared fake IndexedDB across simulated reloads. */
import { JSDOM } from "jsdom";
import fs from "fs";
import { IDBFactory, IDBKeyRange } from "fake-indexeddb";

const sharedIDB = new IDBFactory(); // one device, persists across reloads
const appjs = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8")
  .replace(/<script src="app\.js[^"]*"><\/script>/, "");
const MARK = "/9j/4AAQSkZJRgABAQ";
const DATAURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD";

async function boot(seedState, blobSink) {
  const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://mbparks.com/" });
  const { window } = dom, doc = window.document;
  window.alert = () => {}; window.confirm = () => true; window.scrollTo = () => {};
  window.matchMedia ||= () => ({ matches:false, addEventListener(){}, addListener(){} });
  window.URL.createObjectURL = () => "blob:x"; window.URL.revokeObjectURL = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.HTMLAnchorElement.prototype.click = function(){};
  window.indexedDB = sharedIDB; window.IDBKeyRange = IDBKeyRange;
  if (blobSink) { const RealBlob = window.Blob; window.Blob = function(parts, opts){ blobSink.text = String(parts?.[0] ?? ""); return new RealBlob(parts, opts); }; }
  if (seedState !== undefined) window.localStorage.setItem("fi077_trail_muse_state_v1", JSON.stringify(seedState));
  const errors = []; window.onerror = m => errors.push(String(m));
  window.addEventListener("unhandledrejection", e => errors.push("unhandled: " + (e.reason?.message || e.reason)));
  const s = doc.createElement("script"); s.textContent = appjs; doc.body.appendChild(s);
  doc.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles:true }));
  await new Promise(r => setTimeout(r, 120)); // let async load/migrate settle
  return { window, doc, errors };
}
const lsState = window => JSON.parse(window.localStorage.getItem("fi077_trail_muse_state_v1") || "{}");
const goJournal = doc => { const b = [...doc.querySelectorAll("[data-view]")].find(x => x.dataset.view === "journal"); if (b) b.click(); };

const results = [];
const check = (l, c) => { results.push([l, !!c]); console.log((c ? "ok   - " : "FAIL - ") + l); };

// T1: legacy inline image migrates into IndexedDB, out of localStorage
let migratedImageId = "";
{
  const seed = { entries:[{ id:"leg1", type:"Photography Note", title:"legacy", note:"x", image:DATAURL, createdAt:new Date().toISOString() }], projects:[], artifacts:[] };
  const { window, doc, errors } = await boot(seed);
  check("T1 boot no errors", errors.length === 0);
  const e = lsState(window).entries[0];
  migratedImageId = e.imageId;
  check("T1 entry got an imageId", !!e.imageId);
  check("T1 inline image dropped from entry", !("image" in e) || !e.image);
  check("T1 no base64 left in localStorage", !JSON.stringify(lsState(window)).includes(MARK));
  goJournal(doc); await new Promise(r => setTimeout(r, 20));
  check("T1 journal renders the image (same session)", doc.getElementById("journalList").innerHTML.includes(MARK));
}

// T2: reload (fresh window, empty cache, SAME IndexedDB) rehydrates image from IDB
{
  const seed = { entries:[{ id:"leg1", type:"Photography Note", title:"reload", note:"x", imageId:migratedImageId, createdAt:new Date().toISOString() }], projects:[], artifacts:[] };
  const { doc, errors } = await boot(seed);
  check("T2 reload no errors", errors.length === 0);
  goJournal(doc); await new Promise(r => setTimeout(r, 20));
  check("T2 image rehydrated from IndexedDB on reload", doc.getElementById("journalList").innerHTML.includes(MARK));
}

// T3: JSON export re-inlines the image for a portable archive
{
  const seed = { entries:[{ id:"leg1", type:"Photography Note", title:"exp", note:"x", imageId:migratedImageId, createdAt:new Date().toISOString() }], projects:[], artifacts:[] };
  const sink = {};
  const { window, doc } = await boot(seed, sink);
  doc.getElementById("exportJson").click();
  await new Promise(r => setTimeout(r, 20));
  check("T3 export payload inlines the image data URL", (sink.text || "").includes(MARK));
  check("T3 stored state still holds no base64", !JSON.stringify(lsState(window)).includes(MARK));
}

// T4: editing an image entry through the dialog preserves its image, no base64 leak
{
  const seed = { entries:[{ id:"leg1", type:"Photography Note", title:"edit", note:"x", imageId:migratedImageId, createdAt:new Date().toISOString() }], projects:[], artifacts:[] };
  const { window, doc, errors } = await boot(seed);
  goJournal(doc); await new Promise(r => setTimeout(r, 20));
  const editBtn = doc.querySelector('#journalList [data-action="edit"]');
  if (editBtn) editBtn.click(); else { const c = doc.querySelector("#journalList .entry-card"); if (c) c.click(); }
  await new Promise(r => setTimeout(r, 20));
  doc.getElementById("entryForm").dispatchEvent(new window.Event("submit", { bubbles:true, cancelable:true }));
  await new Promise(r => setTimeout(r, 40));
  const e = lsState(window).entries.find(x => x.id === "leg1");
  check("T4 edit kept the imageId", !!(e && e.imageId));
  check("T4 edit leaked no base64 to localStorage", !JSON.stringify(lsState(window)).includes(MARK));
  check("T4 edit no errors", errors.length === 0);
}

// T5: a plain text entry has no imageId and saves cleanly (regression)
{
  const { window, doc, errors } = await boot({ entries:[], projects:[], artifacts:[] });
  doc.getElementById("openFullCapture").click();
  doc.getElementById("entryNote").value = "No photo here.";
  doc.getElementById("entryForm").dispatchEvent(new window.Event("submit", { bubbles:true, cancelable:true }));
  await new Promise(r => setTimeout(r, 40));
  const e = lsState(window).entries[0];
  check("T5 text entry saved", !!e);
  check("T5 text entry has empty imageId", e && (!e.imageId || e.imageId === ""));
  check("T5 no errors", errors.length === 0);
}

// T6: clear-all runs the IndexedDB clear path without error
{
  const seed = { entries:[{ id:"leg1", type:"Photography Note", title:"clr", note:"x", imageId:migratedImageId, createdAt:new Date().toISOString() }], projects:[], artifacts:[] };
  const { window, doc, errors } = await boot(seed);
  doc.getElementById("clearAllConfirmation").value = "CLEAR";
  doc.getElementById("clearAllForm").dispatchEvent(new window.Event("submit", { bubbles:true, cancelable:true }));
  await new Promise(r => setTimeout(r, 40));
  check("T6 clear-all emptied entries", (lsState(window).entries || []).length === 0);
  check("T6 clear-all no errors", errors.length === 0);
}

const failed = results.filter(r => !r[1]).length;
console.log("\n--- image-store failures:", failed);
process.exit(failed ? 1 : 0);
