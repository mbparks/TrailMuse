/* v2.10.0 Audio Note: IndexedDB audio store migration, reload rehydration,
   export inlining, coexistence with images, clear-all, the recorder pipeline
   (with a mocked MediaRecorder), and the new type in the dialog. Verified
   through observable outputs (DOM + localStorage) over a shared fake IndexedDB. */
import { JSDOM } from "jsdom";
import fs from "fs";
import { IDBFactory, IDBKeyRange } from "fake-indexeddb";

const sharedIDB = new IDBFactory();
const appjs = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8")
  .replace(/<script src="app\.js[^"]*"><\/script>/, "");

const IMG = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD";
const IMG_MARK = "/9j/4AAQSkZJRgABAQ";
const AUD = "data:audio/webm;base64,VFJBSUxNVVNFQVVESU8=";      // "TRAILMUSEAUDIO"
const AUD_MARK = "VFJBSUxNVVNFQVVESU8";

class FakeMediaRecorder {
  constructor(stream) { this.stream = stream; this.state = "inactive"; this.mimeType = "audio/webm"; this.ondataavailable = null; this.onstop = null; }
  start() { this.state = "recording"; }
  stop() {
    this.state = "inactive";
    if (this.ondataavailable) this.ondataavailable({ data: new this.stream._Blob(["TRAILMUSEAUDIO"], { type: "audio/webm" }) });
    if (this.onstop) this.onstop();
  }
}

async function boot(seedState, { withRecorder = false, blobSink } = {}) {
  const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://mbparks.com/" });
  const { window } = dom, doc = window.document;
  window.alert = () => {}; window.confirm = () => true; window.scrollTo = () => {};
  window.matchMedia ||= () => ({ matches:false, addEventListener(){}, addListener(){} });
  window.URL.createObjectURL = () => "blob:x"; window.URL.revokeObjectURL = () => {};
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.HTMLAnchorElement.prototype.click = function(){};
  window.indexedDB = sharedIDB; window.IDBKeyRange = IDBKeyRange;
  if (withRecorder) {
    const Blob = window.Blob;
    window.MediaRecorder = FakeMediaRecorder;
    Object.defineProperty(window.navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: async () => ({ getTracks: () => [{ stop(){} }], _Blob: Blob }) }
    });
  }
  if (blobSink) { const RealBlob = window.Blob; window.Blob = function(parts, opts){ blobSink.text = String(parts?.[0] ?? ""); return new RealBlob(parts, opts); }; }
  if (seedState !== undefined) window.localStorage.setItem("fi077_trail_muse_state_v1", JSON.stringify(seedState));
  const errors = []; window.onerror = m => errors.push(String(m));
  window.addEventListener("unhandledrejection", e => errors.push("unhandled: " + (e.reason?.message || e.reason)));
  const s = doc.createElement("script"); s.textContent = appjs; doc.body.appendChild(s);
  doc.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles:true }));
  await new Promise(r => setTimeout(r, 120));
  return { window, doc, errors };
}
const lsState = window => JSON.parse(window.localStorage.getItem("fi077_trail_muse_state_v1") || "{}");
const goJournal = doc => { const b = [...doc.querySelectorAll("[data-view]")].find(x => x.dataset.view === "journal"); if (b) b.click(); };

const results = [];
const check = (l, c) => { results.push([l, !!c]); console.log((c ? "ok   - " : "FAIL - ") + l); };

// A1: the Audio Note type is present in the dialog dropdown
{
  const { doc } = await boot({ entries:[], projects:[], artifacts:[] });
  const options = [...doc.getElementById("entryType").options].map(o => o.value);
  check("A1 Audio Note is a selectable type", options.includes("Audio Note"));
}

// A2: legacy inline audio migrates into the audio store, out of localStorage
let audioId = "";
{
  const seed = { entries:[{ id:"a1", type:"Audio Note", title:"rec", note:"x", audio:AUD, createdAt:new Date().toISOString() }], projects:[], artifacts:[] };
  const { window, doc, errors } = await boot(seed);
  check("A2 boot no errors", errors.length === 0);
  const e = lsState(window).entries[0];
  audioId = e.audioId;
  check("A2 entry got an audioId", !!e.audioId);
  check("A2 inline audio dropped from entry", !("audio" in e) || !e.audio);
  check("A2 no audio base64 in localStorage", !JSON.stringify(lsState(window)).includes(AUD_MARK));
  goJournal(doc); await new Promise(r => setTimeout(r, 20));
  check("A2 journal renders an <audio> element", doc.querySelector("#journalList audio.entry-audio") !== null);
}

// A3: reload (fresh window, empty cache, SAME IndexedDB) rehydrates audio from IDB
{
  const seed = { entries:[{ id:"a1", type:"Audio Note", title:"reload", note:"x", audioId, createdAt:new Date().toISOString() }], projects:[], artifacts:[] };
  const { doc, errors } = await boot(seed);
  check("A3 reload no errors", errors.length === 0);
  goJournal(doc); await new Promise(r => setTimeout(r, 20));
  const au = doc.querySelector("#journalList audio.entry-audio");
  check("A3 audio rehydrated from IndexedDB", au && (au.getAttribute("src") || "").includes(AUD_MARK));
}

// A4: JSON export re-inlines the audio for a portable archive
{
  const seed = { entries:[{ id:"a1", type:"Audio Note", title:"exp", note:"x", audioId, createdAt:new Date().toISOString() }], projects:[], artifacts:[] };
  const sink = {};
  const { window, doc } = await boot(seed, { blobSink: sink });
  doc.getElementById("exportJson").click();
  await new Promise(r => setTimeout(r, 20));
  check("A4 export payload inlines the audio data URL", (sink.text || "").includes(AUD_MARK));
  check("A4 stored state still holds no audio base64", !JSON.stringify(lsState(window)).includes(AUD_MARK));
}

// A5: an entry with BOTH image and audio migrates and renders both, stores stay separate
{
  const seed = { entries:[{ id:"b1", type:"Audio Note", title:"both", note:"x", image:IMG, audio:AUD, createdAt:new Date().toISOString() }], projects:[], artifacts:[] };
  const { window, doc, errors } = await boot(seed);
  check("A5 boot no errors", errors.length === 0);
  const e = lsState(window).entries[0];
  check("A5 both media dropped from localStorage", !JSON.stringify(lsState(window)).includes(IMG_MARK) && !JSON.stringify(lsState(window)).includes(AUD_MARK));
  check("A5 entry carries both ids", !!e.imageId && !!e.audioId);
  goJournal(doc); await new Promise(r => setTimeout(r, 20));
  const jl = doc.getElementById("journalList").innerHTML;
  check("A5 renders both image and audio", jl.includes(IMG_MARK) && jl.includes(AUD_MARK));
}

// A6: clear-all clears the audio store without error
{
  const seed = { entries:[{ id:"a1", type:"Audio Note", title:"clr", note:"x", audioId, createdAt:new Date().toISOString() }], projects:[], artifacts:[] };
  const { window, doc, errors } = await boot(seed);
  doc.getElementById("clearAllConfirmation").value = "CLEAR";
  doc.getElementById("clearAllForm").dispatchEvent(new window.Event("submit", { bubbles:true, cancelable:true }));
  await new Promise(r => setTimeout(r, 40));
  check("A6 clear-all emptied entries", (lsState(window).entries || []).length === 0);
  check("A6 clear-all no errors", errors.length === 0);
}

// A7: the recorder pipeline (mocked MediaRecorder) records, stores, and saves
{
  const { window, doc, errors } = await boot({ entries:[], projects:[], artifacts:[] }, { withRecorder: true });
  doc.getElementById("openFullCapture").click();
  await new Promise(r => setTimeout(r, 10));
  doc.getElementById("entryType").value = "Audio Note";
  doc.getElementById("entryRecord").click();          // startAudioRecording (async getUserMedia)
  await new Promise(r => setTimeout(r, 20));
  check("A7 stop button shown while recording", doc.getElementById("entryStopRecord").hidden === false);
  doc.getElementById("entryStopRecord").click();       // stop -> ondataavailable -> onstop -> FileReader
  await new Promise(r => setTimeout(r, 40));
  check("A7 preview shows the recording", doc.getElementById("audioPreviewWrap").hidden === false);
  doc.getElementById("entryForm").dispatchEvent(new window.Event("submit", { bubbles:true, cancelable:true }));
  await new Promise(r => setTimeout(r, 40));
  const e = lsState(window).entries[0];
  check("A7 saved entry has an audioId", !!(e && e.audioId));
  check("A7 recording not left as base64 in localStorage", !JSON.stringify(lsState(window)).includes(AUD_MARK));
  check("A7 no errors", errors.length === 0);
}

const failed = results.filter(r => !r[1]).length;
console.log("\n--- audio-store failures:", failed);
process.exit(failed ? 1 : 0);
