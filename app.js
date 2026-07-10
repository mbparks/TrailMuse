const APP_VERSION = "2.9.0";
const STORAGE_KEY = "fi077_trail_muse_state_v1";
const DRAFT_KEY = "fi077_trail_muse_entry_draft_v1";

/* Stable unique id used by projects and artifacts. */
function uid(prefix = "id") {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 9);
}

/* ---------------------------------------------------------------------------
   Image store. Field photos live in IndexedDB, not local storage, so a
   photo-heavy archive never blows the local-storage quota. A runtime cache
   mirrors the store so rendering and exports can look images up synchronously.
   If IndexedDB is unavailable, images fall back to inline data URLs on the
   entry, which preserves behavior at the cost of the quota relief.
--------------------------------------------------------------------------- */
const IMAGE_DB = "trail-muse";
const IMAGE_STORE = "images";
const imageCache = new Map();

function imageDbAvailable() {
  return typeof indexedDB !== "undefined" && indexedDB !== null;
}

function openImageDb() {
  return new Promise((resolve, reject) => {
    if (!imageDbAvailable()) { reject(new Error("IndexedDB unavailable")); return; }
    const request = indexedDB.open(IMAGE_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) db.createObjectStore(IMAGE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbWrite(action) {
  return openImageDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, "readwrite");
    action(tx.objectStore(IMAGE_STORE));
    tx.oncomplete = () => { db.close(); resolve(true); };
    tx.onerror = () => { db.close(); reject(tx.error); };
    tx.onabort = () => { db.close(); reject(tx.error); };
  }));
}

function idbPutImage(id, dataUrl) { return idbWrite(store => store.put(dataUrl, id)); }
function idbDeleteImage(id) { return idbWrite(store => store.delete(id)); }
function idbClearImages() { return idbWrite(store => store.clear()); }

function idbGetAllImages() {
  return openImageDb().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(IMAGE_STORE, "readonly");
    const store = tx.objectStore(IMAGE_STORE);
    const map = new Map();
    const cursor = store.openCursor();
    cursor.onsuccess = () => { const c = cursor.result; if (c) { map.set(c.key, c.value); c.continue(); } };
    tx.oncomplete = () => { db.close(); resolve(map); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  }));
}

/* Synchronous lookups used everywhere images are shown or exported. */
function imageSrcFor(entry) {
  if (!entry) return "";
  if (entry.imageId && imageCache.has(entry.imageId)) return imageCache.get(entry.imageId);
  if (entry.image) return entry.image;
  return "";
}
function entryHasImage(entry) {
  return Boolean(entry && (entry.imageId ? imageCache.has(entry.imageId) || entry.image : entry.image));
}

/* Load the store into the cache, then migrate any inline images into it. Runs
   its body at most once even if boot fires more than once. */
let imagesReady = null;
function loadImagesFromDb() {
  if (!imageDbAvailable()) return Promise.resolve();
  if (imagesReady) return imagesReady;
  imagesReady = (async () => {
    try {
      const map = await idbGetAllImages();
      map.forEach((value, key) => imageCache.set(key, value));
    } catch (error) {
      console.warn("Trail Muse could not load stored images.", error);
      return;
    }
    await migrateInlineImages();
  })();
  return imagesReady;
}

/* Move any entry that still carries an inline data URL into the store. Runs on
   boot for legacy archives and after import for portable JSON archives. Calls
   are serialized so two triggers can never race and duplicate a blob. */
let migrateChain = Promise.resolve();
function migrateInlineImages() {
  migrateChain = migrateChain.then(() => runInlineImageMigration());
  return migrateChain;
}
async function runInlineImageMigration() {
  if (!imageDbAvailable()) return;
  let changed = false;
  for (const entry of state.entries) {
    if (!entry.image) continue;
    const id = entry.imageId || uid("img");
    try {
      await idbPutImage(id, entry.image);
      imageCache.set(id, entry.image);
      entry.imageId = id;
      delete entry.image;
      changed = true;
    } catch (error) {
      console.warn("Trail Muse could not move an image into IndexedDB; keeping it inline.", error);
    }
  }
  if (changed) saveState();
}

/* Persist the current dialog/mobile image and return the id to store on the
   entry. Falls back to an inline data URL if IndexedDB write fails. */
async function persistImage(dataUrl, existingImageId = "") {
  if (dataUrl) {
    const id = existingImageId || uid("img");
    try {
      await idbPutImage(id, dataUrl);
      imageCache.set(id, dataUrl);
      return { imageId: id, image: "" };
    } catch (error) {
      console.warn("Trail Muse stored an image inline as a fallback.", error);
      return { imageId: "", image: dataUrl };
    }
  }
  if (existingImageId) {
    imageCache.delete(existingImageId);
    idbDeleteImage(existingImageId).catch(() => {});
  }
  return { imageId: "", image: "" };
}

function forgetEntryImage(entry) {
  if (entry?.imageId) {
    imageCache.delete(entry.imageId);
    idbDeleteImage(entry.imageId).catch(() => {});
  }
}

const entryTypes = [
  "Prompt Response",
  "Sensory Note",
  "Drawing Note",
  "Photography Note",
  "Writing Note",
  "Found Object",
  "Trail Thought",
  "Small Discovery"
];

const statuses = ["Raw Capture", "Worth Returning To", "Develop Further", "In Progress", "Finished", "Archived"];
const laterColumns = ["Worth Returning To", "Develop Further", "In Progress", "Finished"];
const priorityLevels = ["Low", "Normal", "High", "Critical"];
const energyLevels = ["Tiny edit", "One sitting", "Deep work", "Research trail"];
const legacyStatusMap = {
  "Raw Spark": "Raw Capture",
  "Needs Review": "Worth Returning To",
  "Ready to Make": "Develop Further",
  "Made": "Finished"
};

const quickCaptureDefaults = {
  "Trail Thought": {
    prompt: "Fast thought captured in the field.",
    tags: "thought, field note"
  },
  "Photography Note": {
    prompt: "Photo exposure to review later.",
    action: "Edit photo",
    priority: "High",
    energy: "One sitting",
    tags: "photo, contact sheet"
  },
  "Found Object": {
    prompt: "Observe, photograph, sketch, and leave natural objects in place.",
    action: "Make a specimen card",
    priority: "High",
    energy: "One sitting",
    tags: "found object, specimen",
    specimenLeftInPlace: true,
    specimenUse: "specimen card / zine page"
  },
  "Small Discovery": {
    prompt: "Small discovery worth returning to.",
    action: "Research this",
    priority: "Normal",
    energy: "Research trail",
    tags: "small discovery, attention"
  },
  "Sensory Note": {
    prompt: "Record sound, smell, texture, temperature, light, body feeling, or atmosphere.",
    action: "Combine with another exposure",
    tags: "sensory, atmosphere"
  },
  "Drawing Note": {
    prompt: "Sketch seed from the trail.",
    action: "Draw this",
    priority: "Normal",
    energy: "One sitting",
    tags: "drawing, sketch"
  },
  "Writing Note": {
    prompt: "Writing seed from the trail.",
    action: "Write this",
    priority: "Normal",
    energy: "Tiny edit",
    tags: "writing, sentence"
  },
  "Make Later": {
    prompt: "Make something from this later.",
    action: "Turn into project",
    priority: "High",
    energy: "Deep work",
    tags: "make later, darkroom queue"
  }
};

const promptDecks = {
  "Silver Light": [
    "Find the brightest thing and the deepest shadow. Describe the distance between them.",
    "Wait for the light to change one surface. What did it reveal?",
    "Frame a scene where the sky, ground, and object each carry a different tone.",
    "Look for a luminous edge: snow, cloud, water, stone, leaf, or metal catching light.",
    "What part of this place would become pure black in a print? What would stay silver?",
    "Find the quietest highlight in the scene and give it your full attention.",
    "Make a note about scale: what feels monumental, and what feels almost invisible?",
    "Describe the weather as an exposure setting.",
    "Find a place where the trail feels older than the person walking it.",
    "Stand still until the composition simplifies itself. What remains?"
  ],
  "Tonal Zones": [
    "Collect one note from Zone I: almost black, but not empty.",
    "Collect one note from Zone V: the ordinary middle tone that holds the scene together.",
    "Collect one note from Zone VIII: bright, detailed, almost disappearing.",
    "Find a ten-step gradient in the landscape, from black to white.",
    "What detail is hidden in the shadow but still present?",
    "What detail is almost lost in the highlight?",
    "Find a middle gray object and use it as the anchor of the whole scene.",
    "Describe the scene without color. Use only weight, brightness, texture, and edge.",
    "Where would you place the exposure if you could only save one detail?",
    "Make a tonal map of the view in five words."
  ],
  Wanderer: [
    "Find a shape that repeats three times across distance.",
    "Notice the smallest motion in the largest view.",
    "Look for something that seems out of place in the composition.",
    "Describe this place without naming anything in it.",
    "Find a boundary: natural, built, temporary, or imagined.",
    "What would this trail remember if it could hold a negative?",
    "Collect one sentence from the weather.",
    "Find something that feels like a secret signal in the landscape.",
    "Notice the difference between the path and everything beside it.",
    "What is this place asking you to slow down for?"
  ],
  Sensory: [
    "What is the quietest sound you can hear under the visible scene?",
    "What does the air feel like on your hands, and what tone would that be?",
    "What texture would you enlarge until it became a mountain?",
    "What smell belongs only to this place and this weather?",
    "What is the temperature of the shadow around you?",
    "Close your eyes for ten seconds. What remains after the image is gone?",
    "Find a texture that looks soft but probably is not.",
    "Where does the light feel heavy?",
    "What nearby sound is keeping time?",
    "Describe the trail using only touch words."
  ],
  Drawing: [
    "Draw only the shadows, not the objects.",
    "Make a thirty-second gesture sketch of the nearest plant form as if it were a ridge line.",
    "Draw the negative space between branches, stones, or signs.",
    "Draw the trail as a sequence of light and dark masses.",
    "Make a texture study with five marks repeated many times.",
    "Draw a map fragment that exaggerates one tiny detail into a landmark.",
    "Sketch the same object as a specimen, a symbol, and a mountain.",
    "Draw what the wind would look like if it had contrast.",
    "Make a blind contour drawing of the first object that catches the light.",
    "Draw the edge where two materials meet."
  ],
  Photography: [
    "Photograph evidence of time in stone, bark, water, metal, or cloud.",
    "Find a frame inside the landscape and let the rest fall away.",
    "Shoot through something to deepen the foreground.",
    "Capture a thing that almost disappears into its background.",
    "Make a diptych idea: near texture and far horizon.",
    "Photograph something human-made being reclaimed by weather.",
    "Find a natural interface: edge, seam, joint, hinge, threshold.",
    "Photograph one subject in three tones: shadow, middle, highlight.",
    "Find a composition that feels inevitable rather than clever.",
    "Capture the trail from the viewpoint of a beetle, bird, or lost screw."
  ],
  Writing: [
    "Write one sentence that starts with: The light did not explain itself.",
    "Describe the place as if it were waiting for weather.",
    "Give this trail a secret held in shadow.",
    "Write a field report from a future civilization studying this overlook.",
    "Write a paragraph with no color words.",
    "Write the first line of a story that begins after the storm clears.",
    "What problem is this landscape solving with time?",
    "Write a letter to someone who cannot come here.",
    "Write a myth for the smallest bright object you can see.",
    "Describe the weather as a darkroom chemical."
  ],
  "Found Object": [
    "Find something weathered. Observe it, photograph it, and leave it in place if it belongs there.",
    "Find an object that could be evidence in a very small mystery.",
    "Name the nearest overlooked object as if it belongs in a museum drawer.",
    "Find a natural object with a mechanical personality and a strong silhouette.",
    "Find something broken, worn, polished, or repaired by time.",
    "Make a specimen card for something you will not take with you.",
    "Find a small object with a full tonal range.",
    "Describe an object using only material, condition, and possible story.",
    "Find something that looks like a tool for another species.",
    "Find an object that seems to have traveled farther than you have today."
  ],
  "Strange Machines": [
    "Where does this landscape behave like a camera?",
    "Find an interface between two systems: wet/dry, light/shadow, built/wild, near/far.",
    "What is the input, output, and failure mode of this place?",
    "Identify a hinge, latch, sensor, switch, or circuit in nature.",
    "What would you label if this trail were an engineering drawing?",
    "Find a repeating pattern that could become a mechanism.",
    "What part of this scene looks load-bearing?",
    "Where is energy being stored, released, or wasted?",
    "Invent a field instrument for measuring patience, shadow, distance, or weather.",
    "Make a diagram title for the scene in front of you."
  ],
  "Weather & Light": [
    "What is the weather doing to the edges of things?",
    "Find the place where light changes its mind.",
    "What color is the shadow today, translated into black and white?",
    "Notice one thing the wind is editing.",
    "Find a surface that is keeping a weather record.",
    "What has the rain polished, hidden, or exposed?",
    "Where is the sun making a temporary drawing?",
    "Describe the sky as a material sample.",
    "Find an object that looks different because of the current weather.",
    "What would disappear if the light changed?"
  ],
  "Contact Sheet": [
    "Take three notes from the same place: wide view, middle distance, close detail.",
    "Make five tiny frames with your hands or phone. Which one has the strongest silence?",
    "Find the image that is not the obvious image.",
    "Record one rejected composition and why it failed.",
    "What would you circle with a grease pencil on today’s contact sheet?",
    "Make a note about the frame just before the best frame.",
    "Find a subject that improves when you remove half the scene.",
    "Collect a series idea in three words.",
    "What did you almost photograph but decide to only remember?",
    "Choose one view that deserves a return visit in different weather."
  ]
};

const captureModules = [
  {
    type: "Trail Thought",
    icon: "☁",
    title: "Trail thought",
    description: "A fast sentence, question, idea, memory, or strange association that arrived while moving through light."
  },
  {
    type: "Found Object",
    icon: "◈",
    title: "Found object note",
    description: "Make a museum-style specimen card for an object, texture, fragment, trace, or trail relic. Found, observed, and usually left in place."
  },
  {
    type: "Small Discovery",
    icon: "✶",
    title: "Small tonal discovery",
    description: "Capture a tiny event, behavior, shadow, sound, texture, or detail that changed how you saw the place."
  },
  {
    type: "Sensory Note",
    icon: "≈",
    title: "Sensory prompt",
    description: "Record sound, smell, texture, temperature, light, body feeling, or atmosphere as tonal evidence."
  },
  {
    type: "Drawing Note",
    icon: "✎",
    title: "Drawing prompt",
    description: "A shadow sketch, mark-making exercise, contour study, texture study, or map fragment."
  },
  {
    type: "Photography Note",
    icon: "▧",
    title: "Photography prompt",
    description: "A print idea, composition note, lighting condition, series candidate, or edit-later reminder."
  },
  {
    type: "Writing Note",
    icon: "¶",
    title: "Writing prompt",
    description: "A line, paragraph seed, poem fragment, field report, story opening, or essay note written without hurry."
  },
  {
    type: "Make Later",
    icon: "↝",
    title: "Make something later",
    description: "Turn any exposure into a creative follow-up: draw, write, edit, research, build, or publish."
  }
];

const defaultState = () => ({
  theme: "light",
  sunlightMode: false,
  entries: [],
  sessions: [],
  projects: [],
  artifacts: [],
  customDecks: {},
  currentSessionId: null,
  currentPrompt: null,
  journalLayout: "contact",
  lastBackupAt: null,
  lastSaved: null
});

let state = loadState();
let pendingImageData = "";
let draftTimer = null;
let isPopulatingDialog = false;
let activeDialogIsNew = true;

const els = {};

document.addEventListener("DOMContentLoaded", async () => {
  cacheElements();
  hydrateStaticControls();
  bindEvents();
  applyTheme();
  renderCaptureGrid();
  await loadImagesFromDb();
  renderAll();
  initMobileFieldApp();
  registerServiceWorker();
});

/* Offline support. Registers the app-shell cache when the browser supports it. */
function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(error => {
      console.warn("Trail Muse offline support is unavailable.", error);
    });
  });
}

function cacheElements() {
  Object.assign(els, {
    navList: document.getElementById("navList"),
    bottomNav: document.querySelector(".bottom-nav"),
    saveIndicator: document.getElementById("saveIndicator"),
    themeToggle: document.getElementById("themeToggle"),
    desktopThemeToggle: document.getElementById("desktopThemeToggle"),
    mobileThemeToggle: document.getElementById("mobileThemeToggle"),
    promptDeck: document.getElementById("promptDeck"),
    promptOutput: document.getElementById("promptOutput"),
    promptResponse: document.getElementById("promptResponse"),
    askMuse: document.getElementById("askMuse"),
    savePromptEntry: document.getElementById("savePromptEntry"),
    deckEditorPanel: document.getElementById("deckEditorPanel"),
    deckLibraryCount: document.getElementById("deckLibraryCount"),
    deckLibraryList: document.getElementById("deckLibraryList"),
    cloneSourceDeck: document.getElementById("cloneSourceDeck"),
    newDeck: document.getElementById("newDeck"),
    cloneDeck: document.getElementById("cloneDeck"),
    useDeckInMuse: document.getElementById("useDeckInMuse"),
    exportDecks: document.getElementById("exportDecks"),
    importDecks: document.getElementById("importDecks"),
    deckEditorForm: document.getElementById("deckEditorForm"),
    editingDeckOriginalName: document.getElementById("editingDeckOriginalName"),
    deckName: document.getElementById("deckName"),
    deckMedium: document.getElementById("deckMedium"),
    deckIntensity: document.getElementById("deckIntensity"),
    deckDescription: document.getElementById("deckDescription"),
    deckPrompts: document.getElementById("deckPrompts"),
    deckPromptCount: document.getElementById("deckPromptCount"),
    deleteDeck: document.getElementById("deleteDeck"),
    saveDeck: document.getElementById("saveDeck"),
    quickPanel: document.querySelector(".quick-panel"),
    miniStats: document.getElementById("miniStats"),
    captureGrid: document.getElementById("captureGrid"),
    captureTemplate: document.getElementById("captureTemplate"),
    openFullCapture: document.getElementById("openFullCapture"),
    journalList: document.getElementById("journalList"),
    emptyJournal: document.getElementById("emptyJournal"),
    createJournalProject: document.getElementById("createJournalProject"),
    projectDialog: document.getElementById("projectDialog"),
    projectForm: document.getElementById("projectForm"),
    projectId: document.getElementById("projectId"),
    projectDialogTitle: document.getElementById("projectDialogTitle"),
    projectName: document.getElementById("projectName"),
    projectDescription: document.getElementById("projectDescription"),
    projectFormError: document.getElementById("projectFormError"),
    closeProjectDialog: document.getElementById("closeProjectDialog"),
    cancelProjectDialog: document.getElementById("cancelProjectDialog"),
    saveProject: document.getElementById("saveProject"),
    journalProjectFilter: document.getElementById("journalProjectFilter"),
    journalProjectList: document.getElementById("journalProjectList"),
    studioProjectSelect: document.getElementById("studioProjectSelect"),
    studioProjectSummary: document.getElementById("studioProjectSummary"),
    studioProjectCaptures: document.getElementById("studioProjectCaptures"),
    artifactForm: document.getElementById("artifactForm"),
    artifactId: document.getElementById("artifactId"),
    artifactTitle: document.getElementById("artifactTitle"),
    artifactType: document.getElementById("artifactType"),
    artifactStatus: document.getElementById("artifactStatus"),
    artifactNotes: document.getElementById("artifactNotes"),
    artifactLink: document.getElementById("artifactLink"),
    clearArtifactForm: document.getElementById("clearArtifactForm"),
    artifactList: document.getElementById("artifactList"),
    exportSelectedProject: document.getElementById("exportSelectedProject"),
    exportSelectedProjectHtml: document.getElementById("exportSelectedProjectHtml"),
    exportJsonJournal: document.getElementById("exportJsonJournal"),
    searchBox: document.getElementById("searchBox"),
    typeFilter: document.getElementById("typeFilter"),
    statusFilter: document.getElementById("statusFilter"),
    sessionFilter: document.getElementById("sessionFilter"),
    analyticsSessionFilter: document.getElementById("analyticsSessionFilter"),
    analyticsEmpty: document.getElementById("analyticsEmpty"),
    analyticsContent: document.getElementById("analyticsContent"),
    analyticsSummary: document.getElementById("analyticsSummary"),
    analyticsTypeChart: document.getElementById("analyticsTypeChart"),
    analyticsConditions: document.getElementById("analyticsConditions"),
    analyticsTimeline: document.getElementById("analyticsTimeline"),
    analyticsReadiness: document.getElementById("analyticsReadiness"),
    analyticsHikeTable: document.getElementById("analyticsHikeTable"),
    layoutList: document.getElementById("layoutList"),
    layoutContact: document.getElementById("layoutContact"),
    archiveHealth: document.getElementById("archiveHealth"),
    currentSessionPill: document.getElementById("currentSessionPill"),
    trailSessionStarter: document.getElementById("trailSessionStarter"),
    trailSessionStatus: document.getElementById("trailSessionStatus"),
    trailSessionName: document.getElementById("trailSessionName"),
    trailSessionWeather: document.getElementById("trailSessionWeather"),
    trailSessionTerrain: document.getElementById("trailSessionTerrain"),
    trailSessionLight: document.getElementById("trailSessionLight"),
    trailSessionPace: document.getElementById("trailSessionPace"),
    startTrailSessionQuick: document.getElementById("startTrailSessionQuick"),
    trailQuickNote: document.getElementById("trailQuickNote"),
    saveTrailQuickNote: document.getElementById("saveTrailQuickNote"),
    exportJson: document.getElementById("exportJson"),
    importJson: document.getElementById("importJson"),
    exportHtml: document.getElementById("exportHtml"),
    exportContactSheet: document.getElementById("exportContactSheet"),
    exportZine: document.getElementById("exportZine"),
    exportGallery: document.getElementById("exportGallery"),
    exportHarvest: document.getElementById("exportHarvest"),
    exportMarkdown: document.getElementById("exportMarkdown"),
    exportCsv: document.getElementById("exportCsv"),
    printJournal: document.getElementById("printJournal"),
    clearAllDialog: document.getElementById("clearAllDialog"),
    clearAllForm: document.getElementById("clearAllForm"),
    closeClearAllDialog: document.getElementById("closeClearAllDialog"),
    cancelClearAllDialog: document.getElementById("cancelClearAllDialog"),
    clearAllConfirmation: document.getElementById("clearAllConfirmation"),
    confirmClearAll: document.getElementById("confirmClearAll"),
    dialog: document.getElementById("entryDialog"),
    entryForm: document.getElementById("entryForm"),
    dialogEyebrow: document.getElementById("dialogEyebrow"),
    dialogTitle: document.getElementById("dialogTitle"),
    closeDialog: document.getElementById("closeDialog"),
    entryId: document.getElementById("entryId"),
    entryType: document.getElementById("entryType"),
    entryStatus: document.getElementById("entryStatus"),
    entryTitle: document.getElementById("entryTitle"),
    entryLocation: document.getElementById("entryLocation"),
    entryPrompt: document.getElementById("entryPrompt"),
    entryNote: document.getElementById("entryNote"),
    entryAction: document.getElementById("entryAction"),
    entryPriority: document.getElementById("entryPriority"),
    entryEnergy: document.getElementById("entryEnergy"),
    entryProject: document.getElementById("entryProject"),
    entryDue: document.getElementById("entryDue"),
    entryNextStep: document.getElementById("entryNextStep"),
    entryFinishedNote: document.getElementById("entryFinishedNote"),
    entryMood: document.getElementById("entryMood"),
    entryTags: document.getElementById("entryTags"),
    entryLight: document.getElementById("entryLight"),
    entryWeather: document.getElementById("entryWeather"),
    entryTerrain: document.getElementById("entryTerrain"),
    entryPace: document.getElementById("entryPace"),
    specimenFields: document.getElementById("specimenFields"),
    specimenLeftInPlace: document.getElementById("specimenLeftInPlace"),
    specimenName: document.getElementById("specimenName"),
    specimenMaterial: document.getElementById("specimenMaterial"),
    specimenTexture: document.getElementById("specimenTexture"),
    specimenCondition: document.getElementById("specimenCondition"),
    specimenScale: document.getElementById("specimenScale"),
    specimenPosition: document.getElementById("specimenPosition"),
    specimenStory: document.getElementById("specimenStory"),
    specimenUse: document.getElementById("specimenUse"),
    entryImage: document.getElementById("entryImage"),
    imagePreviewWrap: document.getElementById("imagePreviewWrap"),
    imagePreview: document.getElementById("imagePreview"),
    removeImage: document.getElementById("removeImage"),
    draftRecovery: document.getElementById("draftRecovery"),
    recoverDraft: document.getElementById("recoverDraft"),
    discardDraft: document.getElementById("discardDraft"),
    deleteEntry: document.getElementById("deleteEntry"),
    saveAndNew: document.getElementById("saveAndNew"),
    saveAndWalk: document.getElementById("saveAndWalk"),
    saveEntry: document.getElementById("saveEntry")
  });
}

function hydrateStaticControls() {
  renderPromptDeckOptions();
  renderCloneSourceOptions();

  entryTypes.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    els.entryType.append(option.cloneNode(true));
    els.typeFilter.append(option.cloneNode(true));
    if (els.studioMediumFilter) els.studioMediumFilter.append(option.cloneNode(true));
  });

  if (els.studioStatusFilter) {
    statuses.forEach(status => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      els.studioStatusFilter.append(option);
    });
  }
}

function bindEvents() {
  document.querySelectorAll("[data-view]").forEach(button => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  [els.themeToggle, els.desktopThemeToggle].filter(Boolean).forEach(control => {
    control.addEventListener("click", toggleTheme);
  });


  if (els.openFullCapture) els.openFullCapture.addEventListener("click", () => openEntryDialog({ type: "Trail Thought" }));
  const exposePrompt = () => {
    askMuse();
    els.promptOutput?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  document.querySelectorAll("[data-muse-prompt]").forEach(button => button.addEventListener("click", exposePrompt));
  if (els.startTrailSessionQuick) els.startTrailSessionQuick.addEventListener("click", startSessionFromTrailMode);
  if (els.saveTrailQuickNote) els.saveTrailQuickNote.addEventListener("click", saveTrailQuickNote);
  if (els.trailQuickNote) els.trailQuickNote.addEventListener("keydown", event => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") saveTrailQuickNote();
  });
  if (els.currentSessionPill) els.currentSessionPill.addEventListener("click", event => {
    const target = event.target.closest("[data-start-session]");
    if (target) focusTrailSessionStarter();
  });

  document.querySelectorAll("[data-one-tap]").forEach(button => {
    button.addEventListener("click", () => openEntryDialog(quickCaptureSeed(button.dataset.oneTap)));
  });
  if (els.askMuse) els.askMuse.addEventListener("click", askMuse);
  if (els.savePromptEntry) els.savePromptEntry.addEventListener("click", savePromptResponse);

  bindDeckEditorEvents();

  if (els.quickPanel) els.quickPanel.addEventListener("click", event => {
    const target = event.target.closest("[data-quick]");
    if (!target) return;
    openEntryDialog(quickCaptureSeed(target.dataset.quick));
  });

  [els.searchBox, els.typeFilter, els.statusFilter, els.sessionFilter].filter(Boolean).forEach(control => {
    control.addEventListener("input", renderJournal);
    control.addEventListener("change", renderJournal);
  });

  if (els.layoutList) els.layoutList.addEventListener("click", () => setJournalLayout("list"));
  if (els.layoutContact) els.layoutContact.addEventListener("click", () => setJournalLayout("contact"));

  if (els.entryForm) els.entryForm.addEventListener("submit", event => {
    event.preventDefault();
    saveEntryFromDialog(false);
  });

  if (els.saveAndNew) els.saveAndNew.addEventListener("click", () => saveEntryFromDialog(true));
  if (els.saveAndWalk) els.saveAndWalk.addEventListener("click", () => saveEntryFromDialog(false, "walk"));
  if (els.closeDialog) els.closeDialog.addEventListener("click", closeDialog);
  if (els.entryForm) els.entryForm.addEventListener("input", scheduleDraftSave);
  if (els.entryForm) els.entryForm.addEventListener("change", scheduleDraftSave);
  if (els.entryType) els.entryType.addEventListener("change", () => {
    updateSpecimenFieldsVisibility();
    if (els.entryType.value === "Found Object" && !els.entryAction.value) els.entryAction.value = "Make a specimen card";
  });
  if (els.recoverDraft) els.recoverDraft.addEventListener("click", recoverDraftIntoDialog);
  if (els.discardDraft) els.discardDraft.addEventListener("click", discardDraft);
  if (els.deleteEntry) els.deleteEntry.addEventListener("click", deleteCurrentEntry);
  if (els.entryImage) els.entryImage.addEventListener("change", handleImageSelection);
  if (els.removeImage) els.removeImage.addEventListener("click", () => {
    pendingImageData = "";
    els.entryImage.value = "";
    updateImagePreview();
    scheduleDraftSave();
  });

  if (els.journalList) els.journalList.addEventListener("click", handleEntryAction);
  if (els.archiveHealth) els.archiveHealth.addEventListener("click", handleStudioCommand);

  if (els.exportJson) els.exportJson.addEventListener("click", exportJson);
  if (els.exportJsonJournal) els.exportJsonJournal.addEventListener("click", exportJson);
  if (els.importJson) els.importJson.addEventListener("change", importJson);
  if (els.exportHtml) els.exportHtml.addEventListener("click", exportHtml);
  if (els.exportContactSheet) els.exportContactSheet.addEventListener("click", exportContactSheet);
  if (els.exportZine) els.exportZine.addEventListener("click", exportZineSheet);
  if (els.exportGallery) els.exportGallery.addEventListener("click", exportHtmlGallery);
  if (els.exportHarvest) els.exportHarvest.addEventListener("click", exportCreativeHarvestReport);
  if (els.exportMarkdown) els.exportMarkdown.addEventListener("click", exportMarkdownArchive);
  if (els.exportCsv) els.exportCsv.addEventListener("click", exportCsv);
  if (els.printJournal) els.printJournal.addEventListener("click", () => window.print());
  if (els.clearAllForm) els.clearAllForm.addEventListener("submit", confirmClearAllData);
  if (els.closeClearAllDialog) els.closeClearAllDialog.addEventListener("click", closeClearAllDialog);
  if (els.cancelClearAllDialog) els.cancelClearAllDialog.addEventListener("click", closeClearAllDialog);
  if (els.clearAllConfirmation) els.clearAllConfirmation.addEventListener("input", updateClearAllConfirmation);
  if (els.createJournalProject) els.createJournalProject.addEventListener("click", () => openProjectDialog());
  if (els.projectForm) els.projectForm.addEventListener("submit", saveProjectFromDialog);
  if (els.closeProjectDialog) els.closeProjectDialog.addEventListener("click", closeProjectDialog);
  if (els.cancelProjectDialog) els.cancelProjectDialog.addEventListener("click", closeProjectDialog);
  if (els.journalProjectFilter) els.journalProjectFilter.addEventListener("change", renderJournal);
  if (els.journalList) els.journalList.addEventListener("change", handleJournalProjectAssignment);
  if (els.journalProjectList) els.journalProjectList.addEventListener("click", handleProjectManagerAction);
  if (els.studioProjectSelect) els.studioProjectSelect.addEventListener("change", renderStudio);
  if (els.artifactForm) els.artifactForm.addEventListener("submit", saveArtifactFromStudio);
  if (els.clearArtifactForm) els.clearArtifactForm.addEventListener("click", clearArtifactForm);
  if (els.artifactList) els.artifactList.addEventListener("click", handleArtifactAction);
  if (els.exportSelectedProject) els.exportSelectedProject.addEventListener("click", exportCurrentProjectJson);
  if (els.exportSelectedProjectHtml) els.exportSelectedProjectHtml.addEventListener("click", exportCurrentProjectHtml);
}


function builtInDeckRecord(name) {
  const prompts = promptDecks[name] || [];
  return {
    name,
    source: "built-in",
    medium: inferDeckMedium(name),
    intensity: inferDeckIntensity(name),
    description: builtInDeckDescription(name),
    prompts
  };
}

function inferDeckMedium(name) {
  const lower = String(name || "").toLowerCase();
  if (lower.includes("photo") || lower.includes("contact") || lower.includes("light") || lower.includes("zone")) return "Photography";
  if (lower.includes("draw")) return "Drawing";
  if (lower.includes("writing")) return "Writing";
  if (lower.includes("object") || lower.includes("weather")) return "Naturalist notes";
  if (lower.includes("machine")) return "Design / engineering";
  return "Mixed field practice";
}

function inferDeckIntensity(name) {
  const lower = String(name || "").toLowerCase();
  if (lower.includes("strange") || lower.includes("machine")) return "Strange";
  if (lower.includes("zone") || lower.includes("contact")) return "Technical";
  if (lower.includes("writing") || lower.includes("silver")) return "Poetic";
  return "Observational";
}

function builtInDeckDescription(name) {
  const descriptions = {
    "Silver Light": "Classic monochrome looking: highlight, shadow, scale, weather, and luminous edges.",
    "Tonal Zones": "A zone-system inspired deck for translating the field into shadow, middle tone, and highlight.",
    Wanderer: "General walking prompts for patient outdoor attention.",
    Sensory: "Sound, smell, texture, temperature, atmosphere, and embodied field notes.",
    Drawing: "Sketchbook exercises for shadow, contour, negative space, texture, and map fragments.",
    Photography: "Composition, frame, evidence, time, foreground, and edit-later photographic notes.",
    Writing: "Sentences, fragments, field reports, myths, letters, and prose seeds.",
    "Found Object": "Specimen-card prompts for things noticed, photographed, sketched, and usually left in place.",
    "Strange Machines": "Field-Instrument style systems prompts for interfaces, mechanisms, signals, and failure modes.",
    "Weather & Light": "Prompts for edges, temporary drawings, polished surfaces, and weather records.",
    "Contact Sheet": "A review-minded deck for series, rejected frames, alternate compositions, and return visits."
  };
  return descriptions[name] || "Built-in Trail Muse prompt deck.";
}

function normalizeCustomDecks(source = {}) {
  const output = {};
  if (!source || typeof source !== "object") return output;
  Object.entries(source).forEach(([key, value]) => {
    const raw = Array.isArray(value) ? { prompts: value } : (value && typeof value === "object" ? value : {});
    const name = sanitizeDeckName(raw.name || key);
    if (!name || promptDecks[name]) return;
    const prompts = normalizePromptLines(raw.prompts || raw.promptList || raw.text || "");
    if (prompts.length === 0) return;
    output[name] = {
      name,
      medium: raw.medium || "Mixed field practice",
      intensity: raw.intensity || "Observational",
      description: raw.description || "",
      prompts,
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || raw.createdAt || new Date().toISOString()
    };
  });
  return output;
}

function sanitizeDeckName(value) {
  return String(value || "")
    .replace(/[\n\r\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 54);
}

function normalizePromptLines(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item || "").trim()).filter(Boolean);
  }
  return String(value || "")
    .split(/\n+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function getCustomDecks() {
  state.customDecks = normalizeCustomDecks(state.customDecks);
  return state.customDecks;
}

function getDeckPrompts(name) {
  const custom = getCustomDecks()[name];
  if (custom) return custom.prompts;
  return promptDecks[name] || promptDecks.Wanderer || [];
}

function getDeckRecord(name) {
  const custom = getCustomDecks()[name];
  if (custom) return { ...custom, source: "custom" };
  return builtInDeckRecord(name);
}

function allDeckNames() {
  const customNames = Object.keys(getCustomDecks()).sort((a, b) => a.localeCompare(b));
  return [...Object.keys(promptDecks), ...customNames];
}

function renderPromptDeckOptions() {
  if (!els.promptDeck) return;
  const previous = els.promptDeck.value || state.currentPrompt?.deck || "Silver Light";
  els.promptDeck.innerHTML = "";

  const builtGroup = document.createElement("optgroup");
  builtGroup.label = "Built-in darkroom decks";
  Object.keys(promptDecks).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    builtGroup.append(option);
  });
  els.promptDeck.append(builtGroup);

  const customNames = Object.keys(getCustomDecks()).sort((a, b) => a.localeCompare(b));
  if (customNames.length) {
    const customGroup = document.createElement("optgroup");
    customGroup.label = "Custom decks";
    customNames.forEach(name => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = `✎ ${name}`;
      customGroup.append(option);
    });
    els.promptDeck.append(customGroup);
  }

  els.promptDeck.value = allDeckNames().includes(previous) ? previous : "Silver Light";
}

function renderCloneSourceOptions() {
  if (!els.cloneSourceDeck) return;
  const previous = els.cloneSourceDeck.value || "Silver Light";
  els.cloneSourceDeck.innerHTML = "";
  Object.keys(promptDecks).forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    els.cloneSourceDeck.append(option);
  });
  els.cloneSourceDeck.value = Object.keys(promptDecks).includes(previous) ? previous : "Silver Light";
}

function bindDeckEditorEvents() {
  if (!els.deckEditorPanel) return;
  if (els.deckEditorForm) {
    els.deckEditorForm.addEventListener("submit", event => {
      event.preventDefault();
      saveCustomDeckFromEditor();
    });
  }
  if (els.deckPrompts) els.deckPrompts.addEventListener("input", renderDeckPromptCount);
  if (els.newDeck) els.newDeck.addEventListener("click", clearDeckEditor);
  if (els.cloneDeck) els.cloneDeck.addEventListener("click", cloneSelectedBuiltInDeck);
  if (els.useDeckInMuse) els.useDeckInMuse.addEventListener("click", useEditedDeckInMuse);
  if (els.deleteDeck) els.deleteDeck.addEventListener("click", deleteEditedCustomDeck);
  if (els.exportDecks) els.exportDecks.addEventListener("click", exportCustomDecks);
  if (els.importDecks) els.importDecks.addEventListener("change", importCustomDecks);
  if (els.deckLibraryList) {
    els.deckLibraryList.addEventListener("click", event => {
      const button = event.target.closest("[data-deck-action]");
      if (!button) return;
      const action = button.dataset.deckAction;
      const name = button.dataset.deckName;
      if (action === "edit") loadDeckIntoEditor(name, false);
      if (action === "clone") loadDeckIntoEditor(name, true);
      if (action === "use") {
        els.promptDeck.value = name;
        setView("muse");
        flashSaved(`Muse set to ${name}`);
      }
    });
  }
  clearDeckEditor();
}

function renderDeckEditor() {
  if (!els.deckLibraryList) return;
  renderPromptDeckOptions();
  renderCloneSourceOptions();
  renderDeckLibrary();
  renderDeckPromptCount();
}

function renderDeckLibrary() {
  if (!els.deckLibraryList) return;
  const customDecks = getCustomDecks();
  const builtNames = Object.keys(promptDecks);
  const customNames = Object.keys(customDecks).sort((a, b) => a.localeCompare(b));
  if (els.deckLibraryCount) els.deckLibraryCount.textContent = `${builtNames.length + customNames.length} deck${builtNames.length + customNames.length === 1 ? "" : "s"}`;
  els.deckLibraryList.innerHTML = "";

  const appendDeckCard = (name, source) => {
    const record = getDeckRecord(name);
    const card = document.createElement("article");
    card.className = `deck-card ${source === "custom" ? "custom-deck" : "built-deck"}`;
    card.innerHTML = `
      <div>
        <p class="eyebrow">${source === "custom" ? "Custom deck" : "Built-in deck"}</p>
        <h5>${escapeHtml(name)}</h5>
        <p>${escapeHtml(record.description || "No description yet.")}</p>
        <div class="entry-meta session-chip-line">
          <span>${escapeHtml(record.prompts.length)} prompts</span>
          <span>${escapeHtml(record.medium || "Mixed field practice")}</span>
          <span>${escapeHtml(record.intensity || "Observational")}</span>
        </div>
      </div>
      <div class="deck-card-actions">
        <button class="secondary compact" data-deck-action="use" data-deck-name="${escapeHtml(name)}" type="button">Use</button>
        ${source === "custom" ? `<button class="secondary compact" data-deck-action="edit" data-deck-name="${escapeHtml(name)}" type="button">Edit</button>` : `<button class="secondary compact" data-deck-action="clone" data-deck-name="${escapeHtml(name)}" type="button">Clone</button>`}
      </div>`;
    els.deckLibraryList.append(card);
  };

  builtNames.forEach(name => appendDeckCard(name, "built"));
  customNames.forEach(name => appendDeckCard(name, "custom"));
}

function clearDeckEditor() {
  if (!els.deckName) return;
  els.editingDeckOriginalName.value = "";
  els.deckName.value = "";
  els.deckMedium.value = "Mixed field practice";
  els.deckIntensity.value = "Observational";
  els.deckDescription.value = "";
  els.deckPrompts.value = "";
  if (els.deleteDeck) els.deleteDeck.disabled = true;
  renderDeckPromptCount();
}

function cloneSelectedBuiltInDeck() {
  const name = els.cloneSourceDeck?.value || els.promptDeck?.value || "Silver Light";
  loadDeckIntoEditor(name, true);
}

function loadDeckIntoEditor(name, cloneBuiltIn = false) {
  if (!els.deckName) return;
  const record = getDeckRecord(name);
  const isBuilt = Boolean(promptDecks[name]);
  const nextName = cloneBuiltIn || isBuilt ? uniqueDeckName(`My ${name}`) : name;
  els.editingDeckOriginalName.value = cloneBuiltIn || isBuilt ? "" : name;
  els.deckName.value = nextName;
  els.deckMedium.value = record.medium || "Mixed field practice";
  els.deckIntensity.value = record.intensity || "Observational";
  els.deckDescription.value = record.description || "";
  els.deckPrompts.value = record.prompts.join("\n");
  if (els.deleteDeck) els.deleteDeck.disabled = cloneBuiltIn || isBuilt;
  renderDeckPromptCount();
  if (els.deckEditorPanel) els.deckEditorPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function uniqueDeckName(base) {
  const existing = new Set(allDeckNames());
  if (!existing.has(base)) return base;
  let index = 2;
  while (existing.has(`${base} ${index}`)) index += 1;
  return `${base} ${index}`;
}

function renderDeckPromptCount() {
  if (!els.deckPromptCount || !els.deckPrompts) return;
  const count = normalizePromptLines(els.deckPrompts.value).length;
  els.deckPromptCount.textContent = `${count} prompt${count === 1 ? "" : "s"}`;
}

function saveCustomDeckFromEditor() {
  const name = sanitizeDeckName(els.deckName.value);
  const originalName = sanitizeDeckName(els.editingDeckOriginalName.value);
  const prompts = normalizePromptLines(els.deckPrompts.value);
  if (!name) {
    alert("Give this prompt deck a name before saving.");
    return;
  }
  if (promptDecks[name]) {
    alert("Built-in decks are protected. Use a custom name such as “My " + name + "”.");
    return;
  }
  if (prompts.length === 0) {
    alert("Add at least one prompt before saving this deck.");
    return;
  }

  const customDecks = { ...getCustomDecks() };
  const now = new Date().toISOString();
  const existingDeck = customDecks[originalName] || customDecks[name] || null;
  if (originalName && originalName !== name) delete customDecks[originalName];
  customDecks[name] = {
    name,
    medium: els.deckMedium.value,
    intensity: els.deckIntensity.value,
    description: els.deckDescription.value.trim(),
    prompts,
    createdAt: existingDeck?.createdAt || now,
    updatedAt: now
  };
  state.customDecks = customDecks;
  els.editingDeckOriginalName.value = name;
  if (els.deleteDeck) els.deleteDeck.disabled = false;
  saveState();
  renderDeckEditor();
  if (els.promptDeck) els.promptDeck.value = name;
  flashSaved("Custom prompt deck saved");
}

function deleteEditedCustomDeck() {
  const name = sanitizeDeckName(els.editingDeckOriginalName.value || els.deckName.value);
  if (!name || promptDecks[name] || !getCustomDecks()[name]) {
    alert("Only custom decks can be deleted.");
    return;
  }
  const ok = confirm(`Delete custom prompt deck “${name}”? Journal entries already saved from its prompts will remain.`);
  if (!ok) return;
  const customDecks = { ...getCustomDecks() };
  delete customDecks[name];
  state.customDecks = customDecks;
  if (state.currentPrompt?.deck === name) state.currentPrompt = null;
  saveState();
  clearDeckEditor();
  renderDeckEditor();
  flashSaved("Custom prompt deck deleted");
}

function useEditedDeckInMuse() {
  const name = sanitizeDeckName(els.editingDeckOriginalName.value || els.deckName.value || els.cloneSourceDeck?.value || "Silver Light");
  if (!allDeckNames().includes(name)) {
    alert("Save this custom deck first, or choose an existing deck from the library.");
    return;
  }
  renderPromptDeckOptions();
  els.promptDeck.value = name;
  setView("muse");
  flashSaved(`Muse set to ${name}`);
}

function exportCustomDecks() {
  const customDecks = getCustomDecks();
  const payload = {
    app: "FI-077 Trail Muse",
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    customDecks
  };
  downloadText(`trail-muse-prompt-decks-${dateStamp()}.json`, JSON.stringify(payload, null, 2), "application/json");
}

function importCustomDecks(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const incoming = normalizeCustomDecks(parsed.customDecks || parsed.decks || parsed);
      const names = Object.keys(incoming);
      if (names.length === 0) throw new Error("No custom decks found.");
      const customDecks = { ...getCustomDecks() };
      names.forEach(name => {
        let target = name;
        if (customDecks[target]) target = uniqueDeckName(target);
        customDecks[target] = { ...incoming[name], name: target, updatedAt: new Date().toISOString() };
      });
      state.customDecks = customDecks;
      saveState();
      renderDeckEditor();
      flashSaved(`${names.length} prompt deck${names.length === 1 ? "" : "s"} imported`);
    } catch (error) {
      alert("That JSON file does not look like a Trail Muse prompt deck export.");
      console.error(error);
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const loaded = {
      ...defaultState(),
      ...parsed,
      entries: Array.isArray(parsed.entries) ? parsed.entries.map(normalizeEntryForV13) : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions.map(normalizeSessionForV14) : [],
      projects: normalizeProjects(parsed.projects, parsed.entries),
      artifacts: normalizeArtifacts(parsed.artifacts),
      customDecks: normalizeCustomDecks(parsed.customDecks),
      sunlightMode: false,
      lastBackupAt: parsed.lastBackupAt || null
    };
    if (!["list", "contact"].includes(loaded.journalLayout)) loaded.journalLayout = "contact";
    return loaded;
  } catch (error) {
    console.warn("Trail Muse could not load saved state.", error);
    return defaultState();
  }
}

function normalizeStatus(status) {
  return legacyStatusMap[status] || (statuses.includes(status) ? status : "Raw Capture");
}

function normalizePriority(priority) {
  return priorityLevels.includes(priority) ? priority : "Normal";
}

function normalizeEnergy(energy) {
  return energyLevels.includes(energy) ? energy : "One sitting";
}

function normalizeEntryForV13(entry = {}) {
  return {
    ...entry,
    status: normalizeStatus(entry.status),
    favorite: Boolean(entry.favorite),
    specimenName: entry.specimenName || "",
    specimenMaterial: entry.specimenMaterial || "",
    specimenTexture: entry.specimenTexture || "",
    specimenCondition: entry.specimenCondition || "",
    specimenScale: entry.specimenScale || "",
    specimenPosition: entry.specimenPosition || "",
    specimenStory: entry.specimenStory || "",
    specimenUse: entry.specimenUse || "",
    specimenLeftInPlace: Boolean(entry.specimenLeftInPlace),
    priority: normalizePriority(entry.priority),
    energy: normalizeEnergy(entry.energy),
    project: entry.project || "",
    due: entry.due || "",
    nextStep: entry.nextStep || "",
    finishedNote: entry.finishedNote || "",
    capturedAt: entry.capturedAt || entry.createdAt || new Date().toISOString()
  };
}

function normalizeSessionForV14(session = {}) {
  return {
    ...session,
    id: session.id || `session-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: session.name || "Untitled trail session",
    intent: session.intent || "",
    focus: session.focus || "",
    companions: session.companions || "",
    notes: session.notes || "",
    light: session.light || "",
    weather: session.weather || "",
    terrain: session.terrain || "",
    pace: session.pace || "",
    startedAt: session.startedAt || session.startTimestamp || new Date().toISOString(),
    endedAt: session.endedAt || session.finishTimestamp || null,
    startTimestamp: session.startTimestamp || session.startedAt || new Date().toISOString(),
    finishTimestamp: session.finishTimestamp || session.endedAt || null
  };
}

function saveState() {
  state.lastSaved = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Trail Muse could not save (local storage may be full).", error);
    flashSaved("Storage is full. Export a JSON backup and clear space.");
  }
  renderSaveIndicator();
}

function renderSaveIndicator() {
  if (!els.saveIndicator) return;
  const saved = state.lastSaved ? new Date(state.lastSaved).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Saved";
  els.saveIndicator.textContent = `Saved ${saved}`;
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  saveState();
  applyTheme();
}

function applyTheme() {
  state.sunlightMode = false;
  const isDark = state.theme === "dark";
  document.body.classList.toggle("dark", isDark);
  document.body.classList.remove("sunlight");
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  document.body.dataset.theme = isDark ? "dark" : "light";

  if (els.themeToggle) {
    els.themeToggle.textContent = isDark ? "Light" : "Dark";
    els.themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  }
  if (els.desktopThemeToggle) {
    const label = els.desktopThemeToggle.querySelector("b");
    if (label) label.textContent = isDark ? "Light mode" : "Dark mode";
    els.desktopThemeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    els.desktopThemeToggle.setAttribute("aria-pressed", String(isDark));
  }
  if (els.mobileThemeToggle) {
    els.mobileThemeToggle.textContent = isDark ? "☀" : "◐";
    els.mobileThemeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    els.mobileThemeToggle.setAttribute("aria-pressed", String(isDark));
  }
}

function setView(viewName) {
  if (viewName === "capture" || !document.getElementById(`view-${viewName}`)) viewName = "muse";
  document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
  const next = document.getElementById(`view-${viewName}`);
  if (next) next.classList.add("active");

  document.querySelectorAll("[data-view]").forEach(button => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  if (viewName === "journal") renderJournal();
  if (viewName === "analytics") renderAnalytics();
  if (viewName === "studio") renderStudio();
}

function askMuse() {
  const deckName = els.promptDeck.value || "Wanderer";
  const deck = getDeckPrompts(deckName);
  const prompt = deck[Math.floor(Math.random() * deck.length)] || "Look again. What did the field reveal?";
  state.currentPrompt = { deck: deckName, text: prompt, createdAt: new Date().toISOString() };
  saveState();
  renderPrompt();
  els.promptResponse.focus();
}

function renderPrompt() {
  const current = state.currentPrompt;
  if (!current) return;
  els.promptOutput.innerHTML = "";

  const kind = document.createElement("p");
  kind.className = "prompt-kind";
  kind.textContent = current.deck;

  const prompt = document.createElement("h3");
  prompt.textContent = current.text;

  const note = document.createElement("p");
  note.className = "prompt-note";
  note.textContent = "Expose it quickly, or save the negative and keep walking.";

  els.promptOutput.append(kind, prompt, note);
}

function savePromptResponse() {
  const prompt = state.currentPrompt;
  const response = els.promptResponse.value.trim();
  if (!prompt && !response) {
    askMuse();
    return;
  }

  const title = prompt ? titleFromPrompt(prompt.text) : "Prompt response";
  const entry = makeEntry({
    type: "Prompt Response",
    title,
    prompt: prompt?.text || "Self-directed field prompt",
    note: response,
    tags: prompt ? prompt.deck : "prompt",
    status: response ? "Raw Capture" : "Worth Returning To"
  });
  state.entries.unshift(entry);
  els.promptResponse.value = "";
  saveState();
  renderAll();
  flashSaved("Prompt response saved");
}

function titleFromPrompt(promptText) {
  return promptText.replace(/[?.!]+$/, "").split(" ").slice(0, 7).join(" ");
}

function makeEntry(overrides = {}) {
  const now = new Date().toISOString();
  const session = getCurrentSession();
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : `tm-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "Trail Thought",
    title: "Untitled exposure",
    prompt: "",
    note: "",
    location: session?.name || "",
    mood: session?.intent || "",
    light: session?.light || "",
    weather: session?.weather || "",
    terrain: session?.terrain || "",
    pace: session?.pace || "",
    tags: "",
    action: "",
    priority: "Normal",
    energy: "One sitting",
    project: "",
    due: "",
    nextStep: "",
    finishedNote: "",
    status: "Raw Capture",
    favorite: false,
    image: "",
    imageId: "",
    specimenName: "",
    specimenMaterial: "",
    specimenTexture: "",
    specimenCondition: "",
    specimenScale: "",
    specimenPosition: "",
    specimenStory: "",
    specimenUse: "",
    specimenLeftInPlace: false,
    sessionId: state.currentSessionId,
    capturedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function quickCaptureSeed(type) {
  const session = getCurrentSession();
  const defaults = quickCaptureDefaults[type] || {};
  return {
    type,
    title: suggestedTitle(type),
    prompt: defaults.prompt || "",
    action: defaults.action || "",
    priority: normalizePriority(defaults.priority),
    energy: normalizeEnergy(defaults.energy),
    project: defaults.project || "",
    due: defaults.due || "",
    nextStep: defaults.nextStep || "",
    finishedNote: defaults.finishedNote || "",
    tags: defaults.tags || "",
    location: session?.name || "",
    mood: session?.intent || "",
    light: session?.light || "",
    weather: session?.weather || "",
    terrain: session?.terrain || "",
    pace: session?.pace || "",
    specimenName: defaults.specimenName || "",
    specimenMaterial: defaults.specimenMaterial || "",
    specimenTexture: defaults.specimenTexture || "",
    specimenCondition: defaults.specimenCondition || "",
    specimenScale: defaults.specimenScale || "",
    specimenPosition: defaults.specimenPosition || "",
    specimenStory: defaults.specimenStory || "",
    specimenUse: defaults.specimenUse || "",
    specimenLeftInPlace: Boolean(defaults.specimenLeftInPlace)
  };
}

function renderCaptureGrid() {
  els.captureGrid.innerHTML = "";
  captureModules.forEach(module => {
    const fragment = els.captureTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".capture-card");
    fragment.querySelector(".capture-icon").textContent = module.icon;
    fragment.querySelector("h3").textContent = module.title;
    fragment.querySelector("p").textContent = module.description;
    fragment.querySelector("button").addEventListener("click", () => openEntryDialog(quickCaptureSeed(module.type)));
    card.dataset.type = module.type;
    els.captureGrid.append(fragment);
  });
}

function openEntryDialog(seed = {}) {
  isPopulatingDialog = true;
  activeDialogIsNew = !seed.id;
  pendingImageData = seed.image || imageSrcFor(seed) || "";
  els.entryForm.reset();
  const session = getCurrentSession();
  els.entryId.value = seed.id || "";
  els.entryType.value = seed.type || "Trail Thought";
  els.entryStatus.value = normalizeStatus(seed.status || "Raw Capture");
  const suggestedEntryTitle = seed.title || suggestedTitle(seed.type || "Trail Thought");
  const suggestedEntryPrompt = seed.prompt || "Prompt, observation, or question";
  els.entryTitle.value = seed.id ? suggestedEntryTitle : "";
  els.entryTitle.placeholder = suggestedEntryTitle;
  els.entryLocation.value = seed.location || session?.name || "";
  els.entryPrompt.value = seed.id ? (seed.prompt || "") : "";
  els.entryPrompt.placeholder = suggestedEntryPrompt;
  els.entryNote.value = seed.note || "";
  els.entryAction.value = seed.action || "";
  if (els.entryPriority) els.entryPriority.value = normalizePriority(seed.priority);
  if (els.entryEnergy) els.entryEnergy.value = normalizeEnergy(seed.energy);
  if (els.entryProject) els.entryProject.value = seed.project || "";
  if (els.entryDue) els.entryDue.value = seed.due || "";
  if (els.entryNextStep) els.entryNextStep.value = seed.nextStep || "";
  if (els.entryFinishedNote) els.entryFinishedNote.value = seed.finishedNote || "";
  els.entryMood.value = seed.mood || session?.intent || "";
  els.entryTags.value = seed.tags || "";
  els.entryLight.value = seed.light || session?.light || "";
  els.entryWeather.value = seed.weather || session?.weather || "";
  els.entryTerrain.value = seed.terrain || session?.terrain || "";
  els.entryPace.value = seed.pace || session?.pace || "";
  els.specimenName.value = seed.specimenName || "";
  els.specimenMaterial.value = seed.specimenMaterial || "";
  els.specimenTexture.value = seed.specimenTexture || "";
  els.specimenCondition.value = seed.specimenCondition || "";
  els.specimenScale.value = seed.specimenScale || "";
  els.specimenPosition.value = seed.specimenPosition || "";
  els.specimenStory.value = seed.specimenStory || "";
  els.specimenUse.value = seed.specimenUse || "";
  els.specimenLeftInPlace.checked = Boolean(seed.specimenLeftInPlace);
  updateSpecimenFieldsVisibility();
  els.dialogEyebrow.textContent = seed.id ? "Edit field note" : "New field note";
  els.dialogTitle.textContent = seed.id ? "Revise exposure" : `Capture ${seed.type || "exposure"}`;
  els.deleteEntry.hidden = !seed.id;
  updateImagePreview();
  renderDraftRecovery();

  if (typeof els.dialog.showModal === "function") {
    els.dialog.showModal();
  } else {
    els.dialog.setAttribute("open", "");
  }

  window.setTimeout(() => {
    isPopulatingDialog = false;
  }, 0);
}

function suggestedTitle(type) {
  const names = {
    "Trail Thought": "Trail thought",
    "Found Object": "Object with a story",
    "Small Discovery": "Small discovery",
    "Sensory Note": "Sensory note",
    "Drawing Note": "Sketch seed",
    "Photography Note": "Photo idea",
    "Writing Note": "Writing seed",
    "Make Later": "Develop this later",
    "Prompt Response": "Prompt response"
  };
  return names[type] || "Untitled exposure";
}

function closeDialog() {
  if (typeof els.dialog.close === "function") els.dialog.close();
  else els.dialog.removeAttribute("open");
}

async function saveEntryFromDialog(keepOpen, mode = "standard") {
  const id = els.entryId.value;
  const now = new Date().toISOString();
  const existing = id ? state.entries.find(entry => entry.id === id) : null;
  const imageResult = await persistImage(pendingImageData, existing?.imageId || "");
  const values = {
    type: els.entryType.value,
    status: els.entryStatus.value,
    title: els.entryTitle.value.trim() || suggestedTitle(els.entryType.value),
    location: els.entryLocation.value.trim(),
    prompt: els.entryPrompt.value.trim(),
    note: els.entryNote.value.trim(),
    action: els.entryAction.value,
    priority: normalizePriority(els.entryPriority?.value),
    energy: normalizeEnergy(els.entryEnergy?.value),
    project: (els.entryProject?.value || "").trim(),
    due: els.entryDue?.value || "",
    nextStep: (els.entryNextStep?.value || "").trim(),
    finishedNote: (els.entryFinishedNote?.value || "").trim(),
    mood: els.entryMood.value.trim(),
    light: els.entryLight.value,
    weather: els.entryWeather.value,
    terrain: els.entryTerrain.value,
    pace: els.entryPace.value,
    tags: normalizeTags(els.entryTags.value),
    image: imageResult.image,
    imageId: imageResult.imageId,
    specimenName: els.specimenName.value.trim(),
    specimenMaterial: els.specimenMaterial.value.trim(),
    specimenTexture: els.specimenTexture.value.trim(),
    specimenCondition: els.specimenCondition.value.trim(),
    specimenScale: els.specimenScale.value.trim(),
    specimenPosition: els.specimenPosition.value.trim(),
    specimenStory: els.specimenStory.value.trim(),
    specimenUse: els.specimenUse.value.trim(),
    specimenLeftInPlace: Boolean(els.specimenLeftInPlace.checked),
    updatedAt: now
  };

  if (id) {
    const index = state.entries.findIndex(entry => entry.id === id);
    if (index !== -1) state.entries[index] = { ...state.entries[index], ...values };
  } else {
    const entry = makeEntry(values);
    state.entries.unshift(entry);
  }

  clearDraft();
  saveState();
  renderAll();
  flashSaved(mode === "walk" ? "Saved. Keep walking." : "Field note saved");

  if (keepOpen) {
    const nextType = els.entryType.value;
    openEntryDialog({
      type: nextType,
      location: values.location,
      mood: values.mood,
      light: values.light,
      weather: values.weather,
      terrain: values.terrain,
      pace: values.pace,
      priority: values.priority,
      energy: values.energy,
      project: values.project,
      due: values.due,
      nextStep: values.nextStep,
      specimenLeftInPlace: els.entryType.value === "Found Object"
    });
  } else {
    closeDialog();
    if (mode === "walk") setView("muse");
  }
}

function scheduleDraftSave() {
  if (isPopulatingDialog || !activeDialogIsNew || !els.dialog.open) return;
  window.clearTimeout(draftTimer);
  draftTimer = window.setTimeout(saveDraftFromDialog, 180);
}

function saveDraftFromDialog() {
  if (isPopulatingDialog || !activeDialogIsNew) return;
  const values = getDialogValues();
  const hasText = [values.title, values.location, values.prompt, values.note, values.mood, values.tags, values.light, values.weather, values.terrain, values.pace, values.action, values.priority, values.energy, values.project, values.due, values.nextStep, values.finishedNote, values.specimenName, values.specimenMaterial, values.specimenTexture, values.specimenCondition, values.specimenScale, values.specimenPosition, values.specimenStory, values.specimenUse]
    .some(value => String(value || "").trim());
  if (!hasText && !pendingImageData) return;
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...values, image: pendingImageData, savedAt: new Date().toISOString() }));
  renderDraftRecovery();
}

function getDialogValues() {
  return {
    type: els.entryType.value,
    status: els.entryStatus.value,
    title: els.entryTitle.value,
    location: els.entryLocation.value,
    prompt: els.entryPrompt.value,
    note: els.entryNote.value,
    action: els.entryAction.value,
    priority: els.entryPriority?.value || "Normal",
    energy: els.entryEnergy?.value || "One sitting",
    project: els.entryProject?.value || "",
    due: els.entryDue?.value || "",
    nextStep: els.entryNextStep?.value || "",
    finishedNote: els.entryFinishedNote?.value || "",
    mood: els.entryMood.value,
    light: els.entryLight.value,
    weather: els.entryWeather.value,
    terrain: els.entryTerrain.value,
    pace: els.entryPace.value,
    tags: els.entryTags.value,
    specimenName: els.specimenName.value,
    specimenMaterial: els.specimenMaterial.value,
    specimenTexture: els.specimenTexture.value,
    specimenCondition: els.specimenCondition.value,
    specimenScale: els.specimenScale.value,
    specimenPosition: els.specimenPosition.value,
    specimenStory: els.specimenStory.value,
    specimenUse: els.specimenUse.value,
    specimenLeftInPlace: Boolean(els.specimenLeftInPlace.checked)
  };
}

function getSavedDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Trail Muse could not read the unsaved draft.", error);
    return null;
  }
}

function renderDraftRecovery() {
  if (!els.draftRecovery) return;
  const draft = getSavedDraft();
  const show = activeDialogIsNew && Boolean(draft) && !isCurrentDialogSameAsDraft(draft);
  els.draftRecovery.hidden = !show;
}

function isCurrentDialogSameAsDraft(draft) {
  if (!draft) return false;
  const values = getDialogValues();
  return ["type", "status", "title", "location", "prompt", "note", "action", "priority", "energy", "project", "due", "nextStep", "finishedNote", "mood", "light", "weather", "terrain", "pace", "tags", "specimenName", "specimenMaterial", "specimenTexture", "specimenCondition", "specimenScale", "specimenPosition", "specimenStory", "specimenUse"]
    .every(key => String(values[key] || "") === String(draft[key] || ""));
}

function recoverDraftIntoDialog() {
  const draft = getSavedDraft();
  if (!draft) return;
  isPopulatingDialog = true;
  pendingImageData = draft.image || "";
  els.entryType.value = draft.type || "Trail Thought";
  els.entryStatus.value = normalizeStatus(draft.status || "Raw Capture");
  els.entryTitle.value = draft.title || suggestedTitle(draft.type || "Trail Thought");
  els.entryLocation.value = draft.location || "";
  els.entryPrompt.value = draft.prompt || "";
  els.entryNote.value = draft.note || "";
  els.entryAction.value = draft.action || "";
  if (els.entryPriority) els.entryPriority.value = normalizePriority(draft.priority);
  if (els.entryEnergy) els.entryEnergy.value = normalizeEnergy(draft.energy);
  if (els.entryProject) els.entryProject.value = draft.project || "";
  if (els.entryDue) els.entryDue.value = draft.due || "";
  if (els.entryNextStep) els.entryNextStep.value = draft.nextStep || "";
  if (els.entryFinishedNote) els.entryFinishedNote.value = draft.finishedNote || "";
  els.entryMood.value = draft.mood || "";
  els.entryLight.value = draft.light || "";
  els.entryWeather.value = draft.weather || "";
  els.entryTerrain.value = draft.terrain || "";
  els.entryPace.value = draft.pace || "";
  els.entryTags.value = draft.tags || "";
  els.specimenName.value = draft.specimenName || "";
  els.specimenMaterial.value = draft.specimenMaterial || "";
  els.specimenTexture.value = draft.specimenTexture || "";
  els.specimenCondition.value = draft.specimenCondition || "";
  els.specimenScale.value = draft.specimenScale || "";
  els.specimenPosition.value = draft.specimenPosition || "";
  els.specimenStory.value = draft.specimenStory || "";
  els.specimenUse.value = draft.specimenUse || "";
  els.specimenLeftInPlace.checked = Boolean(draft.specimenLeftInPlace);
  updateSpecimenFieldsVisibility();
  updateImagePreview();
  els.draftRecovery.hidden = true;
  window.setTimeout(() => {
    isPopulatingDialog = false;
  }, 0);
}

function discardDraft() {
  clearDraft();
  renderDraftRecovery();
  flashSaved("Unsaved draft discarded");
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
}

function deleteCurrentEntry() {
  const id = els.entryId.value;
  if (!id) return;
  const ok = confirm("Delete this field note? This cannot be undone.");
  if (!ok) return;
  forgetEntryImage(state.entries.find(entry => entry.id === id));
  state.entries = state.entries.filter(entry => entry.id !== id);
  saveState();
  renderAll();
  closeDialog();
}

async function handleImageSelection(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    pendingImageData = await resizeImageToDataUrl(file, 1100, 0.82);
    updateImagePreview();
    scheduleDraftSave();
  } catch (error) {
    alert("Trail Muse could not read that image.");
    console.error(error);
  }
}

function resizeImageToDataUrl(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function updateImagePreview() {
  const hasImage = Boolean(pendingImageData);
  els.imagePreviewWrap.hidden = !hasImage;
  if (hasImage) els.imagePreview.src = pendingImageData;
  else els.imagePreview.removeAttribute("src");
}

function updateSpecimenFieldsVisibility() {
  if (!els.specimenFields || !els.entryType) return;
  const isObject = els.entryType.value === "Found Object";
  els.specimenFields.hidden = !isObject;
  if (isObject && !els.specimenUse.value) els.specimenUse.value = "specimen card / zine page";
  if (isObject && !els.specimenLeftInPlace.checked) els.specimenLeftInPlace.checked = true;
}

function normalizeTags(value) {
  return value
    .split(",")
    .map(tag => tag.trim())
    .filter(Boolean)
    .join(", ");
}

function statCard(value, label) {
  const card = document.createElement("div");
  card.className = "stat-card";
  const strong = document.createElement("strong");
  strong.textContent = value;
  const span = document.createElement("span");
  span.textContent = label;
  card.append(strong, span);
  return card;
}

function setJournalLayout(layout) {
  state.journalLayout = layout === "list" ? "list" : "contact";
  saveState();
  renderJournal();
}

function renderJournalLayoutControls() {
  const isContact = state.journalLayout !== "list";
  if (els.layoutList) els.layoutList.classList.toggle("active", !isContact);
  if (els.layoutContact) els.layoutContact.classList.toggle("active", isContact);
}

function renderJournalSessionFilter() {
  if (!els.sessionFilter) return;
  const previous = els.sessionFilter.value || "all";
  els.sessionFilter.innerHTML = '<option value="all">All sessions / rolls</option><option value="none">No session</option>';
  state.sessions.forEach(session => {
    const option = document.createElement("option");
    option.value = session.id;
    option.textContent = `${session.name || "Untitled roll"}${session.endedAt ? "" : " · active"}`;
    els.sessionFilter.append(option);
  });
  els.sessionFilter.value = Array.from(els.sessionFilter.options).some(option => option.value === previous) ? previous : "all";
}

function sessionNameForEntry(entry) {
  if (!entry.sessionId) return "";
  return state.sessions.find(session => session.id === entry.sessionId)?.name || "Unknown exposure roll";
}

function getSessionEntries(sessionId) {
  return state.entries.filter(entry => entry.sessionId === sessionId);
}

function sessionStats(session) {
  const entries = getSessionEntries(session.id);
  const queue = entries.filter(entry => entry.action && entry.status !== "Archived");
  const finished = entries.filter(entry => entry.status === "Finished");
  const favorites = entries.filter(entry => entry.favorite);
  const images = entries.filter(entryHasImage);
  const best = entries.slice().sort((a, b) => reviewScore(b) - reviewScore(a))[0] || null;
  return { entries, queue, finished, favorites, images, best };
}

function sessionDuration(session) {
  if (!session?.startedAt) return "not timed";
  const start = new Date(session.startedAt).getTime();
  const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "not timed";
  const minutes = Math.max(1, Math.round((end - start) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function getFilteredEntries() {
  const query = els.searchBox.value.trim().toLowerCase();
  const type = els.typeFilter.value;
  const status = els.statusFilter.value;
  const session = els.sessionFilter?.value || "all";

  return state.entries
    .filter(entry => type === "all" || entry.type === type)
    .filter(entry => status === "all" || entry.status === status)
    .filter(entry => session === "all" || (session === "none" ? !entry.sessionId : entry.sessionId === session))
    .filter(entry => {
      if (!query) return true;
      const haystack = [entry.title, entry.type, entry.status, entry.prompt, entry.note, entry.location, entry.mood, entry.light, entry.weather, entry.terrain, entry.pace, entry.tags, entry.action]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

function pill(text, className) {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

function textSpan(text) {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

function actionButton(label, action, id) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = id;
  return button;
}

function splitTags(tags = "") {
  return tags.split(",").map(tag => tag.trim()).filter(Boolean);
}

function isSpecimenEntry(entry = {}) {
  return entry.type === "Found Object" || Boolean(entry.specimenName || entry.specimenMaterial || entry.specimenTexture || entry.specimenCondition || entry.specimenScale || entry.specimenPosition || entry.specimenStory || entry.specimenUse || entry.specimenLeftInPlace);
}

function specimenDetailPairs(entry = {}) {
  return [
    ["Material", entry.specimenMaterial],
    ["Texture", entry.specimenTexture],
    ["Condition", entry.specimenCondition],
    ["Scale", entry.specimenScale],
    ["Found position", entry.specimenPosition],
    ["Possible story", entry.specimenStory],
    ["Later use", entry.specimenUse]
  ].filter(([, value]) => String(value || "").trim());
}

function handleEntryAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const entry = state.entries.find(item => item.id === button.dataset.id);
  if (!entry) return;

  const action = button.dataset.action;
  if (action === "edit") openEntryDialog(entry);
  if (action === "favorite") toggleFavorite(entry.id);
  if (action === "make-later") sendToLater(entry.id);
  if (action === "archive") toggleArchive(entry.id);
  if (action === "delete") deleteEntry(entry.id);
  if (action === "reject") rejectEntry(entry.id);
  if (action === "develop") developEntry(entry.id);
  if (action === "finish") updateStatus(entry.id, "Finished");
  if (action === "finish-work") finishWork(entry.id);
  if (action === "suggest-step") applySuggestedStep(entry.id);
  if (action === "project") convertToProject(entry.id);
  if (action === "status") updateStatus(entry.id, button.dataset.status);
  if (action === "specimen") {
    setView("studio");
    if (els.specimenGallery) els.specimenGallery.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function applySuggestedStep(id) {
  mutateEntry(id, entry => ({
    ...entry,
    action: entry.action || defaultActionForType(entry.type),
    nextStep: nextStepForEntry(entry),
    status: entry.status === "Raw Capture" ? "Worth Returning To" : entry.status
  }));
  flashSaved("Suggested next action added");
}

function convertToProject(id) {
  const entry = state.entries.find(item => item.id === id);
  if (!entry) return;
  const defaultName = entry.project || projectNameFromEntry(entry);
  const project = prompt("Name the creative project or collection for this exposure:", defaultName);
  if (project === null) return;
  mutateEntry(id, item => ({
    ...item,
    action: item.action || defaultActionForType(item.type),
    project: project.trim() || defaultName,
    priority: item.priority || "High",
    nextStep: item.nextStep || nextStepForEntry(item),
    status: item.status === "Raw Capture" ? "Develop Further" : item.status
  }));
  flashSaved("Exposure grouped into a creative project");
}

function finishWork(id) {
  const entry = state.entries.find(item => item.id === id);
  if (!entry) return;
  const note = prompt("What did this become? Add a title, link, print note, or short finished-work note:", entry.finishedNote || "");
  if (note === null) return;
  mutateEntry(id, item => ({
    ...item,
    status: "Finished",
    finishedNote: note.trim() || item.finishedNote || "Finished work noted",
    action: item.action || defaultActionForType(item.type)
  }));
  flashSaved("Finished work noted");
}

function projectNameFromEntry(entry = {}) {
  const roll = sessionNameForEntry(entry);
  if (roll) return `${roll} study`;
  const tags = splitTags(entry.tags);
  if (tags.length) return `${tags[0]} study`;
  return `${entry.type || "Field"} project`;
}

function toggleFavorite(id) {
  mutateEntry(id, entry => ({ ...entry, favorite: !entry.favorite }));
}

function sendToLater(id) {
  mutateEntry(id, entry => ({
    ...entry,
    action: entry.action || defaultActionForType(entry.type),
    priority: entry.priority || "Normal",
    energy: entry.energy || defaultEnergyForType(entry.type),
    nextStep: entry.nextStep || nextStepForEntry(entry),
    status: entry.status === "Archived" || entry.status === "Finished" ? "Worth Returning To" : "Develop Further"
  }));
  setView("later");
}

function rejectEntry(id) {
  mutateEntry(id, entry => ({ ...entry, status: "Archived" }));
}

function developEntry(id) {
  mutateEntry(id, entry => ({
    ...entry,
    action: entry.action || defaultActionForType(entry.type),
    priority: entry.priority || "Normal",
    energy: entry.energy || defaultEnergyForType(entry.type),
    nextStep: entry.nextStep || nextStepForEntry(entry),
    status: "Develop Further"
  }));
}

function defaultActionForType(type) {
  const map = {
    "Drawing Note": "Draw this",
    "Photography Note": "Edit photo",
    "Writing Note": "Write this",
    "Found Object": "Make a specimen card",
    "Small Discovery": "Research this",
    "Trail Thought": "Write this",
    "Sensory Note": "Combine with another exposure",
    "Prompt Response": "Turn into project",
    "Make Later": "Turn into project"
  };
  return map[type] || "Turn into project";
}

function defaultEnergyForType(type) {
  const map = {
    "Trail Thought": "Tiny edit",
    "Writing Note": "Tiny edit",
    "Photography Note": "One sitting",
    "Drawing Note": "One sitting",
    "Found Object": "One sitting",
    "Small Discovery": "Research trail",
    "Sensory Note": "One sitting",
    "Prompt Response": "One sitting",
    "Make Later": "Deep work"
  };
  return map[type] || "One sitting";
}

function toggleArchive(id) {
  mutateEntry(id, entry => ({ ...entry, status: entry.status === "Archived" ? "Worth Returning To" : "Archived" }));
}

function deleteEntry(id) {
  const ok = confirm("Delete this field note? This cannot be undone.");
  if (!ok) return;
  forgetEntryImage(state.entries.find(entry => entry.id === id));
  state.entries = state.entries.filter(entry => entry.id !== id);
  saveState();
  renderAll();
}

function updateStatus(id, status) {
  mutateEntry(id, entry => ({ ...entry, status }));
}

function mutateEntry(id, updater) {
  state.entries = state.entries.map(entry => {
    if (entry.id !== id) return entry;
    return { ...updater(entry), updatedAt: new Date().toISOString() };
  });
  saveState();
  renderAll();
}

function nextStepForEntry(entry = {}) {
  if (entry.nextStep) return entry.nextStep;
  const action = entry.action || defaultActionForType(entry.type);
  const map = {
    "Draw this": "Make a fifteen-minute study before trying to make it beautiful.",
    "Write this": "Write 300 plain words while the field memory is still warm.",
    "Edit photo": "Make one monochrome edit and note what tonal detail matters most.",
    "Research this": "Look up one reliable reference and add one sentence of context.",
    "Turn into project": "Name the project and define the smallest next deliverable.",
    "Use in newsletter": "Draft the caption and decide whether it belongs in a larger dispatch.",
    "Make a specimen card": "Complete the material, texture, condition, scale, and story fields.",
    "Make a zine page": "Pair this exposure with one image, one note, and one blank margin.",
    "Combine with another exposure": "Find one related spark and make a two-card study."
  };
  return map[action] || "Define the smallest studio action this exposure needs next.";
}

function followupScore(entry = {}) {
  let score = reviewScore(entry);
  const priority = { Low: 0, Normal: 2, High: 5, Critical: 8 }[entry.priority] ?? 2;
  const energy = { "Tiny edit": 4, "One sitting": 3, "Deep work": 1, "Research trail": 2 }[entry.energy] ?? 3;
  score += priority + energy;
  if (entry.due) {
    const days = Math.ceil((new Date(entry.due + "T23:59:59") - new Date()) / 86400000);
    if (days < 0) score += 6;
    else if (days <= 3) score += 5;
    else if (days <= 14) score += 2;
  }
  if (entry.project) score += 2;
  if (entry.nextStep) score += 2;
  if (entry.status === "Finished") score -= 20;
  return score;
}

function dueLabel(due) {
  if (!due) return "";
  const date = new Date(due + "T12:00:00");
  if (Number.isNaN(date.getTime())) return "";
  const days = Math.ceil((date - new Date()) / 86400000);
  const dateText = date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  if (days < 0) return `overdue · ${dateText}`;
  if (days === 0) return `due today · ${dateText}`;
  if (days === 1) return `due tomorrow · ${dateText}`;
  return `due ${dateText}`;
}

function groupByProject(entries) {
  const map = new Map();
  entries.forEach(entry => {
    const name = entry.project || entry.action || "Ungrouped follow-ups";
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(entry);
  });
  return Array.from(map.entries())
    .map(([name, items]) => ({ name, items: items.sort((a, b) => followupScore(b) - followupScore(a)) }))
    .sort((a, b) => b.items.reduce((sum, entry) => sum + followupScore(entry), 0) - a.items.reduce((sum, entry) => sum + followupScore(entry), 0));
}

function renderArchiveHealth() {
  if (!els.archiveHealth) return;
  const entries = state.entries || [];
  const projects = state.projects || [];
  const artifacts = state.artifacts || [];
  const draft = safeReadDraft();
  const unassigned = entries.filter(entry => !entry.project).length;
  const untitled = entries.filter(entry => !String(entry.title || "").trim()).length;
  const missingContext = entries.filter(entry => !entry.sessionId || !(entry.weather || entry.terrain || entry.light)).length;
  const projectsWithoutArtifacts = projects.filter(project => !artifacts.some(artifact => artifact.projectId === project.id)).length;
  const backupAge = state.lastBackupAt ? formatRelativeAge(state.lastBackupAt) : "Never";
  const lastSaved = state.lastSaved ? formatRelativeAge(state.lastSaved) : "Not saved";
  const healthItems = [
    ["Last local save", lastSaved],
    ["Last JSON backup", backupAge],
    ["Unassigned captures", unassigned],
    ["Untitled captures", untitled],
    ["Missing hike metadata", missingContext],
    ["Projects without artifacts", projectsWithoutArtifacts],
    ["Recoverable draft", draft ? "Yes" : "No"]
  ];
  els.archiveHealth.innerHTML = `
    <div class="health-list">${healthItems.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div>
    <div class="archive-actions">
      <button class="primary compact" data-studio-command="backup" type="button">Export JSON backup</button>
      <button class="secondary compact" data-studio-command="journal" type="button">Review metadata in Journal</button>
      <button class="danger compact" data-studio-command="clear-all" type="button">Clear all stored data</button>
    </div>`;
}
function safeReadDraft() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function formatRelativeAge(value) {
  if (!value) return "Never";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "Unknown";
  const minutes = Math.max(0, Math.round((Date.now() - time) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function handleStudioCommand(event) {
  const button = event.target.closest("[data-studio-command]");
  if (!button) return;
  const command = button.dataset.studioCommand;
  if (command === "capture" || command === "muse") return setView("muse");
  if (command === "journal") return setView("journal");
  if (command === "later") return setView("later");
  if (command === "backup") return exportJson();
  if (command === "clear-all") return openClearAllDialog();
  if (command === "review") return scrollStudioPanel(".darkroom-review-panel");
  if (command === "export") return scrollStudioPanel(".export-studio-panel");
  if (command === "session") return scrollStudioPanel(".session-console-panel");
}

function scrollStudioPanel(selector) {
  setView("studio");
  const target = document.querySelector(selector);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function reviewScore(entry) {
  let score = 0;
  if (entry.favorite) score += 8;
  if (entry.status === "Develop Further") score += 6;
  if (entry.status === "In Progress") score += 5;
  if (entry.status === "Finished") score += 4;
  if (entry.status === "Worth Returning To") score += 3;
  if (entryHasImage(entry)) score += 3;
  if (entry.action) score += 3;
  if ((entry.note || "").length > 120) score += 2;
  if (entry.prompt) score += 1;
  score += Math.min(3, splitTags(entry.tags).length);
  if ([entry.light, entry.weather, entry.terrain, entry.pace].some(Boolean)) score += 1;
  if (isSpecimenEntry(entry)) score += 2;
  if ([entry.specimenMaterial, entry.specimenTexture, entry.specimenCondition, entry.specimenPosition].some(Boolean)) score += 2;
  if (["High", "Critical"].includes(entry.priority)) score += entry.priority === "Critical" ? 4 : 2;
  if (entry.energy === "Tiny edit") score += 1;
  if (entry.project) score += 1;
  if (entry.nextStep) score += 1;
  return score;
}

function strongestReason(entry) {
  const reasons = [];
  if (entry.favorite) reasons.push("circled");
  if (entry.status) reasons.push(entry.status.toLowerCase());
  if (entry.action) reasons.push(`next action: ${entry.action}`);
  if (entry.project) reasons.push(`project: ${entry.project}`);
  if (entry.priority && entry.priority !== "Normal") reasons.push(`${entry.priority.toLowerCase()} priority`);
  if (entryHasImage(entry)) reasons.push("has a contact print");
  if (splitTags(entry.tags).length) reasons.push(`signals: ${splitTags(entry.tags).slice(0, 3).join(", ")}`);
  return reasons.length ? reasons.join(" · ") : "This exposure rises to the top because it has enough detail to review further.";
}

function getCurrentSession() {
  return state.sessions.find(session => session.id === state.currentSessionId) || null;
}

function closeCurrentSession() {
  if (!state.currentSessionId) {
    alert("There is no active trail session to close.");
    return;
  }
  const finishedAt = new Date().toISOString();
  state.sessions = state.sessions.map(session => {
    if (session.id !== state.currentSessionId) return session;
    return { ...session, endedAt: finishedAt, finishTimestamp: finishedAt };
  });
  state.currentSessionId = null;
  saveState();
  renderAll();
  flashSaved("Exposure roll closed");
}

function renderSessionPill() {
  if (!els.currentSessionPill) return;
  const session = getCurrentSession();
  if (!session) {
    els.currentSessionPill.innerHTML = `<span>No active session</span><button class="secondary compact" data-start-session type="button">Start session</button>`;
    return;
  }
  const conditions = [session.focus, session.light, session.weather, session.terrain, session.pace].filter(Boolean).join(" · ");
  els.currentSessionPill.textContent = conditions ? `Roll: ${session.name} · ${conditions}` : `Roll: ${session.name}`;
}

function renderTrailModeConsole() {
  const session = getCurrentSession();
  if (els.trailSessionStatus) {
    if (session) {
      const conditions = [session.weather, session.terrain, session.pace].filter(Boolean).join(" · ");
      els.trailSessionStatus.textContent = conditions ? `Active: ${session.name} · ${conditions}` : `Active: ${session.name}`;
    } else {
      els.trailSessionStatus.textContent = "No active session";
    }
  }
  if (els.trailSessionStarter) els.trailSessionStarter.classList.toggle("active-roll", Boolean(session));
  if (els.startTrailSessionQuick) els.startTrailSessionQuick.textContent = session ? "Close session" : "Start session";
  [els.trailSessionName, els.trailSessionWeather, els.trailSessionTerrain, els.trailSessionLight, els.trailSessionPace].filter(Boolean).forEach(control => {
    control.disabled = Boolean(session);
  });
}

function focusTrailSessionStarter() {
  if (els.trailSessionStarter) els.trailSessionStarter.scrollIntoView({ behavior: "smooth", block: "center" });
  if (els.trailSessionName && !getCurrentSession()) els.trailSessionName.focus();
}

function startSessionFromTrailMode() {
  if (state.currentSessionId) {
    closeCurrentSession();
    return;
  }
  const name = (els.trailSessionName?.value || "").trim() || "Trail walk";
  const session = normalizeSessionForV14({
    id: crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`,
    name,
    intent: "",
    focus: "Trail Mode capture",
    companions: "",
    notes: "Started from the Muse Trail Mode console.",
    light: els.trailSessionLight?.value || "",
    weather: els.trailSessionWeather?.value || "",
    terrain: els.trailSessionTerrain?.value || "",
    pace: els.trailSessionPace?.value || "",
    startedAt: new Date().toISOString(),
    endedAt: null,
    startTimestamp: new Date().toISOString(),
    finishTimestamp: null
  });
  state.sessions.unshift(session);
  state.currentSessionId = session.id;
  if (els.trailSessionName) els.trailSessionName.value = "";
  if (els.trailSessionWeather) els.trailSessionWeather.value = "";
  if (els.trailSessionTerrain) els.trailSessionTerrain.value = "";
  if (els.trailSessionLight) els.trailSessionLight.value = "";
  if (els.trailSessionPace) els.trailSessionPace.value = "";
  saveState();
  renderAll();
  flashSaved("Trail session started");
}

function saveTrailQuickNote() {
  const note = (els.trailQuickNote?.value || "").trim();
  if (!note) {
    if (els.trailQuickNote) els.trailQuickNote.focus();
    return;
  }
  const entry = makeEntry({
    type: "Trail Thought",
    title: titleFromPrompt(note) || "Trail thought",
    prompt: "Trail Mode quick note",
    note,
    action: "",
    status: "Raw Capture",
    tags: "trail mode, quick note"
  });
  state.entries.unshift(entry);
  els.trailQuickNote.value = "";
  saveState();
  renderAll();
  flashSaved("Saved + keep walking");
}

function exportJson() {
  state.lastBackupAt = new Date().toISOString();
  saveState();
  renderStudio();
  const exportState = {
    ...state,
    entries: state.entries.map(entry => {
      const src = imageSrcFor(entry);
      const copy = { ...entry };
      if (src) copy.image = src; else delete copy.image;
      return copy;
    })
  };
  const payload = {
    app: "FI-077 Trail Muse",
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    state: exportState
  };
  downloadText(`trail-muse-${dateStamp()}.json`, JSON.stringify(payload, null, 2), "application/json");
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const parsed = JSON.parse(reader.result);
      const isHikePackage = Boolean(parsed?.session && Array.isArray(parsed?.entries));
      // (async onload)

      if (isHikePackage) {
        const importedSession = normalizeSessionForV14(parsed.session);
        if (!importedSession?.id) importedSession.id = uid("session");
        const importedEntries = parsed.entries
          .map(normalizeEntryForV13)
          .map(entry => ({ ...entry, sessionId: importedSession.id }));
        const sessionName = importedSession.name || "Untitled hike";
        const existing = state.sessions.some(session => session.id === importedSession.id);
        const message = existing
          ? `Re-import “${sessionName}”? The existing copy of this hike and its entries will be replaced.`
          : `Import “${sessionName}” into this Trail Muse archive?`;
        if (!confirm(message)) return;

        state.sessions = existing
          ? state.sessions.map(session => session.id === importedSession.id ? importedSession : session)
          : [...state.sessions, importedSession];
        if (existing) state.entries = state.entries.filter(entry => entry.sessionId !== importedSession.id);
        state.entries = [...state.entries, ...importedEntries];
        saveState();
        await migrateInlineImages();
        renderAll();
        if (els.sessionFilter) els.sessionFilter.value = importedSession.id;
        renderJournal();
        flashSaved(`${sessionName} imported with ${importedEntries.length} entr${importedEntries.length === 1 ? "y" : "ies"}`);
        return;
      }

      const imported = parsed.state || parsed;
      if (!Array.isArray(imported.entries)) throw new Error("Invalid Trail Muse file.");
      const ok = confirm("Import this complete Trail Muse archive? This will replace the current local journal.");
      if (!ok) return;
      state = {
        ...defaultState(),
        ...imported,
        entries: imported.entries.map(normalizeEntryForV13),
        sessions: Array.isArray(imported.sessions) ? imported.sessions.map(normalizeSessionForV14) : [],
        projects: normalizeProjects(imported.projects, imported.entries),
        artifacts: normalizeArtifacts(imported.artifacts),
        customDecks: normalizeCustomDecks(imported.customDecks)
      };
      if (!["list", "contact"].includes(state.journalLayout)) state.journalLayout = "contact";
      saveState();
      await migrateInlineImages();
      applyTheme();
      renderAll();
      flashSaved("Trail Muse archive imported");
    } catch (error) {
      alert("That JSON file does not look like a Trail Muse export.");
      console.error(error);
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function specimenDetailsHtml(entry) {
  const details = specimenDetailPairs(entry)
    .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
    .join("");
  const ethics = entry.specimenLeftInPlace ? "Found, observed, and left in place." : "Handling not marked. Confirm whether collection was allowed and appropriate.";
  return `
    <section class="specimen-details">
      <p class="ethics">${escapeHtml(ethics)}</p>
      ${details ? `<dl>${details}</dl>` : ""}
    </section>`;
}

function exportCsv() {
  const headers = ["id", "type", "title", "status", "reviewScore", "followupScore", "sessionName", "action", "priority", "energy", "project", "due", "nextStep", "finishedNote", "location", "mood", "light", "weather", "terrain", "pace", "tags", "specimenName", "specimenMaterial", "specimenTexture", "specimenCondition", "specimenScale", "specimenPosition", "specimenStory", "specimenUse", "specimenLeftInPlace", "prompt", "note", "capturedAt", "createdAt", "updatedAt"];
  const rows = state.entries.map(entry => headers.map(header => {
    if (header === "reviewScore") return csvEscape(reviewScore(entry));
    if (header === "sessionName") return csvEscape(sessionNameForEntry(entry));
    if (header === "followupScore") return csvEscape(followupScore(normalizeEntryForV13(entry)));
    return csvEscape(entry[header] || "");
  }).join(","));
  downloadText(`trail-muse-${dateStamp()}.csv`, [headers.join(","), ...rows].join("\n"), "text/csv");
}


function exportPrintCss() {
  return `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif; margin: 0; color: #111; background: radial-gradient(circle at 20% 0%, #f5f4ed 0, #d8d7d1 38%, #b7b5ad 100%); }
  header, article, section.panel-print { background: rgba(252,251,245,.96); border: 1px solid rgba(0,0,0,.22); border-radius: 20px; padding: 1.15rem; box-shadow: 0 18px 44px rgba(0,0,0,.13); }
  header { margin-bottom: 1rem; }
  h1, h2, h3 { letter-spacing: -.052em; line-height: .96; margin: .15rem 0 .55rem; }
  h1 { font-size: clamp(2.4rem, 9vw, 5.4rem); }
  h2 { font-size: clamp(1.55rem, 5vw, 2.65rem); }
  h3 { font-size: 1.2rem; }
  p { line-height: 1.55; }
  blockquote { border-left: 6px solid #111; margin-left: 0; padding-left: 1rem; color: #54534f; font-style: italic; }
  .meta, .tags, .eyebrow { color: #55534d; font-weight: 800; }
  .eyebrow { letter-spacing: .14em; text-transform: uppercase; font-size: .74rem; }
  img { max-width: 100%; filter: grayscale(1) contrast(1.12); border: 12px solid #fff; outline: 1px solid rgba(0,0,0,.28); box-shadow: 0 12px 30px rgba(0,0,0,.18); }
  .placeholder { min-height: 150px; display: grid; place-items: center; border: 1px dashed rgba(0,0,0,.38); background: linear-gradient(135deg, #f5f4ee, #cac8bf); color: #333; font-size: 2.2rem; }
  .chips { display: flex; flex-wrap: wrap; gap: .35rem; margin: .6rem 0; }
  .chips span { border: 1px solid rgba(0,0,0,.24); border-radius: 999px; padding: .28rem .55rem; background: #efeee8; font-size: .8rem; font-weight: 800; }
  .grid { display: grid; gap: 1rem; }
  .two { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
  .contact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(205px, 1fr)); gap: .85rem; }
  .contact-card { border-radius: 14px; padding: .65rem; background: #101010; color: #f4f3ed; border: 1px solid #000; box-shadow: 0 12px 32px rgba(0,0,0,.22); break-inside: avoid; }
  .contact-card figure { margin: 0; aspect-ratio: 1; display: grid; place-items: center; background: #262626; overflow: hidden; border: 8px solid #f5f4ee; }
  .contact-card img { width: 100%; height: 100%; object-fit: cover; border: 0; outline: 0; box-shadow: none; }
  .contact-card h3 { color: #fff; font-size: 1rem; letter-spacing: -.035em; }
  .contact-card .meta { color: #c8c6bd; font-size: .78rem; }
  .specimen-details dl { display: grid; grid-template-columns: 8rem 1fr; gap: .28rem .8rem; }
  .specimen-details dt { font-size: .74rem; text-transform: uppercase; letter-spacing: .1em; font-weight: 900; }
  .specimen-details dd { margin: 0; }
  @media print {
    body { background: white; }
    header, article, section.panel-print, .contact-card { box-shadow: none; break-inside: avoid; }
    a { color: inherit; }
  }`;
}

function exportEntryArticleHtml(entry, options = {}) {
  entry = normalizeEntryForV13(entry);
  const includeImage = options.includeImage !== false;
  const image = includeImage && entryHasImage(entry) ? `<img src="${imageSrcFor(entry)}" alt="${escapeHtml(entry.title || "Trail Muse attachment")}">` : "";
  const tags = splitTags(entry.tags);
  const chips = [entry.type, entry.status, sessionNameForEntry(entry), entry.location, entry.mood, entry.light, entry.weather, entry.terrain, entry.pace]
    .filter(Boolean)
    .map(value => `<span>${escapeHtml(value)}</span>`)
    .join("");
  return `
    <article class="entry-print">
      <p class="eyebrow">${escapeHtml(entry.favorite ? "Circled exposure" : "Field exposure")}</p>
      <h2>${escapeHtml(entry.title || "Untitled exposure")}</h2>
      <p class="meta">${escapeHtml(formatDate(entry.createdAt))}</p>
      ${chips ? `<div class="chips">${chips}</div>` : ""}
      ${image}
      ${entry.prompt ? `<blockquote>${escapeHtml(entry.prompt)}</blockquote>` : ""}
      ${entry.note ? `<p>${escapeHtml(entry.note).replace(/\n/g, "<br>")}</p>` : ""}
      ${entry.action ? `<p><strong>Make later:</strong> ${escapeHtml(entry.action)}${entry.priority ? ` · ${escapeHtml(entry.priority)} priority` : ""}${entry.energy ? ` · ${escapeHtml(entry.energy)}` : ""}${entry.project ? ` · project: ${escapeHtml(entry.project)}` : ""}${entry.due ? ` · ${escapeHtml(dueLabel(entry.due))}` : ""}</p>` : ""}
      ${entry.nextStep ? `<p><strong>Next step:</strong> ${escapeHtml(entry.nextStep)}</p>` : ""}
      ${entry.finishedNote ? `<p><strong>Finished work:</strong> ${escapeHtml(entry.finishedNote)}</p>` : ""}
      ${isSpecimenEntry(entry) ? specimenDetailsHtml(entry) : ""}
      ${tags.length ? `<p class="tags">${tags.map(tag => `#${escapeHtml(tag)}`).join(" ")}</p>` : ""}
    </article>`;
}

function exportContactSheet() {
  const entries = state.entries
    .map(normalizeEntryForV13)
    .slice()
    .sort((a, b) => reviewScore(b) - reviewScore(a));
  if (!entries.length) {
    alert("There are no exposures to place on a contact sheet yet.");
    return;
  }
  const cards = entries.map((entry, index) => `
    <article class="contact-card">
      <figure>${entryHasImage(entry) ? `<img src="${imageSrcFor(entry)}" alt="${escapeHtml(entry.title || "Trail Muse contact print")}">` : `<div class="placeholder">${entry.type === "Photography Note" ? "▧" : "✦"}</div>`}</figure>
      <p class="meta">Frame ${String(index + 1).padStart(2, "0")} · ${escapeHtml(entry.type)} · score ${reviewScore(entry)}</p>
      <h3>${escapeHtml(entry.favorite ? `★ ${entry.title || "Untitled"}` : entry.title || "Untitled exposure")}</h3>
      <p class="meta">${escapeHtml(entry.status)}${sessionNameForEntry(entry) ? ` · ${escapeHtml(sessionNameForEntry(entry))}` : ""}</p>
      <p>${escapeHtml((entry.note || entry.prompt || "No caption yet.").slice(0, 150))}</p>
    </article>`).join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trail Muse Contact Sheet</title>
<style>${exportPrintCss()}</style>
</head>
<body>
<main style="max-width:1200px;margin:0 auto;padding:1.5rem;">
<header>
  <p class="eyebrow">Field Instrument 077 · Trail Muse v${APP_VERSION}</p>
  <h1>Darkroom Contact Sheet</h1>
  <p>${entries.length} exposure${entries.length === 1 ? "" : "s"}, ranked by review score. Use this sheet to circle, reject, and choose what deserves development.</p>
</header>
<section class="contact-grid">${cards}</section>
</main>
</body>
</html>`;
  downloadText(`trail-muse-contact-sheet-${dateStamp()}.html`, html, "text/html");
}

function exportZineSheet() {
  const entries = state.entries
    .map(normalizeEntryForV13)
    .filter(entry => entry.status !== "Archived")
    .sort((a, b) => (reviewScore(b) + followupScore(b)) - (reviewScore(a) + followupScore(a)))
    .slice(0, 8);
  if (!entries.length) {
    alert("There are no exposures to fold into a zine yet.");
    return;
  }
  const pages = entries.map((entry, index) => `
    <article class="zine-page">
      <p class="eyebrow">Page ${index + 1} · ${escapeHtml(entry.type)}</p>
      <h2>${escapeHtml(entry.title || "Untitled exposure")}</h2>
      ${entryHasImage(entry) ? `<img src="${imageSrcFor(entry)}" alt="${escapeHtml(entry.title || "zine image")}">` : `<div class="placeholder">${index + 1}</div>`}
      <p>${escapeHtml((entry.note || entry.prompt || nextStepForEntry(entry)).slice(0, 260))}</p>
      ${entry.action ? `<p class="meta">Make later: ${escapeHtml(entry.action)}</p>` : ""}
      ${splitTags(entry.tags).length ? `<p class="tags">${splitTags(entry.tags).slice(0, 4).map(tag => `#${escapeHtml(tag)}`).join(" ")}</p>` : ""}
    </article>`).join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trail Muse Printable Zine Sheet</title>
<style>
${exportPrintCss()}
body { background: #efeee8; }
.zine-wrap { max-width: 1100px; margin: 0 auto; padding: 1rem; }
.zine-sheet { display: grid; grid-template-columns: repeat(4, 1fr); gap: .6rem; }
.zine-page { min-height: 340px; padding: .8rem; border: 1.5px solid #111; border-radius: 0; box-shadow: none; background: #fbfaf4; display: flex; flex-direction: column; }
.zine-page img, .zine-page .placeholder { width: 100%; aspect-ratio: 4/3; object-fit: cover; margin: .35rem 0 .55rem; border-width: 8px; }
.zine-page h2 { font-size: 1.3rem; }
.zine-page p { font-size: .9rem; line-height: 1.35; }
.fold-note { margin: 1rem 0; font-weight: 800; }
@media print { .zine-wrap { padding: 0; } header, .fold-note { display: none; } .zine-sheet { gap: 0; } .zine-page { break-inside: avoid; min-height: 25vh; border-radius: 0; } }
@media (max-width: 760px) { .zine-sheet { grid-template-columns: repeat(2, 1fr); } }
</style>
</head>
<body>
<main class="zine-wrap">
<header>
  <p class="eyebrow">Field Instrument 077 · Trail Muse v${APP_VERSION}</p>
  <h1>Printable Field Zine Sheet</h1>
  <p>Eight strongest sparks laid out as a small zine worksheet. Print, fold, cut, annotate, and return to the studio with a physical artifact.</p>
</header>
<p class="fold-note">Fold/cut layout is intentionally simple: print this sheet, cut cards apart or fold into a field mini-zine.</p>
<section class="zine-sheet">${pages}</section>
</main>
</body>
</html>`;
  downloadText(`trail-muse-zine-sheet-${dateStamp()}.html`, html, "text/html");
}

function exportHtmlGallery() {
  const entries = state.entries
    .map(normalizeEntryForV13)
    .filter(entryHasImage)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (!entries.length) {
    alert("There are no photo or sketch attachments to export as a gallery yet.");
    return;
  }
  const cards = entries.map(entry => `
    <article class="gallery-card">
      <img src="${imageSrcFor(entry)}" alt="${escapeHtml(entry.title || "Trail Muse gallery image")}">
      <h2>${escapeHtml(entry.title || "Untitled exposure")}</h2>
      <p class="meta">${escapeHtml(entry.type)} · ${escapeHtml(formatDate(entry.createdAt))}${sessionNameForEntry(entry) ? ` · ${escapeHtml(sessionNameForEntry(entry))}` : ""}</p>
      <p>${escapeHtml(entry.note || entry.prompt || "No caption yet.")}</p>
      ${splitTags(entry.tags).length ? `<p class="tags">${splitTags(entry.tags).map(tag => `#${escapeHtml(tag)}`).join(" ")}</p>` : ""}
    </article>`).join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trail Muse HTML Gallery</title>
<style>
${exportPrintCss()}
.gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
.gallery-card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; }
</style>
</head>
<body>
<main style="max-width:1180px;margin:0 auto;padding:1.5rem;">
<header>
  <p class="eyebrow">Field Instrument 077 · Trail Muse v${APP_VERSION}</p>
  <h1>Silver HTML Gallery</h1>
  <p>${entries.length} image exposure${entries.length === 1 ? "" : "s"} exported with captions, tags, and roll context.</p>
</header>
<section class="gallery">${cards}</section>
</main>
</body>
</html>`;
  downloadText(`trail-muse-html-gallery-${dateStamp()}.html`, html, "text/html");
}

function exportCreativeHarvestReport() {
  const entries = state.entries.map(normalizeEntryForV13);
  const queue = entries.filter(entry => entry.action && entry.status !== "Archived").sort((a, b) => followupScore(b) - followupScore(a));
  const ranked = entries.slice().sort((a, b) => reviewScore(b) - reviewScore(a));
  const topTags = topTagCounts(entries).slice(0, 12);
  const projects = groupByProject(queue).slice(0, 8);
  const sessionSummaries = state.sessions.map(session => ({ session, stats: sessionStats(session) })).sort((a, b) => b.stats.entries.length - a.stats.entries.length).slice(0, 8);
  const topCards = ranked.slice(0, 6).map(entry => exportEntryArticleHtml(entry, { includeImage: true })).join("\n");
  const projectCards = projects.map(project => `<article><h2>${escapeHtml(project.name)}</h2><p class="meta">${project.items.length} follow-up${project.items.length === 1 ? "" : "s"}</p>${project.items.slice(0, 4).map(entry => `<p><strong>${escapeHtml(entry.title || "Untitled")}</strong> · ${escapeHtml(entry.action || "Define next action")} · ${escapeHtml(nextStepForEntry(entry))}</p>`).join("")}</article>`).join("\n");
  const tagChips = topTags.map(([tag, count]) => `<span>#${escapeHtml(tag)} · ${count}</span>`).join("");
  const sessionRows = sessionSummaries.map(({ session, stats }) => `<article><h2>${escapeHtml(session.name || "Untitled roll")}</h2><p class="meta">${stats.entries.length} exposures · ${stats.queue.length} queued · ${stats.favorites.length} circled · ${stats.finished.length} finished · ${escapeHtml(sessionDuration(session))}</p>${stats.best ? `<p><strong>Best spark:</strong> ${escapeHtml(stats.best.title || "Untitled exposure")}</p>` : ""}</article>`).join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trail Muse Creative Harvest Report</title>
<style>${exportPrintCss()}</style>
</head>
<body>
<main style="max-width:1120px;margin:0 auto;padding:1.5rem;">
<header>
  <p class="eyebrow">Field Instrument 077 · Trail Muse v${APP_VERSION}</p>
  <h1>Creative Harvest Report</h1>
  <p>Exported ${escapeHtml(formatDate(new Date().toISOString()))}. ${entries.length} exposure${entries.length === 1 ? "" : "s"}, ${queue.length} open follow-up${queue.length === 1 ? "" : "s"}, ${state.sessions.length} exposure roll${state.sessions.length === 1 ? "" : "s"}.</p>
</header>
<section class="panel-print"><h2>Recurring signals</h2><div class="chips">${tagChips || "<span>No tags yet</span>"}</div></section>
<section class="grid two"><article><h2>Highest scoring spark</h2>${ranked[0] ? `<p><strong>${escapeHtml(ranked[0].title || "Untitled exposure")}</strong></p><p>${escapeHtml(strongestReason(ranked[0]))}</p>` : "<p>No entries yet.</p>"}</article><article><h2>Next print on the bench</h2>${queue[0] ? `<p><strong>${escapeHtml(queue[0].title || "Untitled exposure")}</strong></p><p>${escapeHtml(nextStepForEntry(queue[0]))}</p>` : "<p>No make-later items yet.</p>"}</article></section>
<section><h2>Best sparks</h2><div class="grid two">${topCards || "<p>No entries yet.</p>"}</div></section>
<section><h2>Project workbench</h2><div class="grid two">${projectCards || "<p>No project groups yet.</p>"}</div></section>
<section><h2>Session / roll summaries</h2><div class="grid two">${sessionRows || "<p>No sessions yet.</p>"}</div></section>
</main>
</body>
</html>`;
  downloadText(`trail-muse-creative-harvest-${dateStamp()}.html`, html, "text/html");
}

function topTagCounts(entries = state.entries) {
  const counts = new Map();
  entries.forEach(entry => {
    splitTags(entry.tags).forEach(tag => {
      const key = tag.toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function exportMarkdownArchive() {
  const entries = state.entries.map(normalizeEntryForV13).slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const lines = [];
  lines.push(`# Trail Muse Field Archive`);
  lines.push("");
  lines.push(`Field Instrument 077 · Trail Muse v${APP_VERSION}`);
  lines.push(`Exported: ${formatDate(new Date().toISOString())}`);
  lines.push(`Entries: ${entries.length}`);
  lines.push("");
  if (state.sessions.length) {
    lines.push(`## Exposure Rolls`);
    lines.push("");
    state.sessions.forEach(session => {
      const stats = sessionStats(session);
      lines.push(`### ${markdownText(session.name || "Untitled roll")}`);
      lines.push(`- Started: ${formatDate(session.startedAt)}`);
      lines.push(`- Closed: ${session.endedAt ? formatDate(session.endedAt) : "Active"}`);
      lines.push(`- Duration: ${sessionDuration(session)}`);
      lines.push(`- Conditions: ${[session.intent, session.focus, session.light, session.weather, session.terrain, session.pace].filter(Boolean).join(" · ") || "Not recorded"}`);
      lines.push(`- Exposures: ${stats.entries.length}; queued: ${stats.queue.length}; circled: ${stats.favorites.length}; finished: ${stats.finished.length}`);
      if (session.notes) lines.push(`- Notes: ${markdownText(session.notes)}`);
      lines.push("");
    });
  }
  lines.push(`## Entries`);
  lines.push("");
  entries.forEach(entry => {
    const tags = splitTags(entry.tags).map(tag => `#${tag.replace(/\s+/g, "-")}`).join(" ");
    lines.push(`### ${markdownText(entry.title || "Untitled exposure")}`);
    lines.push(`- Type: ${markdownText(entry.type)}`);
    lines.push(`- Status: ${markdownText(entry.status)}`);
    lines.push(`- Created: ${formatDate(entry.createdAt)}`);
    if (sessionNameForEntry(entry)) lines.push(`- Roll: ${markdownText(sessionNameForEntry(entry))}`);
    if (entry.location) lines.push(`- Location: ${markdownText(entry.location)}`);
    if ([entry.mood, entry.light, entry.weather, entry.terrain, entry.pace].some(Boolean)) lines.push(`- Field conditions: ${markdownText([entry.mood, entry.light, entry.weather, entry.terrain, entry.pace].filter(Boolean).join(" · "))}`);
    if (entry.action) lines.push(`- Make later: ${markdownText(entry.action)}; priority ${markdownText(entry.priority)}; energy ${markdownText(entry.energy)}`);
    if (entry.project) lines.push(`- Project: ${markdownText(entry.project)}`);
    if (entry.due) lines.push(`- Due: ${markdownText(dueLabel(entry.due))}`);
    if (entry.nextStep) lines.push(`- Next step: ${markdownText(entry.nextStep)}`);
    if (entry.finishedNote) lines.push(`- Finished work: ${markdownText(entry.finishedNote)}`);
    if (tags) lines.push(`- Tags: ${tags}`);
    if (entryHasImage(entry)) lines.push(`- Attachment: embedded in HTML/JSON exports; omitted from Markdown for portability.`);
    if (entry.prompt) { lines.push(""); lines.push(`> ${markdownText(entry.prompt).replace(/\n/g, "\n> ")}`); }
    if (entry.note) { lines.push(""); lines.push(markdownText(entry.note)); }
    if (isSpecimenEntry(entry)) {
      lines.push("");
      lines.push(`#### Specimen card`);
      lines.push(`- Handling: ${entry.specimenLeftInPlace ? "Found, observed, and left in place" : "Handling unconfirmed"}`);
      specimenDetailPairs(entry).forEach(([label, value]) => lines.push(`- ${label}: ${markdownText(value)}`));
    }
    lines.push("");
  });
  downloadText(`trail-muse-archive-${dateStamp()}.md`, lines.join("\n"), "text/markdown");
}

function markdownText(value = "") {
  return String(value || "").replace(/\r/g, "").trim();
}

function exportHtml() {
  const entries = state.entries
    .map(normalizeEntryForV13)
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const cards = entries.map(entry => exportEntryArticleHtml(entry, { includeImage: true })).join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trail Muse Silver Field Journal</title>
<style>${exportPrintCss()}</style>
</head>
<body>
<main style="max-width:980px;margin:0 auto;padding:1.5rem;">
<header>
  <p class="eyebrow">Field Instrument 077 · Trail Muse v${APP_VERSION}</p>
  <h1>Silver Field Journal</h1>
  <p>Exported ${escapeHtml(formatDate(new Date().toISOString()))}. ${entries.length} exposure${entries.length === 1 ? "" : "s"} collected across ${state.sessions.length} exposure roll${state.sessions.length === 1 ? "" : "s"}.</p>
  <p>This journal preserves field notes, prompts, conditions, specimen details, follow-up actions, and attached sketches or photographs in a monochrome print-ready format.</p>
</header>
${cards || "<section class=\"panel-print\"><h2>No entries yet.</h2><p>Expose a prompt or capture a small discovery before exporting the journal.</p></section>"}
</main>
</body>
</html>`;
  downloadText(`trail-muse-silver-field-journal-${dateStamp()}.html`, html, "text/html");
}

function slugify(value) {
  return String(value || "trail-muse")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "trail-muse";
}

function openClearAllDialog() {
  if (!els.clearAllDialog) return;
  if (els.clearAllConfirmation) els.clearAllConfirmation.value = "";
  updateClearAllConfirmation();
  els.clearAllDialog.showModal();
  setTimeout(() => els.clearAllConfirmation?.focus(), 50);
}

function closeClearAllDialog() {
  if (els.clearAllDialog?.open) els.clearAllDialog.close();
}

function updateClearAllConfirmation() {
  if (!els.confirmClearAll || !els.clearAllConfirmation) return;
  els.confirmClearAll.disabled = els.clearAllConfirmation.value.trim().toUpperCase() !== "CLEAR";
}

function confirmClearAllData(event) {
  event?.preventDefault();
  if (!els.clearAllConfirmation || els.clearAllConfirmation.value.trim().toUpperCase() !== "CLEAR") return;
  clearAllData();
}

async function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(DRAFT_KEY);
  imageCache.clear();
  if (imageDbAvailable()) { try { await idbClearImages(); } catch (error) { console.warn("Trail Muse could not clear stored images.", error); } }
  state = defaultState();
  pendingImageData = "";
  mobilePendingImage = "";
  closeClearAllDialog();
  applyTheme();
  renderAll();
  flashSaved("All locally stored Trail Muse data cleared");
}

function csvEscape(value) {
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function downloadText(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  return new Date(value).toLocaleString([], { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function flashSaved(message) {
  const previous = els.saveIndicator?.textContent || "Saved";
  if (els.saveIndicator) els.saveIndicator.textContent = message;
  window.setTimeout(() => {
    if (els.saveIndicator) els.saveIndicator.textContent = previous;
    renderSaveIndicator();
  }, 1200);
}

/* v2.7.8 mobile field workflow */
let mobilePendingImage = "";
let mobilePromptValue = "";

function initMobileFieldApp() {
  const root = document.getElementById("mobileFieldApp");
  if (!root) return;
  const byId = id => document.getElementById(id);

  byId("mobileThemeToggle")?.addEventListener("click", toggleTheme);

  byId("mobileSessionForm")?.addEventListener("submit", event => {
    event.preventDefault();
    const name = byId("mobileSessionName").value.trim();
    if (!name) {
      byId("mobileSessionName").focus();
      return;
    }
    const now = new Date().toISOString();
    const current = getCurrentSession();
    if (current) {
      state.sessions = state.sessions.map(item => item.id === current.id ? { ...item, endedAt: now } : item);
    }
    const session = normalizeSessionForV14({
      id: crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`,
      name,
      weather: byId("mobileSessionWeather").value,
      terrain: byId("mobileSessionTerrain").value,
      light: byId("mobileSessionLight").value,
      pace: byId("mobileSessionPace").value,
      intent: byId("mobileSessionIntent").value.trim(),
      focus: byId("mobileSessionFocus").value.trim(),
      companions: byId("mobileSessionCompanions").value.trim(),
      notes: byId("mobileSessionNotes").value.trim(),
      startedAt: now,
      endedAt: null
    });
    state.sessions.unshift(session);
    state.currentSessionId = session.id;
    saveState();
    renderAll();
    renderMobileFieldApp();
  });

  byId("mobileNewEntry")?.addEventListener("click", openMobileCapture);
  document.querySelectorAll("[data-mobile-direct-type]").forEach(button => {
    button.addEventListener("click", () => {
      openMobileCapture();
      chooseMobileCaptureType(button.dataset.mobileDirectType);
    });
  });
  byId("mobileCaptureClose")?.addEventListener("click", () => byId("mobileCaptureDialog").close());
  byId("mobileTypeChooser")?.addEventListener("click", event => {
    const button = event.target.closest("[data-mobile-type]");
    if (!button) return;
    chooseMobileCaptureType(button.dataset.mobileType);
  });
  byId("mobileCaptureImage")?.addEventListener("change", handleMobileImage);
  byId("mobileCaptureForm")?.addEventListener("submit", saveMobileEntry);

  byId("mobilePrompt")?.addEventListener("click", () => {
    const deckNames = allDeckNames();
    const deck = deckNames[Math.floor(Math.random() * deckNames.length)] || "Wanderer";
    const prompts = getDeckPrompts(deck);
    mobilePromptValue = prompts[Math.floor(Math.random() * prompts.length)] || "Notice what changed when you stopped walking.";
    byId("mobilePromptText").textContent = mobilePromptValue;
    byId("mobilePromptCard").hidden = false;
    byId("mobilePromptCard").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  byId("mobileSavePrompt")?.addEventListener("click", () => {
    chooseMobileCaptureType("Prompt Response");
    byId("mobileCaptureNote").value = mobilePromptValue;
    byId("mobilePromptCard").hidden = true;
  });

  byId("mobileEditSession")?.addEventListener("click", openMobileEditSession);
  byId("mobileEditClose")?.addEventListener("click", () => byId("mobileEditSessionDialog").close());
  byId("mobileEditSessionForm")?.addEventListener("submit", saveMobileSessionEdit);
  byId("mobileFinishHike")?.addEventListener("click", openMobileFinish);
  byId("mobileFinishClose")?.addEventListener("click", () => byId("mobileFinishDialog").close());
  byId("mobileCloseOnly")?.addEventListener("click", () => finishMobileHike(false));
  byId("mobileFinishForm")?.addEventListener("submit", event => { event.preventDefault(); finishMobileHike(true); });
  byId("mobileViewAll")?.addEventListener("click", openMobileEntries);
  byId("mobileEntriesClose")?.addEventListener("click", closeMobileEntries);
  byId("mobileEntriesBack")?.addEventListener("click", closeMobileEntries);

  const weatherSource = byId("mobileSessionWeather");
  const terrainSource = byId("mobileSessionTerrain");
  const lightSource = byId("mobileSessionLight");
  const paceSource = byId("mobileSessionPace");
  if (byId("mobileEditWeather") && weatherSource) byId("mobileEditWeather").innerHTML = weatherSource.innerHTML;
  if (byId("mobileEditTerrain") && terrainSource) byId("mobileEditTerrain").innerHTML = terrainSource.innerHTML;
  if (byId("mobileEditLight") && lightSource) byId("mobileEditLight").innerHTML = lightSource.innerHTML;
  if (byId("mobileEditPace") && paceSource) byId("mobileEditPace").innerHTML = paceSource.innerHTML;
  renderMobileFieldApp();
  window.setInterval(updateMobileElapsed, 60000);
}

function renderMobileFieldApp() {
  const start = document.getElementById("mobileStartScreen");
  const active = document.getElementById("mobileActiveScreen");
  if (!start || !active) return;
  const session = getCurrentSession();
  start.hidden = Boolean(session);
  active.hidden = !session;
  if (!session) return;
  document.getElementById("mobileActiveName").textContent = session.name || "Untitled hike";
  document.getElementById("mobileActiveConditions").textContent = [session.weather, session.terrain, session.light, session.pace].filter(Boolean).join(" · ") || "Conditions not recorded";
  const entries = getSessionEntries(session.id).slice().sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
  document.getElementById("mobileEntryCount").textContent = entries.length;
  updateMobileElapsed();
  const list = document.getElementById("mobileRecentEntries");
  list.innerHTML = "";
  if (!entries.length) {
    list.innerHTML = '<div class="mobile-recent-card"><strong>No entries yet</strong><p>Tap New field entry when something asks to be remembered.</p></div>';
  } else {
    entries.slice(0,3).forEach(entry => {
      const card = document.createElement("article");
      card.className = "mobile-recent-card";
      card.innerHTML = `<strong>${escapeHtml(entry.type || "Field entry")}</strong><p>${escapeHtml(entry.note || entry.prompt || entry.title || "Saved exposure")}</p>`;
      list.append(card);
    });
  }
}

function openMobileEntries() {
  const dialog = document.getElementById("mobileEntriesDialog");
  const list = document.getElementById("mobileAllEntries");
  const session = getCurrentSession();
  if (!dialog || !list || !session) return;
  const entries = getSessionEntries(session.id).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  list.innerHTML = "";
  if (!entries.length) {
    list.innerHTML = '<div class="mobile-empty-state"><strong>No entries yet</strong><p>Return to the hike and capture the first thing worth remembering.</p></div>';
  } else {
    entries.forEach((entry, index) => {
      const card = document.createElement("article");
      card.className = "mobile-all-entry-card";
      const created = new Date(entry.createdAt);
      const time = Number.isNaN(created.getTime()) ? "" : created.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      card.innerHTML = `
        <div class="mobile-entry-index">${String(entries.length - index).padStart(2, "0")}</div>
        <div class="mobile-entry-copy">
          <div class="mobile-entry-meta"><strong>${escapeHtml(entry.type || "Field entry")}</strong><span>${escapeHtml(time)}</span></div>
          ${entryHasImage(entry) ? `<img src="${imageSrcFor(entry)}" alt="Field entry image" />` : ""}
          <p>${escapeHtml(entry.note || entry.prompt || entry.title || "Saved exposure")}</p>
        </div>`;
      list.append(card);
    });
  }
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function closeMobileEntries() {
  const dialog = document.getElementById("mobileEntriesDialog");
  if (!dialog) return;
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

function updateMobileElapsed() {
  const session = getCurrentSession();
  const target = document.getElementById("mobileElapsed");
  if (session && target) target.textContent = sessionDuration(session);
}

function openMobileCapture() {
  mobilePendingImage = "";
  const dialog = document.getElementById("mobileCaptureDialog");
  document.getElementById("mobileTypeChooser").hidden = false;
  document.getElementById("mobileCaptureFields").hidden = true;
  document.getElementById("mobileCaptureNote").value = "";
  document.getElementById("mobileCaptureImage").value = "";
  document.getElementById("mobileCapturePreview").hidden = true;
  document.getElementById("mobileCaptureTitle").textContent = "What did you notice?";
  dialog.showModal();
}

function chooseMobileCaptureType(type) {
  const dialog = document.getElementById("mobileCaptureDialog");
  if (!dialog.open) dialog.showModal();
  document.getElementById("mobileTypeChooser").hidden = true;
  document.getElementById("mobileCaptureFields").hidden = false;
  document.getElementById("mobileCaptureType").value = type;
  document.getElementById("mobileCaptureTitle").textContent = suggestedTitle(type);
  const placeholders = {
    "Trail Thought":"One thought from the trail…",
    "Photography Note":"What image did you make or see?",
    "Found Object":"What did you find? Leave natural objects in place.",
    "Small Discovery":"What small thing changed your attention?",
    "Sensory Note":"Sound, smell, texture, temperature, or atmosphere…",
    "Writing Note":"A sentence, phrase, or story seed…",
    "Prompt Response":"Respond to the prompt…"
  };
  document.getElementById("mobileCaptureNote").placeholder = placeholders[type] || "What did you notice?";
  window.setTimeout(() => document.getElementById("mobileCaptureNote").focus(), 120);
}

function handleMobileImage(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    mobilePendingImage = String(reader.result || "");
    const preview = document.getElementById("mobileCapturePreview");
    preview.src = mobilePendingImage;
    preview.hidden = false;
  };
  reader.readAsDataURL(file);
}

async function saveMobileEntry(event) {
  event.preventDefault();
  const type = document.getElementById("mobileCaptureType").value || "Trail Thought";
  const note = document.getElementById("mobileCaptureNote").value.trim();
  if (!note && !mobilePendingImage) {
    document.getElementById("mobileCaptureNote").focus();
    return;
  }
  const seed = quickCaptureSeed(type);
  const now = new Date().toISOString();
  const imageResult = await persistImage(mobilePendingImage, "");
  const entry = makeEntry({
    ...seed,
    id: crypto.randomUUID ? crypto.randomUUID() : `entry-${Date.now()}`,
    note,
    image: imageResult.image,
    imageId: imageResult.imageId,
    sessionId: state.currentSessionId,
    capturedAt: now,
    createdAt: now,
    updatedAt: now
  });
  state.entries.unshift(entry);
  saveState();
  renderAll();
  renderMobileFieldApp();
  const dialog = document.getElementById("mobileCaptureDialog");
  if (dialog?.open && typeof dialog.close === "function") dialog.close();
  mobilePendingImage = "";
  const saveButton = document.getElementById("mobileSaveEntry");
  if (saveButton) {
    const original = saveButton.textContent;
    saveButton.textContent = "Saved";
    window.setTimeout(() => { saveButton.textContent = original; }, 900);
  }
  if (navigator.vibrate) navigator.vibrate(20);
}

function openMobileEditSession() {
  const session = getCurrentSession();
  if (!session) return;
  document.getElementById("mobileEditName").value = session.name || "";
  document.getElementById("mobileEditWeather").value = session.weather || "";
  document.getElementById("mobileEditTerrain").value = session.terrain || "";
  document.getElementById("mobileEditLight").value = session.light || "";
  document.getElementById("mobileEditPace").value = session.pace || "";
  document.getElementById("mobileEditIntent").value = session.intent || "";
  document.getElementById("mobileEditFocus").value = session.focus || "";
  document.getElementById("mobileEditCompanions").value = session.companions || "";
  document.getElementById("mobileEditNotes").value = session.notes || "";
  document.getElementById("mobileEditSessionDialog").showModal();
}

function saveMobileSessionEdit(event) {
  event.preventDefault();
  const id = state.currentSessionId;
  state.sessions = state.sessions.map(session => session.id === id ? {
    ...session,
    name: document.getElementById("mobileEditName").value.trim() || session.name,
    weather: document.getElementById("mobileEditWeather").value,
    terrain: document.getElementById("mobileEditTerrain").value,
    light: document.getElementById("mobileEditLight").value,
    pace: document.getElementById("mobileEditPace").value,
    intent: document.getElementById("mobileEditIntent").value.trim(),
    focus: document.getElementById("mobileEditFocus").value.trim(),
    companions: document.getElementById("mobileEditCompanions").value.trim(),
    notes: document.getElementById("mobileEditNotes").value.trim()
  } : session);
  saveState(); renderAll(); renderMobileFieldApp();
  document.getElementById("mobileEditSessionDialog").close();
}

function openMobileFinish() {
  const session = getCurrentSession();
  if (!session) return;
  const entries = getSessionEntries(session.id);
  document.getElementById("mobileFinishSummary").innerHTML = `<strong>${entries.length}</strong><p>field entries · ${escapeHtml(sessionDuration(session))}<br>${escapeHtml([session.weather,session.terrain].filter(Boolean).join(" · ") || "Conditions not recorded")}</p>`;
  document.getElementById("mobileClosingNote").value = session.notes || "";
  document.getElementById("mobileFinishDialog").showModal();
}

function finishMobileHike(shouldExport) {
  const id = state.currentSessionId;
  const session = state.sessions.find(item => item.id === id);
  if (!session) return;
  const endedAt = new Date().toISOString();
  const closingNote = document.getElementById("mobileClosingNote").value.trim();
  const finishedSession = { ...session, notes: closingNote || session.notes || "", endedAt, finishTimestamp: endedAt };
  state.sessions = state.sessions.map(item => item.id === id ? finishedSession : item);
  state.currentSessionId = null;
  saveState();
  if (shouldExport) {
    const payload = {
      format: "FI-077 Trail Muse Hike",
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      session: finishedSession,
      entries: getSessionEntries(id)
    };
    downloadText(`trail-muse-${safeFileName(finishedSession.name || "hike")}-${dateStamp()}.json`, JSON.stringify(payload,null,2), "application/json");
  }
  renderAll(); renderMobileFieldApp();
  document.getElementById("mobileFinishDialog").close();
}

function safeFileName(value) {
  return String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60) || "hike";
}

/* v2.7.8 — Journal Projects → Studio Artifacts */
function normalizeProjects(projects, entries = []) {
  const supplied = Array.isArray(projects) ? projects : [];
  const byName = new Map();
  supplied.forEach(project => {
    const name = String(project?.name || "").trim();
    if (!name) return;
    byName.set(name.toLowerCase(), {
      id: project.id || uid("project"),
      name,
      description: project.description || "",
      createdAt: project.createdAt || new Date().toISOString(),
      updatedAt: project.updatedAt || project.createdAt || new Date().toISOString()
    });
  });
  (Array.isArray(entries) ? entries : []).forEach(entry => {
    const name = String(entry?.project || "").trim();
    if (!name || byName.has(name.toLowerCase())) return;
    byName.set(name.toLowerCase(), {
      id: uid("project"), name, description: "", createdAt: entry.createdAt || new Date().toISOString(), updatedAt: entry.updatedAt || entry.createdAt || new Date().toISOString()
    });
  });
  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeArtifacts(artifacts) {
  return (Array.isArray(artifacts) ? artifacts : []).map(artifact => ({
    id: artifact.id || uid("artifact"),
    projectId: artifact.projectId || "",
    title: artifact.title || "Untitled artifact",
    type: artifact.type || "Other",
    status: artifact.status || "In progress",
    notes: artifact.notes || "",
    link: artifact.link || "",
    createdAt: artifact.createdAt || new Date().toISOString(),
    updatedAt: artifact.updatedAt || artifact.createdAt || new Date().toISOString()
  }));
}

function projectById(id) {
  return (state.projects || []).find(project => project.id === id) || null;
}

function projectEntries(project) {
  if (!project) return [];
  return state.entries.filter(entry => String(entry.project || "").trim().toLowerCase() === project.name.toLowerCase());
}

function openProjectDialog(project = null) {
  if (!els.projectDialog || !els.projectForm) {
    console.error("Project dialog elements are unavailable.");
    return;
  }
  els.projectForm.reset();
  els.projectId.value = project?.id || "";
  els.projectName.value = project?.name || "";
  els.projectDescription.value = project?.description || "";
  els.projectDialogTitle.textContent = project ? "Edit project" : "Create a project";
  els.saveProject.textContent = project ? "Save changes" : "Create project";
  els.projectFormError.hidden = true;
  els.projectFormError.textContent = "";
  els.projectDialog.hidden = false;
  els.projectDialog.classList.add("is-open");
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => els.projectName?.focus());
}

function closeProjectDialog() {
  if (!els.projectDialog) return;
  els.projectDialog.classList.remove("is-open");
  els.projectDialog.hidden = true;
  document.body.classList.remove("modal-open");
}

window.TrailMuseProjects = {
  open(project = null) {
    openProjectDialog(project);
  },
  close() {
    closeProjectDialog();
  }
};

function saveProjectFromDialog(event) {
  event.preventDefault();
  const cleanName = (els.projectName?.value || "").trim();
  const description = (els.projectDescription?.value || "").trim();
  const editingId = els.projectId?.value || "";
  if (!cleanName) {
    els.projectFormError.textContent = "Enter a project name.";
    els.projectFormError.hidden = false;
    els.projectName.focus();
    return;
  }
  state.projects = Array.isArray(state.projects) ? state.projects : [];
  const duplicate = state.projects.find(project => project.name.trim().toLowerCase() === cleanName.toLowerCase() && project.id !== editingId);
  if (duplicate) {
    els.projectFormError.textContent = `A project named “${cleanName}” already exists.`;
    els.projectFormError.hidden = false;
    els.projectName.focus();
    return;
  }
  const now = new Date().toISOString();
  let project;
  if (editingId) {
    project = projectById(editingId);
    if (!project) return;
    const oldName = project.name;
    project.name = cleanName;
    project.description = description;
    project.updatedAt = now;
    state.entries.forEach(entry => {
      if (String(entry.project || "").trim().toLowerCase() === oldName.trim().toLowerCase()) {
        entry.project = cleanName;
        entry.updatedAt = now;
      }
    });
  } else {
    project = { id: uid("project"), name: cleanName, description, createdAt: now, updatedAt: now };
    state.projects = [...(state.projects || []), project];
  }
  state.projects = normalizeProjects(state.projects, state.entries);
  saveState();
  closeProjectDialog();
  renderJournalProjectOptions();
  renderJournalProjects();
  if (els.journalProjectFilter) els.journalProjectFilter.value = project.id;
  renderJournal();
  renderStudioProjectOptions();
  if (els.studioProjectSelect) els.studioProjectSelect.value = project.id;
  renderStudio();
  flashSaved(editingId ? `Project “${project.name}” updated` : `Project “${project.name}” created`);
}

function handleJournalProjectAssignment(event) {
  const select = event.target.closest("[data-project-entry]");
  if (!select) return;
  const entry = state.entries.find(item => item.id === select.dataset.projectEntry);
  if (!entry) return;
  const project = projectById(select.value);
  entry.project = project?.name || "";
  entry.updatedAt = new Date().toISOString();
  saveState();
  renderJournalProjects();
  flashSaved(project ? `Assigned to ${project.name}` : "Project assignment removed");
}

function handleProjectManagerAction(event) {
  const button = event.target.closest("[data-project-action]");
  if (!button) return;
  const project = projectById(button.dataset.projectId);
  if (!project) return;
  if (button.dataset.projectAction === "open") {
    if (els.journalProjectFilter) els.journalProjectFilter.value = project.id;
    renderJournal();
  }
  if (button.dataset.projectAction === "studio") {
    setView("studio");
    if (els.studioProjectSelect) els.studioProjectSelect.value = project.id;
    renderStudio();
  }
  if (button.dataset.projectAction === "edit") {
    openProjectDialog(project);
  }
  if (button.dataset.projectAction === "delete") {
    if (!confirm(`Delete project “${project.name}”? Captures will remain in the Journal as unassigned.`)) return;
    state.projects = state.projects.filter(item => item.id !== project.id);
    state.entries.forEach(entry => { if (entry.project === project.name) entry.project = ""; });
    state.artifacts = (state.artifacts || []).filter(artifact => artifact.projectId !== project.id);
    saveState(); renderAll();
  }
}

function renderJournalProjectOptions() {
  state.projects = normalizeProjects(state.projects, state.entries);
  if (!els.journalProjectFilter) return;
  const current = els.journalProjectFilter.value || "all";
  els.journalProjectFilter.innerHTML = '<option value="all">All captures</option><option value="unassigned">Unassigned captures</option>';
  state.projects.forEach(project => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    els.journalProjectFilter.append(option);
  });
  els.journalProjectFilter.value = Array.from(els.journalProjectFilter.options).some(option => option.value === current) ? current : "all";
}

function renderJournalProjects() {
  if (!els.journalProjectList) return;
  els.journalProjectList.innerHTML = "";
  if (!state.projects.length) {
    els.journalProjectList.innerHTML = '<p class="entry-meta">No projects yet. Create one, then assign captures from the Journal cards below.</p>';
    return;
  }
  state.projects.forEach(project => {
    const entries = projectEntries(project);
    const artifacts = (state.artifacts || []).filter(artifact => artifact.projectId === project.id);
    const card = document.createElement("article");
    card.className = "journal-project-card";
    card.innerHTML = `<div><h4>${escapeHtml(project.name)}</h4><p>${escapeHtml(project.description || "No description yet.")}</p><small>${entries.length} capture${entries.length === 1 ? "" : "s"} · ${artifacts.length} artifact${artifacts.length === 1 ? "" : "s"}</small></div><div class="entry-actions"><button data-project-action="open" data-project-id="${project.id}" type="button">View captures</button><button data-project-action="studio" data-project-id="${project.id}" type="button">Open in Studio</button><button data-project-action="edit" data-project-id="${project.id}" type="button">Edit</button><button data-project-action="delete" data-project-id="${project.id}" type="button">Delete</button></div>`;
    els.journalProjectList.append(card);
  });
}

function renderJournal() {
  if (!els.journalList) return;
  renderJournalProjectOptions();
  renderJournalProjects();
  let entries = getFilteredEntries();
  const projectFilter = els.journalProjectFilter?.value || "all";
  if (projectFilter === "unassigned") entries = entries.filter(entry => !entry.project);
  else if (projectFilter !== "all") {
    const project = projectById(projectFilter);
    entries = project ? entries.filter(entry => entry.project === project.name) : entries;
  }
  els.journalList.innerHTML = "";
  renderJournalLayoutControls();
  const useContactSheet = state.journalLayout !== "list";
  els.journalList.classList.toggle("contact-sheet-grid", useContactSheet);
  if (els.emptyJournal) els.emptyJournal.classList.toggle("active", entries.length === 0);
  entries.forEach(entry => els.journalList.append(entryCard(entry, useContactSheet)));
}

function projectAssignmentControl(entry) {
  const wrap = document.createElement("label");
  wrap.className = "entry-project-assignment";
  wrap.textContent = "Project";
  const select = document.createElement("select");
  select.dataset.projectEntry = entry.id;
  select.innerHTML = '<option value="">Unassigned</option>';
  state.projects.forEach(project => {
    const option = document.createElement("option");
    option.value = project.id;
    option.textContent = project.name;
    option.selected = entry.project === project.name;
    select.append(option);
  });
  wrap.append(select);
  return wrap;
}

function entryCard(entry, compact = false) {
  const card = document.createElement("article");
  card.className = `entry-card ${compact ? "contact-card" : ""} ${entry.status === "Archived" ? "archived" : ""}`;
  card.dataset.id = entry.id;
  const main = document.createElement("div");
  main.className = "entry-main";
  const topline = document.createElement("div");
  topline.className = "entry-topline";
  const title = document.createElement("h3");
  title.textContent = `${entry.favorite ? "★ " : ""}${entry.title || "Untitled exposure"}`;
  topline.append(title, pill(entry.type, "entry-type"), pill(entry.status, "entry-status"));
  const note = document.createElement("p");
  note.className = "entry-note";
  note.textContent = entry.note || entry.prompt || "No note yet.";
  const meta = document.createElement("div");
  meta.className = "entry-meta";
  meta.append(textSpan(new Date(entry.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })));
  const roll = sessionNameForEntry(entry); if (roll) meta.append(pill(`roll: ${roll}`, "condition-chip"));
  [entry.light, entry.weather, entry.terrain, entry.pace].filter(Boolean).forEach(value => meta.append(pill(value, "condition-chip")));
  splitTags(entry.tags).forEach(tag => meta.append(pill(`#${tag}`, "chip")));
  main.append(topline, note, meta, projectAssignmentControl(entry));
  if (!compact) {
    const actions = document.createElement("div");
    actions.className = "entry-actions grease-actions";
    actions.append(actionButton("Edit", "edit", entry.id), actionButton(entry.favorite ? "Uncircle" : "Circle", "favorite", entry.id), actionButton(entry.status === "Archived" ? "Restore" : "Archive", "archive", entry.id), actionButton("Delete", "delete", entry.id));
    main.append(actions);
  }
  card.append(main);
  if (entryHasImage(entry)) { const img = document.createElement("img"); img.className = "entry-thumb"; img.src = imageSrcFor(entry); img.alt = entry.title || "Trail Muse attachment"; card.append(img); }
  return card;
}

function renderStudioProjectOptions() {
  if (!els.studioProjectSelect) return;
  state.projects = normalizeProjects(state.projects, state.entries);
  const current = els.studioProjectSelect.value;
  els.studioProjectSelect.innerHTML = '<option value="">Choose a project</option>';
  state.projects.forEach(project => {
    const option = document.createElement("option"); option.value = project.id; option.textContent = project.name; els.studioProjectSelect.append(option);
  });
  els.studioProjectSelect.value = projectById(current) ? current : (state.projects[0]?.id || "");
}

function renderStudio() {
  renderStudioProjectOptions();
  const project = projectById(els.studioProjectSelect?.value);
  if (els.studioProjectSummary) {
    els.studioProjectSummary.innerHTML = project ? `<h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.description || "No project description yet.")}</p><small>${projectEntries(project).length} source capture${projectEntries(project).length === 1 ? "" : "s"}</small>` : '<p>Create projects and assign captures in the Journal first.</p>';
  }
  if (els.studioProjectCaptures) {
    els.studioProjectCaptures.innerHTML = "";
    if (!project) els.studioProjectCaptures.innerHTML = '<p class="entry-meta">No project selected.</p>';
    else projectEntries(project).forEach(entry => {
      const card = document.createElement("article"); card.className = "studio-source-card";
      card.innerHTML = `${entryHasImage(entry) ? `<img src="${imageSrcFor(entry)}" alt="">` : ""}<div><p class="eyebrow">${escapeHtml(entry.type)}</p><h4>${escapeHtml(entry.title || "Untitled capture")}</h4><p>${escapeHtml(entry.note || entry.prompt || "No note")}</p></div>`;
      els.studioProjectCaptures.append(card);
    });
  }
  renderArtifactList(project);
  if (els.artifactForm) Array.from(els.artifactForm.elements).forEach(control => { if (control.type !== "button" && control.type !== "submit" && control.type !== "hidden") control.disabled = !project; });
  renderArchiveHealth();
  renderDeckEditor();
}

function saveArtifactFromStudio(event) {
  event.preventDefault();
  const project = projectById(els.studioProjectSelect?.value);
  if (!project) return alert("Select a project first.");
  const title = els.artifactTitle.value.trim();
  if (!title) return els.artifactTitle.focus();
  const existing = (state.artifacts || []).find(item => item.id === els.artifactId.value);
  const record = {
    id: existing?.id || uid("artifact"), projectId: project.id, title,
    type: els.artifactType.value, status: els.artifactStatus.value,
    notes: els.artifactNotes.value.trim(), link: els.artifactLink.value.trim(),
    createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  state.artifacts = existing ? state.artifacts.map(item => item.id === record.id ? record : item) : [record, ...(state.artifacts || [])];
  saveState(); clearArtifactForm(); renderStudio(); flashSaved("Artifact saved");
}

function clearArtifactForm() {
  if (!els.artifactForm) return;
  els.artifactForm.reset(); if (els.artifactId) els.artifactId.value = "";
}

function renderArtifactList(project) {
  if (!els.artifactList) return;
  els.artifactList.innerHTML = "";
  const artifacts = project ? (state.artifacts || []).filter(item => item.projectId === project.id) : [];
  if (!artifacts.length) { els.artifactList.innerHTML = '<p class="entry-meta">No artifacts recorded for this project yet.</p>'; return; }
  artifacts.forEach(artifact => {
    const card = document.createElement("article"); card.className = "artifact-card";
    card.innerHTML = `<div><p class="eyebrow">${escapeHtml(artifact.type)} · ${escapeHtml(artifact.status)}</p><h4>${escapeHtml(artifact.title)}</h4><p>${escapeHtml(artifact.notes || "No notes.")}</p>${artifact.link ? `<p><strong>Location:</strong> ${escapeHtml(artifact.link)}</p>` : ""}</div><div class="entry-actions"><button data-artifact-action="edit" data-artifact-id="${artifact.id}" type="button">Edit</button><button data-artifact-action="delete" data-artifact-id="${artifact.id}" type="button">Delete</button></div>`;
    els.artifactList.append(card);
  });
}

function handleArtifactAction(event) {
  const button = event.target.closest("[data-artifact-action]"); if (!button) return;
  const artifact = (state.artifacts || []).find(item => item.id === button.dataset.artifactId); if (!artifact) return;
  if (button.dataset.artifactAction === "delete") { if (!confirm(`Delete artifact “${artifact.title}”?`)) return; state.artifacts = state.artifacts.filter(item => item.id !== artifact.id); saveState(); renderStudio(); }
  if (button.dataset.artifactAction === "edit") {
    els.artifactId.value = artifact.id; els.artifactTitle.value = artifact.title; els.artifactType.value = artifact.type; els.artifactStatus.value = artifact.status; els.artifactNotes.value = artifact.notes; els.artifactLink.value = artifact.link; els.artifactTitle.focus();
  }
}

function currentStudioProject() { return projectById(els.studioProjectSelect?.value); }
function projectExportPayload(project) { return { app: "FI-077 Trail Muse", version: APP_VERSION, exportedAt: new Date().toISOString(), project, entries: projectEntries(project), artifacts: (state.artifacts || []).filter(item => item.projectId === project.id) }; }
function exportCurrentProjectJson() { const project = currentStudioProject(); if (!project) return alert("Select a project first."); downloadText(`trail-muse-project-${slugify(project.name)}-${dateStamp()}.json`, JSON.stringify(projectExportPayload(project), null, 2), "application/json"); }
function exportCurrentProjectHtml() {
  const project = currentStudioProject(); if (!project) return alert("Select a project first.");
  const payload = projectExportPayload(project);
  const captures = payload.entries.map(entry => `<article><h2>${escapeHtml(entry.title || "Untitled capture")}</h2><p>${escapeHtml(entry.note || entry.prompt || "")}</p>${entryHasImage(entry) ? `<img src="${imageSrcFor(entry)}" alt="">` : ""}</article>`).join("");
  const artifacts = payload.artifacts.map(artifact => `<article><h2>${escapeHtml(artifact.title)}</h2><p><strong>${escapeHtml(artifact.type)} · ${escapeHtml(artifact.status)}</strong></p><p>${escapeHtml(artifact.notes || "")}</p></article>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(project.name)}</title><style>body{font-family:Georgia,serif;max-width:920px;margin:auto;padding:40px;background:#eee;color:#111}header,article{background:#fff;padding:24px;margin:0 0 20px;border:1px solid #aaa}img{max-width:100%;filter:grayscale(1)}small{letter-spacing:.1em;text-transform:uppercase}</style></head><body><header><small>Trail Muse Project</small><h1>${escapeHtml(project.name)}</h1><p>${escapeHtml(project.description || "")}</p></header><h2>Finished artifacts</h2>${artifacts || "<p>No artifacts recorded.</p>"}<h2>Source captures</h2>${captures || "<p>No captures assigned.</p>"}</body></html>`;
  downloadText(`trail-muse-project-${slugify(project.name)}-${dateStamp()}.html`, html, "text/html");
}

function renderAll() {
  state.projects = normalizeProjects(state.projects, state.entries);
  state.artifacts = normalizeArtifacts(state.artifacts);
  renderSaveIndicator(); renderPrompt(); renderPromptDeckOptions(); renderMiniStats(); renderJournalSessionFilter(); renderJournal(); renderStudio(); renderSessionPill(); renderTrailModeConsole(); renderDeckEditor();
}

function renderAnalytics() {
  if (!els.analyticsContent) return;
  populateAnalyticsSessionFilter();
  const selected = els.analyticsSessionFilter?.value || "all";
  const sessions = selected === "all" ? state.sessions.slice() : state.sessions.filter(session => session.id === selected);
  const entries = selected === "all" ? state.entries.slice() : state.entries.filter(entry => entry.sessionId === selected);
  const hasData = sessions.length > 0 || entries.length > 0;
  if (els.analyticsEmpty) els.analyticsEmpty.classList.toggle("active", !hasData);
  els.analyticsContent.hidden = !hasData;
  if (!hasData) return;

  const completed = sessions.filter(session => session.finishTimestamp || session.endedAt);
  const durationMs = sessions.reduce((sum, session) => sum + sessionDurationMs(session), 0);
  const assigned = entries.filter(entry => String(entry.project || "").trim()).length;
  const photos = entries.filter(entry => entryHasImage(entry) || entry.type === "Photography Note").length;
  const prompts = entries.filter(entry => entry.prompt || entry.promptText || entry.type === "Prompt Response").length;
  const avgPerHike = sessions.length ? entries.length / sessions.length : entries.length;
  const avgGap = averageCaptureGap(entries);

  els.analyticsSummary.innerHTML = [
    analyticsStat(entries.length, "Field entries", `${avgPerHike.toFixed(1)} per hike`),
    analyticsStat(sessions.length, "Hikes", `${completed.length} closed`),
    analyticsStat(formatDuration(durationMs), "Trail time", avgGap ? `${formatDuration(avgGap)} between notes` : "No interval yet"),
    analyticsStat(photos, "Photo traces", `${entries.length ? Math.round(photos / entries.length * 100) : 0}% of entries`),
    analyticsStat(`${entries.length ? Math.round(assigned / entries.length * 100) : 0}%`, "Project assigned", `${assigned} captures organized`)
  ].join("");

  renderAnalyticsBars(entries);
  renderAnalyticsConditions(sessions, entries);
  renderAnalyticsTimeline(entries, sessions);
  renderAnalyticsReadiness(entries, prompts);
  renderAnalyticsHikeTable(sessions);
}

function populateAnalyticsSessionFilter() {
  if (!els.analyticsSessionFilter) return;
  const current = els.analyticsSessionFilter.value || "all";
  els.analyticsSessionFilter.innerHTML = '<option value="all">All hikes</option>';
  state.sessions.slice().sort((a,b) => new Date(b.startedAt || b.startTimestamp || 0) - new Date(a.startedAt || a.startTimestamp || 0)).forEach(session => {
    const option = document.createElement("option");
    option.value = session.id;
    option.textContent = session.name || "Untitled hike";
    els.analyticsSessionFilter.append(option);
  });
  els.analyticsSessionFilter.value = [...els.analyticsSessionFilter.options].some(option => option.value === current) ? current : "all";
}

function analyticsStat(value, label, note) {
  return `<article class="analytics-stat"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span><small>${escapeHtml(note)}</small></article>`;
}

function renderAnalyticsBars(entries) {
  const counts = countValues(entries.map(entry => entry.type || "Field Note"));
  const sorted = [...counts.entries()].sort((a,b) => b[1]-a[1]);
  const max = sorted[0]?.[1] || 1;
  els.analyticsTypeChart.innerHTML = sorted.length ? sorted.map(([label,value]) => `<div class="analytics-bar-row"><span class="analytics-bar-label">${escapeHtml(label)}</span><span class="analytics-bar-track"><span class="analytics-bar-fill" style="width:${Math.max(3, value/max*100)}%"></span></span><span class="analytics-bar-value">${value}</span></div>`).join("") : '<p class="analytics-empty-note">No captures in this selection.</p>';
}

function renderAnalyticsConditions(sessions, entries) {
  const groups = [
    ["Weather", valuesFromSessionsAndEntries(sessions, entries, "weather")],
    ["Terrain", valuesFromSessionsAndEntries(sessions, entries, "terrain")],
    ["Light", valuesFromSessionsAndEntries(sessions, entries, "light")],
    ["Pace", valuesFromSessionsAndEntries(sessions, entries, "pace")]
  ];
  els.analyticsConditions.innerHTML = groups.map(([label, values]) => {
    const counts = [...countValues(values).entries()].sort((a,b)=>b[1]-a[1]).slice(0,6);
    return `<div class="analytics-condition-group"><strong>${label}</strong><div class="analytics-chips">${counts.length ? counts.map(([name,count])=>`<span class="analytics-chip">${escapeHtml(name)} <b>${count}</b></span>`).join("") : '<span class="analytics-chip">Not recorded</span>'}</div></div>`;
  }).join("");
}

function renderAnalyticsTimeline(entries, sessions) {
  const bins = Array(12).fill(0);
  if (entries.length) {
    const times = entries.map(entry => new Date(entry.capturedAt || entry.createdAt || 0).getTime()).filter(Number.isFinite);
    const sessionStart = sessions.length === 1 ? new Date(sessions[0].startTimestamp || sessions[0].startedAt || Math.min(...times)).getTime() : Math.min(...times);
    const sessionEnd = sessions.length === 1 ? new Date(sessions[0].finishTimestamp || sessions[0].endedAt || Math.max(...times)).getTime() : Math.max(...times);
    const span = Math.max(1, sessionEnd - sessionStart);
    times.forEach(time => bins[Math.min(11, Math.max(0, Math.floor((time-sessionStart)/span*12)))]++);
  }
  const max = Math.max(1,...bins);
  els.analyticsTimeline.innerHTML = bins.map((value,index)=>`<div class="analytics-time-column" title="${value} entries"><span class="analytics-time-bar" style="height:${Math.max(3,value/max*145)}px"></span><small>${index===0?'START':index===11?'END':index+1}</small></div>`).join("");
}

function renderAnalyticsReadiness(entries, prompts) {
  const assigned = entries.filter(entry => String(entry.project || "").trim()).length;
  const titled = entries.filter(entry => String(entry.title || "").trim()).length;
  const contextual = entries.filter(entry => entry.sessionId && (entry.weather || entry.terrain || entry.light || entry.pace)).length;
  const favorites = entries.filter(entry => entry.favorite).length;
  const rows = [
    ["Assigned to a project", assigned, entries.length],
    ["Titled captures", titled, entries.length],
    ["Hike context attached", contextual, entries.length],
    ["Prompt-led captures", prompts, entries.length],
    ["Circled / favorite", favorites, entries.length]
  ];
  els.analyticsReadiness.innerHTML = rows.map(([label,value,total])=>`<div class="readiness-row"><strong>${escapeHtml(label)}</strong><span>${value}/${total}</span></div>`).join("");
}

function renderAnalyticsHikeTable(sessions) {
  if (!sessions.length) { els.analyticsHikeTable.innerHTML='<p class="analytics-empty-note">No session records in this selection.</p>'; return; }
  const rows = sessions.slice().sort((a,b)=>new Date(b.startedAt||b.startTimestamp||0)-new Date(a.startedAt||a.startTimestamp||0)).map(session => {
    const entries = state.entries.filter(entry => entry.sessionId === session.id);
    const assigned = entries.filter(entry => entry.project).length;
    return `<tr><td>${escapeHtml(session.name || "Untitled hike")}</td><td>${escapeHtml(formatDateTime(session.startTimestamp || session.startedAt))}</td><td>${escapeHtml(formatDuration(sessionDurationMs(session)))}</td><td>${entries.length}</td><td>${escapeHtml(session.weather || "—")}</td><td>${escapeHtml(session.terrain || "—")}</td><td>${assigned}</td></tr>`;
  }).join("");
  els.analyticsHikeTable.innerHTML=`<table><thead><tr><th>Hike</th><th>Started</th><th>Duration</th><th>Entries</th><th>Weather</th><th>Terrain</th><th>In projects</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function sessionDurationMs(session) {
  const start = new Date(session.startTimestamp || session.startedAt || 0).getTime();
  const end = new Date(session.finishTimestamp || session.endedAt || Date.now()).getTime();
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? end-start : 0;
}
function averageCaptureGap(entries) {
  const times = entries.map(entry=>new Date(entry.capturedAt || entry.createdAt || 0).getTime()).filter(Number.isFinite).sort((a,b)=>a-b);
  if (times.length < 2) return 0;
  return times.slice(1).reduce((sum,time,index)=>sum+(time-times[index]),0)/(times.length-1);
}
function formatDuration(ms) {
  if (!ms || ms < 60000) return ms ? "<1 min" : "0 min";
  const minutes=Math.round(ms/60000), hours=Math.floor(minutes/60), remainder=minutes%60;
  return hours ? `${hours}h ${remainder}m` : `${minutes} min`;
}
function formatDateTime(value) {
  if (!value) return "—";
  const date=new Date(value); if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString([], {dateStyle:"medium", timeStyle:"short"});
}
function countValues(values) {
  const map=new Map(); values.filter(Boolean).forEach(value=>map.set(String(value), (map.get(String(value))||0)+1)); return map;
}
function valuesFromSessionsAndEntries(sessions, entries, key) {
  const sessionValues=sessions.map(session=>session[key]).filter(Boolean);
  const entryValues=entries.filter(entry=>!entry.sessionId || !sessions.some(session=>session.id===entry.sessionId)).map(entry=>entry[key]).filter(Boolean);
  return [...sessionValues,...entryValues];
}

function renderMiniStats() {
  if (!els.miniStats) return;
  const assigned = state.entries.filter(entry => entry.project).length;
  const artifacts = (state.artifacts || []).length;
  els.miniStats.innerHTML = "";
  [[state.entries.length, "captures"], [(state.projects || []).length, "projects"], [assigned, "assigned"], [artifacts, "artifacts"]]
    .forEach(([value, label]) => els.miniStats.append(statCard(value, label)));
}
