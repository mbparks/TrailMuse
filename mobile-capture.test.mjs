/* v2.11.3 Mobile capture sheet: selecting a type must collapse the type chooser
   (and hide the empty image preview). The toggle sets [hidden]; the mobile CSS
   uses display:...!important, so a [hidden] override is required for it to take
   effect. This test checks both the toggle behavior and the CSS override. */
import { JSDOM } from "jsdom";
import fs from "fs";

const appjs = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const htmlRaw = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const html = htmlRaw.replace(/<script src="app\.js[^"]*"><\/script>/, "");

const results = [];
const check = (l, c) => { results.push([l, !!c]); console.log((c ? "ok   - " : "FAIL - ") + l); };

// --- CSS regression: [hidden] overrides for the !important-display mobile elements ---
check("type-grid has a [hidden] override", htmlRaw.includes(".mobile-type-grid[hidden]{display:none!important}"));
check("capture-preview has a [hidden] override", htmlRaw.includes(".mobile-capture-preview[hidden]{display:none!important}"));

// --- Functional: choosing a type collapses the chooser and shows the fields ---
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://mbparks.com/" });
const { window } = dom, doc = window.document;
window.alert = () => {}; window.confirm = () => true; window.scrollTo = () => {};
window.matchMedia ||= () => ({ matches:false, addEventListener(){}, addListener(){} });
window.URL.createObjectURL = () => "b"; window.URL.revokeObjectURL = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};
// jsdom dialogs: showModal/close may be missing; stub minimally
window.HTMLDialogElement.prototype.showModal ||= function(){ this.open = true; };
window.HTMLDialogElement.prototype.close ||= function(){ this.open = false; };
const sid = "s1";
window.localStorage.setItem("fi077_trail_muse_state_v1", JSON.stringify({
  currentSessionId: sid,
  sessions: [{ id: sid, name: "Test hike", startedAt: new Date().toISOString(), endedAt: null }],
  entries: [], projects: [], artifacts: []
}));
const errors = []; window.onerror = m => errors.push(String(m));
const s = doc.createElement("script"); s.textContent = appjs; doc.body.appendChild(s);
doc.dispatchEvent(new window.Event("DOMContentLoaded", { bubbles:true }));
await new Promise(r => setTimeout(r, 60));

check("boot no errors", errors.length === 0);
const chooser = doc.getElementById("mobileTypeChooser");
const fields = doc.getElementById("mobileCaptureFields");
// tap a direct-type button on the active screen (e.g., Discovery)
const direct = doc.querySelector('[data-mobile-direct-type="Small Discovery"]');
check("direct-type button exists", direct !== null);
if (direct) direct.click();
await new Promise(r => setTimeout(r, 20));
check("chooser is hidden after selecting a type", chooser.hidden === true);
check("capture fields are shown after selecting a type", fields.hidden === false);
check("selected type is applied", doc.getElementById("mobileCaptureType").value === "Small Discovery");

// tapping a different type inside the sheet still keeps the chooser hidden
const inChooser = chooser.querySelector('[data-mobile-type="Found Object"]');
if (inChooser) inChooser.click();
await new Promise(r => setTimeout(r, 10));
check("chooser stays hidden after switching type", chooser.hidden === true);

const failed = results.filter(r => !r[1]).length;
console.log("\n--- mobile-capture failures:", failed);
process.exit(failed ? 1 : 0);
