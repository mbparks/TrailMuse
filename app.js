const APP_VERSION = "FI-077 Trail Muse v2.0";
const STORAGE_KEY = "fi077_trail_muse_state_v1";
const DRAFT_KEY = "fi077_trail_muse_entry_draft_v1";

const entryTypes = [
  "Prompt Response",
  "Sensory Note",
  "Drawing Note",
  "Photography Note",
  "Writing Note",
  "Found Object",
  "Trail Thought",
  "Small Discovery",
  "Make Later"
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

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  hydrateStaticControls();
  bindEvents();
  applyTheme();
  renderCaptureGrid();
  renderAll();
});

function cacheElements() {
  Object.assign(els, {
    navList: document.getElementById("navList"),
    bottomNav: document.querySelector(".bottom-nav"),
    saveIndicator: document.getElementById("saveIndicator"),
    themeToggle: document.getElementById("themeToggle"),
    sunlightToggle: document.getElementById("sunlightToggle"),
    sunlightToggleRail: document.getElementById("sunlightToggleRail"),
    newEntryTop: document.getElementById("newEntryTop"),
    promptDeck: document.getElementById("promptDeck"),
    promptOutput: document.getElementById("promptOutput"),
    promptResponse: document.getElementById("promptResponse"),
    askMuse: document.getElementById("askMuse"),
    savePromptEntry: document.getElementById("savePromptEntry"),
    openDeckStudio: document.getElementById("openDeckStudio"),
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
    searchBox: document.getElementById("searchBox"),
    typeFilter: document.getElementById("typeFilter"),
    statusFilter: document.getElementById("statusFilter"),
    sessionFilter: document.getElementById("sessionFilter"),
    layoutList: document.getElementById("layoutList"),
    layoutContact: document.getElementById("layoutContact"),
    followupEngine: document.getElementById("followupEngine"),
    laterBoard: document.getElementById("laterBoard"),
    studioCommandCenter: document.getElementById("studioCommandCenter"),
    studioWorkflow: document.getElementById("studioWorkflow"),
    seriesBuilder: document.getElementById("seriesBuilder"),
    archiveHealth: document.getElementById("archiveHealth"),
    dashboardGrid: document.getElementById("dashboardGrid"),
    studioSessionFilter: document.getElementById("studioSessionFilter"),
    studioMediumFilter: document.getElementById("studioMediumFilter"),
    studioStatusFilter: document.getElementById("studioStatusFilter"),
    bestSparksSummary: document.getElementById("bestSparksSummary"),
    studioContactSheet: document.getElementById("studioContactSheet"),
    specimenGallery: document.getElementById("specimenGallery"),
    projectGallery: document.getElementById("projectGallery"),
    tagCloud: document.getElementById("tagCloud"),
    activeSessionConsole: document.getElementById("activeSessionConsole"),
    sessionArchive: document.getElementById("sessionArchive"),
    currentSessionPill: document.getElementById("currentSessionPill"),
    sessionName: document.getElementById("sessionName"),
    sessionIntent: document.getElementById("sessionIntent"),
    sessionFocus: document.getElementById("sessionFocus"),
    sessionCompanions: document.getElementById("sessionCompanions"),
    sessionNotes: document.getElementById("sessionNotes"),
    sessionLight: document.getElementById("sessionLight"),
    sessionWeather: document.getElementById("sessionWeather"),
    sessionTerrain: document.getElementById("sessionTerrain"),
    sessionPace: document.getElementById("sessionPace"),
    startSession: document.getElementById("startSession"),
    closeSession: document.getElementById("closeSession"),
    exportJson: document.getElementById("exportJson"),
    importJson: document.getElementById("importJson"),
    exportHtml: document.getElementById("exportHtml"),
    exportContactSheet: document.getElementById("exportContactSheet"),
    exportZine: document.getElementById("exportZine"),
    exportGallery: document.getElementById("exportGallery"),
    exportHarvest: document.getElementById("exportHarvest"),
    exportMarkdown: document.getElementById("exportMarkdown"),
    exportActiveSession: document.getElementById("exportActiveSession"),
    exportSpecimens: document.getElementById("exportSpecimens"),
    exportProjects: document.getElementById("exportProjects"),
    exportCsv: document.getElementById("exportCsv"),
    printJournal: document.getElementById("printJournal"),
    loadDemo: document.getElementById("loadDemo"),
    clearDemo: document.getElementById("clearDemo"),
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

  els.themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    saveState();
    applyTheme();
  });

  [els.sunlightToggle, els.sunlightToggleRail].filter(Boolean).forEach(button => {
    button.addEventListener("click", () => {
      state.sunlightMode = !state.sunlightMode;
      saveState();
      applyTheme();
    });
  });

  els.newEntryTop.addEventListener("click", () => openEntryDialog(quickCaptureSeed("Trail Thought")));
  els.openFullCapture.addEventListener("click", () => openEntryDialog({ type: "Trail Thought" }));

  document.querySelectorAll("[data-one-tap]").forEach(button => {
    button.addEventListener("click", () => openEntryDialog(quickCaptureSeed(button.dataset.oneTap)));
  });
  els.askMuse.addEventListener("click", askMuse);
  els.savePromptEntry.addEventListener("click", savePromptResponse);
  if (els.openDeckStudio) els.openDeckStudio.addEventListener("click", () => {
    setView("studio");
    if (els.deckEditorPanel) els.deckEditorPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  bindDeckEditorEvents();

  els.quickPanel.addEventListener("click", event => {
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

  [els.studioSessionFilter, els.studioMediumFilter, els.studioStatusFilter].filter(Boolean).forEach(control => {
    control.addEventListener("change", renderStudioReview);
  });

  els.entryForm.addEventListener("submit", event => {
    event.preventDefault();
    saveEntryFromDialog(false);
  });

  els.saveAndNew.addEventListener("click", () => saveEntryFromDialog(true));
  els.saveAndWalk.addEventListener("click", () => saveEntryFromDialog(false, "walk"));
  els.closeDialog.addEventListener("click", closeDialog);
  els.entryForm.addEventListener("input", scheduleDraftSave);
  els.entryForm.addEventListener("change", scheduleDraftSave);
  els.entryType.addEventListener("change", () => {
    updateSpecimenFieldsVisibility();
    if (els.entryType.value === "Found Object" && !els.entryAction.value) els.entryAction.value = "Make a specimen card";
  });
  els.recoverDraft.addEventListener("click", recoverDraftIntoDialog);
  els.discardDraft.addEventListener("click", discardDraft);
  els.deleteEntry.addEventListener("click", deleteCurrentEntry);
  els.entryImage.addEventListener("change", handleImageSelection);
  els.removeImage.addEventListener("click", () => {
    pendingImageData = "";
    els.entryImage.value = "";
    updateImagePreview();
    scheduleDraftSave();
  });

  els.journalList.addEventListener("click", handleEntryAction);
  els.laterBoard.addEventListener("click", handleEntryAction);
  if (els.followupEngine) els.followupEngine.addEventListener("click", handleEntryAction);
  if (els.studioContactSheet) els.studioContactSheet.addEventListener("click", handleEntryAction);
  if (els.bestSparksSummary) els.bestSparksSummary.addEventListener("click", handleEntryAction);
  if (els.specimenGallery) els.specimenGallery.addEventListener("click", handleEntryAction);
  if (els.projectGallery) els.projectGallery.addEventListener("click", handleEntryAction);
  if (els.seriesBuilder) els.seriesBuilder.addEventListener("click", handleEntryAction);
  if (els.studioCommandCenter) els.studioCommandCenter.addEventListener("click", handleStudioCommand);
  if (els.studioWorkflow) els.studioWorkflow.addEventListener("click", handleStudioCommand);
  if (els.archiveHealth) els.archiveHealth.addEventListener("click", handleStudioCommand);

  els.startSession.addEventListener("click", startSession);
  els.closeSession.addEventListener("click", closeCurrentSession);
  if (els.sessionArchive) els.sessionArchive.addEventListener("click", handleSessionAction);
  if (els.activeSessionConsole) els.activeSessionConsole.addEventListener("click", handleSessionAction);

  els.exportJson.addEventListener("click", exportJson);
  els.importJson.addEventListener("change", importJson);
  els.exportHtml.addEventListener("click", exportHtml);
  if (els.exportContactSheet) els.exportContactSheet.addEventListener("click", exportContactSheet);
  if (els.exportZine) els.exportZine.addEventListener("click", exportZineSheet);
  if (els.exportGallery) els.exportGallery.addEventListener("click", exportHtmlGallery);
  if (els.exportHarvest) els.exportHarvest.addEventListener("click", exportCreativeHarvestReport);
  if (els.exportMarkdown) els.exportMarkdown.addEventListener("click", exportMarkdownArchive);
  if (els.exportActiveSession) els.exportActiveSession.addEventListener("click", () => {
    if (!state.currentSessionId) {
      alert("There is no active trail session to export.");
      return;
    }
    exportSessionHtml(state.currentSessionId);
  });
  if (els.exportSpecimens) els.exportSpecimens.addEventListener("click", exportSpecimenCards);
  if (els.exportProjects) els.exportProjects.addEventListener("click", exportMakeLaterPlan);
  els.exportCsv.addEventListener("click", exportCsv);
  els.printJournal.addEventListener("click", () => window.print());
  els.loadDemo.addEventListener("click", loadSampleTrail);
  els.clearDemo.addEventListener("click", clearAllData);
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
      customDecks: normalizeCustomDecks(parsed.customDecks),
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
    finishedNote: entry.finishedNote || ""
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
    startedAt: session.startedAt || new Date().toISOString(),
    endedAt: session.endedAt || null
  };
}

function saveState() {
  state.lastSaved = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderSaveIndicator();
}

function renderSaveIndicator() {
  if (!els.saveIndicator) return;
  const saved = state.lastSaved ? new Date(state.lastSaved).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Saved";
  els.saveIndicator.textContent = `Saved ${saved}`;
}

function applyTheme() {
  document.body.classList.toggle("dark", state.theme === "dark");
  document.body.classList.toggle("sunlight", Boolean(state.sunlightMode));
  els.themeToggle.textContent = state.theme === "dark" ? "☀" : "☾";
  if (els.sunlightToggle) els.sunlightToggle.classList.toggle("active", Boolean(state.sunlightMode));
  if (els.sunlightToggleRail) {
    els.sunlightToggleRail.classList.toggle("active", Boolean(state.sunlightMode));
    els.sunlightToggleRail.textContent = state.sunlightMode ? "Sunlight mode on" : "Sunlight mode";
  }
}

function setView(viewName) {
  document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
  const next = document.getElementById(`view-${viewName}`);
  if (next) next.classList.add("active");

  document.querySelectorAll("[data-view]").forEach(button => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  if (viewName === "journal") renderJournal();
  if (viewName === "later") renderLaterBoard();
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
  pendingImageData = seed.image || "";
  els.entryForm.reset();
  const session = getCurrentSession();
  els.entryId.value = seed.id || "";
  els.entryType.value = seed.type || "Trail Thought";
  els.entryStatus.value = normalizeStatus(seed.status || "Raw Capture");
  els.entryTitle.value = seed.title || suggestedTitle(seed.type || "Trail Thought");
  els.entryLocation.value = seed.location || session?.name || "";
  els.entryPrompt.value = seed.prompt || "";
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

function saveEntryFromDialog(keepOpen, mode = "standard") {
  const id = els.entryId.value;
  const now = new Date().toISOString();
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
    image: pendingImageData,
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
    if (mode === "walk") setView("capture");
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

function renderAll() {
  renderSaveIndicator();
  renderPrompt();
  renderPromptDeckOptions();
  renderMiniStats();
  renderJournalSessionFilter();
  renderJournal();
  renderLaterBoard();
  renderStudio();
  renderSessionPill();
  renderSessionArchive();
  renderDeckEditor();
}

function renderMiniStats() {
  const entries = state.entries;
  const made = entries.filter(entry => entry.status === "Finished").length;
  const later = entries.filter(entry => entry.action && entry.status !== "Archived").length;
  const photos = entries.filter(entry => entry.image).length;
  const favorites = entries.filter(entry => entry.favorite).length;

  els.miniStats.innerHTML = "";
  [
    [entries.length, "exposures"],
    [later, "darkroom queue"],
    [photos, "contact prints"],
    [made, "made"]
  ].forEach(([value, label]) => els.miniStats.append(statCard(value, label)));

  if (favorites > 0) {
    els.miniStats.append(statCard(favorites, "favorites"));
  }
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
  const images = entries.filter(entry => entry.image);
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

function renderSessionArchive() {
  if (!els.activeSessionConsole || !els.sessionArchive) return;
  renderActiveSessionConsole();
  els.sessionArchive.innerHTML = "";

  const heading = document.createElement("div");
  heading.className = "session-archive-head";
  heading.innerHTML = `<h4>Exposure roll archive</h4><span>${state.sessions.length} roll${state.sessions.length === 1 ? "" : "s"}</span>`;
  els.sessionArchive.append(heading);

  if (state.sessions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "entry-meta";
    empty.textContent = "Start a session before a walk to collect notes into a named roll.";
    els.sessionArchive.append(empty);
    return;
  }

  state.sessions
    .slice()
    .sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0))
    .forEach(session => els.sessionArchive.append(sessionArchiveCard(session)));
}

function renderActiveSessionConsole() {
  els.activeSessionConsole.innerHTML = "";
  const session = getCurrentSession();
  if (!session) {
    els.activeSessionConsole.innerHTML = `
      <div class="active-session-empty">
        <h4>No active exposure roll</h4>
        <p>Start a Trail Session before you walk. New captures will inherit the roll name, creative focus, light, weather, terrain, and pace.</p>
      </div>`;
    return;
  }

  const stats = sessionStats(session);
  const card = document.createElement("article");
  card.className = "active-session-card";
  const conditions = [session.light, session.weather, session.terrain, session.pace].filter(Boolean);
  const details = [session.intent, session.focus, session.companions ? `with ${session.companions}` : ""].filter(Boolean);
  card.innerHTML = `
    <div>
      <p class="eyebrow">Active exposure roll</p>
      <h4>${escapeHtml(session.name || "Untitled exposure roll")}</h4>
      <p>${escapeHtml(details.join(" · ") || "No intention noted yet.")}</p>
      ${session.notes ? `<p class="session-notes">${escapeHtml(session.notes)}</p>` : ""}
      <div class="entry-meta session-chip-line">
        ${conditions.map(value => `<span>${escapeHtml(value)}</span>`).join("")}
        <span>${escapeHtml(sessionDuration(session))}</span>
      </div>
    </div>
    <div class="session-stat-stack">
      <strong>${stats.entries.length}</strong><span>exposures</span>
      <strong>${stats.queue.length}</strong><span>queued</span>
      <strong>${stats.favorites.length}</strong><span>circled</span>
    </div>
    <div class="session-actions">
      <button class="secondary compact" data-session-action="review" data-session-id="${session.id}" type="button">Review roll</button>
      <button class="secondary compact" data-session-action="export" data-session-id="${session.id}" type="button">Export roll</button>
      <button class="secondary compact" data-session-action="close" data-session-id="${session.id}" type="button">Close roll</button>
    </div>`;
  els.activeSessionConsole.append(card);
}

function sessionArchiveCard(session) {
  const stats = sessionStats(session);
  const card = document.createElement("article");
  card.className = `session-card ${session.id === state.currentSessionId ? "active-roll" : ""}`;
  const best = stats.best ? `${stats.best.title || "Untitled exposure"} · ${strongestReason(stats.best)}` : "No exposures captured yet.";
  const status = session.endedAt ? "Closed" : "Active";
  const conditions = [session.light, session.weather, session.terrain, session.pace].filter(Boolean);
  card.innerHTML = `
    <div class="session-card-main">
      <div>
        <p class="eyebrow">${escapeHtml(status)} roll · ${escapeHtml(formatDate(session.startedAt))}</p>
        <h4>${escapeHtml(session.name || "Untitled exposure roll")}</h4>
        <p>${escapeHtml([session.intent, session.focus, session.companions ? `with ${session.companions}` : ""].filter(Boolean).join(" · ") || "No session intention noted.")}</p>
        ${session.notes ? `<p class="session-notes">${escapeHtml(session.notes)}</p>` : ""}
        <div class="entry-meta session-chip-line">
          ${conditions.map(value => `<span>${escapeHtml(value)}</span>`).join("")}
          <span>${escapeHtml(sessionDuration(session))}</span>
          <span>${stats.entries.length} exposures</span>
          <span>${stats.queue.length} queued</span>
          <span>${stats.finished.length} finished</span>
        </div>
        <p class="session-best"><strong>Best spark:</strong> ${escapeHtml(best)}</p>
      </div>
    </div>
    <div class="session-actions">
      <button class="secondary compact" data-session-action="review" data-session-id="${session.id}" type="button">Review</button>
      <button class="secondary compact" data-session-action="export" data-session-id="${session.id}" type="button">Export</button>
      ${session.id === state.currentSessionId ? `<button class="secondary compact" data-session-action="close" data-session-id="${session.id}" type="button">Close</button>` : `<button class="secondary compact" data-session-action="resume" data-session-id="${session.id}" type="button">Resume</button>`}
      <button class="secondary compact" data-session-action="filter" data-session-id="${session.id}" type="button">Journal</button>
      <button class="danger compact" data-session-action="delete" data-session-id="${session.id}" type="button">Delete roll</button>
    </div>`;
  return card;
}

function handleSessionAction(event) {
  const button = event.target.closest("[data-session-action]");
  if (!button) return;
  const id = button.dataset.sessionId;
  const action = button.dataset.sessionAction;
  const session = state.sessions.find(item => item.id === id);
  if (!session) return;

  if (action === "resume") {
    state.sessions = state.sessions.map(item => {
      if (item.id === id) return { ...item, endedAt: null };
      if (item.id === state.currentSessionId) return { ...item, endedAt: item.endedAt || new Date().toISOString() };
      return item;
    });
    state.currentSessionId = id;
    saveState();
    renderAll();
    flashSaved("Exposure roll resumed");
  }

  if (action === "close") {
    state.sessions = state.sessions.map(item => item.id === id ? { ...item, endedAt: new Date().toISOString() } : item);
    if (state.currentSessionId === id) state.currentSessionId = null;
    saveState();
    renderAll();
    flashSaved("Exposure roll closed");
  }

  if (action === "review") {
    setView("studio");
    if (els.studioSessionFilter) {
      els.studioSessionFilter.value = id;
      renderStudioReview();
    }
  }

  if (action === "filter") {
    setView("journal");
    if (els.sessionFilter) {
      renderJournalSessionFilter();
      els.sessionFilter.value = id;
      renderJournal();
    }
  }

  if (action === "export") exportSessionHtml(id);

  if (action === "delete") {
    const ok = confirm(`Delete the exposure roll “${session.name || "Untitled"}”? Its entries will stay in the journal but will no longer be tied to this roll.`);
    if (!ok) return;
    state.sessions = state.sessions.filter(item => item.id !== id);
    state.entries = state.entries.map(entry => entry.sessionId === id ? { ...entry, sessionId: null, updatedAt: new Date().toISOString() } : entry);
    if (state.currentSessionId === id) state.currentSessionId = null;
    saveState();
    renderAll();
    flashSaved("Exposure roll deleted; entries kept");
  }
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

function renderJournal() {
  if (!els.journalList) return;
  const entries = getFilteredEntries();
  els.journalList.innerHTML = "";
  renderJournalLayoutControls();
  const useContactSheet = state.journalLayout !== "list";
  els.journalList.classList.toggle("contact-sheet-grid", useContactSheet);
  els.emptyJournal.classList.toggle("active", entries.length === 0);
  entries.forEach(entry => els.journalList.append(entryCard(entry, useContactSheet)));
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
  const type = pill(entry.type, "entry-type");
  const status = pill(entry.status, "entry-status");
  topline.append(title, type, status);
  if (entry.action) topline.append(pill(entry.action, "entry-action"));

  const prompt = document.createElement("p");
  prompt.className = "entry-prompt";
  prompt.textContent = entry.prompt || "";
  prompt.hidden = !entry.prompt;

  const note = document.createElement("p");
  note.className = "entry-note";
  note.textContent = entry.note || "No note yet.";

  const meta = document.createElement("div");
  meta.className = "entry-meta";
  const date = new Date(entry.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  meta.append(textSpan(date));
  if (entry.location) meta.append(textSpan(entry.location));
  const rollName = sessionNameForEntry(entry);
  if (rollName && rollName !== entry.location) meta.append(pill(`roll: ${rollName}`, "condition-chip"));
  if (entry.mood) meta.append(textSpan(entry.mood));
  [entry.light, entry.weather, entry.terrain, entry.pace].filter(Boolean).forEach(condition => meta.append(pill(condition, "condition-chip")));
  if (entry.action) meta.append(pill(`priority: ${entry.priority || "Normal"}`, "condition-chip"));
  if (entry.action) meta.append(pill(`energy: ${entry.energy || "One sitting"}`, "condition-chip"));
  if (entry.project) meta.append(pill(`project: ${entry.project}`, "condition-chip"));
  if (entry.due) meta.append(pill(dueLabel(entry.due), "condition-chip"));
  splitTags(entry.tags).forEach(tag => meta.append(pill(`#${tag}`, "chip")));

  const actions = document.createElement("div");
  actions.className = "entry-actions grease-actions";
  actions.append(
    actionButton("Edit", "edit", entry.id),
    ...(isSpecimenEntry(entry) ? [actionButton("Specimen", "specimen", entry.id)] : []),
    actionButton(entry.favorite ? "Uncircle" : "Circle", "favorite", entry.id),
    actionButton("Develop", "develop", entry.id),
    actionButton("Make project", "project", entry.id),
    actionButton("Finished", "finish-work", entry.id),
    actionButton("Reject", "reject", entry.id),
    actionButton(entry.status === "Archived" ? "Restore" : "Archive", "archive", entry.id),
    actionButton("Delete", "delete", entry.id)
  );

  main.append(topline, prompt, note);
  const specimen = specimenBlock(entry);
  if (specimen && !compact) main.append(specimen);
  main.append(meta);
  if (!compact) main.append(actions);
  card.append(main);

  if (entry.image) {
    const img = document.createElement("img");
    img.className = "entry-thumb";
    img.src = entry.image;
    img.alt = entry.title || "Trail Muse attachment";
    card.append(img);
  }

  return card;
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

function specimenTitle(entry = {}) {
  return entry.specimenName || entry.title || "Unnamed field specimen";
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

function specimenBlock(entry = {}) {
  if (!isSpecimenEntry(entry)) return null;
  const block = document.createElement("div");
  block.className = "specimen-block";
  const heading = document.createElement("div");
  heading.className = "specimen-block-head";
  heading.innerHTML = `<span>Specimen card</span><strong>${escapeHtml(specimenTitle(entry))}</strong>`;
  block.append(heading);

  const details = document.createElement("dl");
  specimenDetailPairs(entry).forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    details.append(dt, dd);
  });
  if (details.childNodes.length) block.append(details);

  const ethics = document.createElement("p");
  ethics.className = "specimen-ethics-note";
  ethics.textContent = entry.specimenLeftInPlace ? "Found, observed, and left in place." : "Handling not marked. Confirm collecting was appropriate before removing natural material.";
  block.append(ethics);
  return block;
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

function renderFollowupEngine() {
  if (!els.followupEngine) return;
  const queue = state.entries
    .map(normalizeEntryForV13)
    .filter(entry => entry.action && entry.status !== "Archived");
  const unfinished = queue.filter(entry => entry.status !== "Finished");
  const quickWins = unfinished.filter(entry => entry.energy === "Tiny edit");
  const highPriority = unfinished.filter(entry => ["High", "Critical"].includes(entry.priority));
  const projects = groupByProject(queue);
  const focus = unfinished.slice().sort((a, b) => followupScore(b) - followupScore(a))[0];

  els.followupEngine.innerHTML = "";
  const stats = document.createElement("div");
  stats.className = "followup-stats";
  [
    [queue.length, "queued sparks"],
    [unfinished.length, "open follow-ups"],
    [quickWins.length, "tiny edits"],
    [highPriority.length, "high contrast priorities"],
    [projects.length, "active projects"]
  ].forEach(([value, label]) => stats.append(statCard(value, label)));

  const focusCard = document.createElement("article");
  focusCard.className = "followup-focus-card";
  if (!focus) {
    focusCard.innerHTML = '<p class="eyebrow">Next print</p><h3>No open follow-ups yet.</h3><p>Send an exposure to Make Later or add a make-later action while capturing a field note.</p>';
  } else {
    focusCard.dataset.id = focus.id;
    const next = nextStepForEntry(focus);
    const due = dueLabel(focus.due);
    focusCard.innerHTML = `
      <p class="eyebrow">Next print on the bench</p>
      <h3>${escapeHtml(focus.title || "Untitled exposure")}</h3>
      <p>${escapeHtml(next)}</p>
      <div class="followup-chip-row">
        ${followupPillsHtml(focus)}
        ${due ? `<span class="condition-chip">${escapeHtml(due)}</span>` : ""}
      </div>
    `;
    const actions = document.createElement("div");
    actions.className = "entry-actions grease-actions";
    actions.append(
      actionButton("Edit", "edit", focus.id),
      actionButton("Make project", "project", focus.id),
      actionButton("Mark finished", "finish-work", focus.id)
    );
    focusCard.append(actions);
  }

  const projectStrip = document.createElement("div");
  projectStrip.className = "project-strip";
  if (projects.length) {
    projects.slice(0, 6).forEach(project => {
      const item = document.createElement("div");
      item.className = "project-strip-card";
      item.innerHTML = `<strong>${escapeHtml(project.name)}</strong><span>${project.items.length} exposure${project.items.length === 1 ? "" : "s"}</span>`;
      projectStrip.append(item);
    });
  } else {
    projectStrip.innerHTML = '<p class="entry-meta">No named projects yet. Use “Make project” on a queue card to group related exposures.</p>';
  }

  els.followupEngine.append(stats, focusCard, projectStrip);
}

function followupPillsHtml(entry) {
  return [
    entry.action,
    `priority: ${entry.priority || "Normal"}`,
    `energy: ${entry.energy || "One sitting"}`,
    entry.project ? `project: ${entry.project}` : ""
  ].filter(Boolean).map(value => `<span class="entry-action">${escapeHtml(value)}</span>`).join("");
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

function renderProjectGallery() {
  if (!els.projectGallery) return;
  const queue = state.entries
    .map(normalizeEntryForV13)
    .filter(entry => entry.action && entry.status !== "Archived");
  const groups = groupByProject(queue);
  els.projectGallery.innerHTML = "";
  if (!groups.length) {
    const empty = document.createElement("p");
    empty.className = "entry-meta";
    empty.textContent = "No creative projects yet. Add make-later actions or group exposures into a named project from the Later board.";
    els.projectGallery.append(empty);
    return;
  }

  groups.slice(0, 8).forEach(group => {
    const card = document.createElement("article");
    card.className = "project-card";
    const open = group.items.filter(entry => entry.status !== "Finished").length;
    const done = group.items.filter(entry => entry.status === "Finished").length;
    const next = group.items.find(entry => entry.status !== "Finished") || group.items[0];
    card.innerHTML = `
      <p class="eyebrow">Creative project</p>
      <h4>${escapeHtml(group.name)}</h4>
      <p>${group.items.length} exposure${group.items.length === 1 ? "" : "s"} · ${open} open · ${done} finished</p>
      <p><strong>Next:</strong> ${escapeHtml(nextStepForEntry(next))}</p>
      <div class="followup-chip-row">${followupPillsHtml(next)}</div>
    `;
    const actions = document.createElement("div");
    actions.className = "entry-actions grease-actions";
    actions.append(actionButton("Edit next", "edit", next.id), actionButton("Finish next", "finish-work", next.id));
    card.append(actions);
    els.projectGallery.append(card);
  });
}

function renderLaterBoard() {
  renderFollowupEngine();
  if (!els.laterBoard) return;
  els.laterBoard.innerHTML = "";
  const queueEntries = state.entries.filter(entry => entry.action && entry.status !== "Archived");

  laterColumns.forEach(column => {
    const section = document.createElement("section");
    section.className = "kanban-column";
    const heading = document.createElement("h3");
    const count = queueEntries.filter(entry => entry.status === column).length;
    heading.textContent = `${column} · ${count}`;
    section.append(heading);

    const columnEntries = queueEntries.filter(entry => entry.status === column);
    if (columnEntries.length === 0) {
      const empty = document.createElement("p");
      empty.className = "entry-meta";
      empty.textContent = "No exposures here yet.";
      section.append(empty);
    }

    columnEntries
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .forEach(entry => section.append(laterCard(entry)));

    els.laterBoard.append(section);
  });
}

function laterCard(entry) {
  const card = document.createElement("article");
  card.className = "later-card";
  card.dataset.id = entry.id;

  const title = document.createElement("h4");
  title.textContent = entry.title;
  const type = pill(entry.type, "entry-type");
  const action = pill(entry.action, "entry-action");
  const note = document.createElement("p");
  note.textContent = entry.note || entry.prompt || "No note yet.";

  const nextStep = document.createElement("div");
  nextStep.className = "next-step-box";
  nextStep.innerHTML = `<span>Next studio action</span><strong>${escapeHtml(nextStepForEntry(entry))}</strong>`;

  const conditions = document.createElement("div");
  conditions.className = "entry-meta";
  [entry.location, entry.light, entry.weather, entry.terrain, entry.pace].filter(Boolean).forEach(value => conditions.append(textSpan(value)));
  conditions.append(pill(`priority: ${entry.priority || "Normal"}`, "condition-chip"));
  conditions.append(pill(`energy: ${entry.energy || "One sitting"}`, "condition-chip"));
  if (entry.project) conditions.append(pill(`project: ${entry.project}`, "condition-chip"));
  const due = dueLabel(entry.due);
  if (due) conditions.append(pill(due, "condition-chip"));
  if (entry.finishedNote) conditions.append(pill("finished note", "condition-chip"));

  const actions = document.createElement("div");
  actions.className = "entry-actions";
  const nextStatus = nextLaterStatus(entry.status);
  actions.append(
    actionButton("Edit", "edit", entry.id),
    actionButton("Suggest step", "suggest-step", entry.id),
    actionButton("Make project", "project", entry.id),
    statusButton(nextStatus === entry.status ? "Hold here" : `Move to ${nextStatus}`, entry.id, nextStatus),
    actionButton("Mark finished", "finish-work", entry.id)
  );

  card.append(title, type, action, note, nextStep);
  if (conditions.childNodes.length) card.append(conditions);
  card.append(actions);
  return card;
}

function nextLaterStatus(status) {
  const index = laterColumns.indexOf(status);
  if (index < 0) return "Develop Further";
  return laterColumns[Math.min(index + 1, laterColumns.length - 1)];
}

function statusButton(label, id, status) {
  const button = actionButton(label, "status", id);
  button.dataset.status = status;
  return button;
}

function renderStudio() {
  if (!els.dashboardGrid) return;
  const entries = state.entries;
  const active = entries.filter(entry => entry.status !== "Archived");
  const queue = active.filter(entry => entry.action);
  const made = entries.filter(entry => entry.status === "Finished");
  const sessions = state.sessions.length;
  const favorites = entries.filter(entry => entry.favorite).length;
  const images = entries.filter(entry => entry.image).length;

  els.dashboardGrid.innerHTML = "";
  [
    [entries.length, "total exposures"],
    [active.length, "active negatives"],
    [queue.length, "darkroom queue"],
    [made.length, "finished prints"],
    [new Set(queue.map(entry => entry.project).filter(Boolean)).size, "creative projects"],
    [queue.filter(entry => entry.energy === "Tiny edit" && entry.status !== "Finished").length, "tiny edits"],
    [favorites, "starred"],
    [images, "contact prints"],
    [sessions, "exposure rolls"],
    [entries.filter(isSpecimenEntry).length, "specimen cards"],
    [entries.filter(entry => entry.specimenLeftInPlace).length, "found not taken"],
    [entries.filter(entry => entry.light || entry.weather || entry.terrain || entry.pace).length, "conditioned notes"],
    [countUniqueTags(), "recurring tones"]
  ].forEach(([value, label]) => els.dashboardGrid.append(statCard(value, label)));

  renderStudioCommandCenter();
  renderStudioWorkflow();
  renderSeriesBuilder();
  renderArchiveHealth();
  renderTagCloud();
  renderStudioReviewControls();
  renderStudioReview();
  renderSpecimenGallery();
  renderProjectGallery();
  renderDeckEditor();
  renderSessionPill();
  renderSessionArchive();
}


function renderStudioCommandCenter() {
  if (!els.studioCommandCenter) return;
  const entries = state.entries;
  const activeSession = getCurrentSession();
  const openQueue = entries.filter(entry => entry.action && !["Finished", "Archived"].includes(entry.status));
  const top = entries.slice().sort((a, b) => reviewScore(b) - reviewScore(a))[0];
  const backupLabel = state.lastBackupAt ? formatRelativeAge(state.lastBackupAt) : "not backed up yet";
  const sessionLabel = activeSession ? activeSession.name : `${state.sessions.length} roll${state.sessions.length === 1 ? "" : "s"} archived`;
  const topLabel = top ? (top.title || "Untitled exposure") : "no exposure selected";

  els.studioCommandCenter.innerHTML = `
    <div class="command-hero">
      <p class="eyebrow">Trail Muse Studio v2.0</p>
      <h3>Mobile field notes become a desktop darkroom.</h3>
      <p>Use this command surface after a walk: review the contact sheet, build a series, finish a project, export a journal, and back up the archive before the next roll.</p>
    </div>
    <div class="command-grid">
      ${studioCommandTile("Active roll", sessionLabel, activeSession ? "Keep capturing or close the session when the walk is finished." : "Start a new roll before the next walk.", activeSession ? "session" : "capture", activeSession ? "Review roll" : "Start capture")}
      ${studioCommandTile("Best spark", topLabel, top ? strongestReason(top) : "Collect a prompt response, thought, photograph, specimen, or discovery first.", top ? "review" : "capture", top ? "Open review" : "Capture")}
      ${studioCommandTile("Make-later queue", `${openQueue.length} open item${openQueue.length === 1 ? "" : "s"}`, nextQueueSummary(openQueue), "later", "Develop queue")}
      ${studioCommandTile("Archive backup", backupLabel, "Export JSON after meaningful field sessions so the local archive can be restored or moved to another device.", "backup", "Export backup")}
    </div>`;
}

function studioCommandTile(kicker, title, note, command, label) {
  return `<article class="command-tile">
    <p class="eyebrow">${escapeHtml(kicker)}</p>
    <h4>${escapeHtml(title)}</h4>
    <p>${escapeHtml(note)}</p>
    <button class="secondary compact" data-studio-command="${escapeHtml(command)}" type="button">${escapeHtml(label)}</button>
  </article>`;
}

function nextQueueSummary(queue) {
  if (!queue.length) return "No open follow-up work. Circle a spark or send something to Make Later.";
  const tiny = queue.filter(entry => entry.energy === "Tiny edit").length;
  const critical = queue.filter(entry => entry.priority === "Critical").length;
  const projects = new Set(queue.map(entry => entry.project).filter(Boolean)).size;
  const parts = [];
  if (critical) parts.push(`${critical} critical`);
  if (tiny) parts.push(`${tiny} tiny edit${tiny === 1 ? "" : "s"}`);
  if (projects) parts.push(`${projects} project${projects === 1 ? "" : "s"}`);
  return parts.length ? parts.join(" · ") : "Open sparks are waiting for review, development, or finishing notes.";
}

function renderStudioWorkflow() {
  if (!els.studioWorkflow) return;
  const entries = state.entries;
  const total = entries.length;
  const raw = entries.filter(entry => entry.status === "Raw Capture").length;
  const openQueue = entries.filter(entry => entry.action && !["Finished", "Archived"].includes(entry.status)).length;
  const conditioned = total ? Math.round(entries.filter(entry => [entry.light, entry.weather, entry.terrain, entry.pace].some(Boolean)).length / total * 100) : 0;
  const located = total ? Math.round(entries.filter(entry => entry.location || entry.sessionId).length / total * 100) : 0;
  const backedUp = Boolean(state.lastBackupAt);
  const finished = entries.filter(entry => entry.status === "Finished").length;
  const sessionsWithNotes = state.sessions.filter(session => session.notes || session.intent || session.focus).length;

  const items = [
    workflowItem({
      title: "Capture container",
      value: state.sessions.length ? `${state.sessions.length} roll${state.sessions.length === 1 ? "" : "s"}` : "No rolls yet",
      note: state.currentSessionId ? "A field session is active. New entries inherit roll conditions." : "Start a roll before the next walk so future review has context.",
      status: state.sessions.length ? "good" : "warn",
      command: "session",
      label: state.sessions.length ? "Open rolls" : "Start roll"
    }),
    workflowItem({
      title: "Metadata readiness",
      value: `${conditioned}% conditioned · ${located}% located`,
      note: "Good studio review depends on light, weather, terrain, pace, session, and place context.",
      status: conditioned >= 60 && located >= 60 ? "good" : total ? "warn" : "idle",
      command: "journal",
      label: "Review journal"
    }),
    workflowItem({
      title: "Darkroom review",
      value: `${raw} raw capture${raw === 1 ? "" : "s"}`,
      note: raw ? "Circle, develop, reject, or finish the raw captures from the contact sheet." : "No raw captures are waiting. The review bench is clean.",
      status: raw ? "warn" : "good",
      command: "review",
      label: "Open bench"
    }),
    workflowItem({
      title: "Creative work",
      value: `${openQueue} open follow-up${openQueue === 1 ? "" : "s"}`,
      note: "Move sparks into projects, add a next step, and mark finished work when something is made.",
      status: openQueue ? "warn" : "good",
      command: "later",
      label: "Open queue"
    }),
    workflowItem({
      title: "Session notes",
      value: `${sessionsWithNotes}/${state.sessions.length || 0} rolls annotated`,
      note: "Session notes help future-you remember why a walk mattered, not just what was captured.",
      status: state.sessions.length && sessionsWithNotes === state.sessions.length ? "good" : state.sessions.length ? "warn" : "idle",
      command: "session",
      label: "Edit rolls"
    }),
    workflowItem({
      title: "Finished artifacts",
      value: `${finished} finished print${finished === 1 ? "" : "s"}`,
      note: finished ? "Export a journal, zine sheet, contact sheet, gallery, or harvest report." : "Mark finished work when a spark becomes an artifact.",
      status: finished ? "good" : "idle",
      command: "export",
      label: "Export studio"
    }),
    workflowItem({
      title: "Backup",
      value: state.lastBackupAt ? formatRelativeAge(state.lastBackupAt) : "never exported",
      note: "Trail Muse is local-first. JSON backup is the safety line between field notes and lost notes.",
      status: backedUp ? "good" : total ? "warn" : "idle",
      command: "backup",
      label: "Export JSON"
    })
  ];

  els.studioWorkflow.innerHTML = items.join("");
}

function workflowItem({ title, value, note, status, command, label }) {
  return `<article class="workflow-item ${escapeHtml(status || "idle")}">
    <div><p class="eyebrow">${escapeHtml(title)}</p><h4>${escapeHtml(value)}</h4><p>${escapeHtml(note)}</p></div>
    <button class="secondary compact" data-studio-command="${escapeHtml(command)}" type="button">${escapeHtml(label)}</button>
  </article>`;
}

function renderSeriesBuilder() {
  if (!els.seriesBuilder) return;
  const groups = collectSeriesGroups().slice(0, 8);
  els.seriesBuilder.innerHTML = "";
  if (!groups.length) {
    els.seriesBuilder.innerHTML = `<p class="entry-meta">Series will appear here once multiple entries share a project, session, or recurring tag. Add project names, tags, or roll names while reviewing.</p>`;
    return;
  }

  groups.forEach(group => {
    const card = document.createElement("article");
    card.className = "series-card";
    const top = group.entries.slice().sort((a, b) => reviewScore(b) - reviewScore(a))[0];
    const projects = new Set(group.entries.map(entry => entry.project).filter(Boolean));
    const media = new Set(group.entries.map(entry => entry.type).filter(Boolean));
    const finished = group.entries.filter(entry => entry.status === "Finished").length;
    const next = top ? suggestedStudioMove(top) : "Collect one more related field spark.";
    card.innerHTML = `
      <div class="series-head">
        <div>
          <p class="eyebrow">${escapeHtml(group.kind)}</p>
          <h4>${escapeHtml(group.title)}</h4>
        </div>
        <strong>${Math.round(group.score)}</strong>
      </div>
      <p>${escapeHtml(group.entries.length)} exposure${group.entries.length === 1 ? "" : "s"} · ${media.size} medium${media.size === 1 ? "" : "s"} · ${finished} finished · ${projects.size || "no"} project${projects.size === 1 ? "" : "s"}</p>
      <p class="series-next">${escapeHtml(next)}</p>`;
    if (top) {
      const actions = document.createElement("div");
      actions.className = "entry-actions grease-actions";
      actions.append(
        actionButton("Edit top spark", "edit", top.id),
        actionButton("Develop", "develop", top.id),
        actionButton(top.favorite ? "Uncircle" : "Circle", "favorite", top.id),
        actionButton("Make project", "project", top.id)
      );
      card.append(actions);
    }
    els.seriesBuilder.append(card);
  });
}

function collectSeriesGroups() {
  const groups = [];
  const addGroup = (kind, title, entries) => {
    if (!entries || entries.length < 2) return;
    const active = entries.filter(entry => entry.status !== "Archived");
    if (active.length < 2) return;
    const score = active.reduce((sum, entry) => sum + reviewScore(entry), 0) + active.length * 3;
    groups.push({ kind, title, entries: active, score });
  };

  const byProject = new Map();
  state.entries.forEach(entry => {
    if (!entry.project) return;
    const key = entry.project.trim();
    if (!byProject.has(key)) byProject.set(key, []);
    byProject.get(key).push(entry);
  });
  byProject.forEach((entries, title) => addGroup("Project series", title, entries));

  state.sessions.forEach(session => addGroup("Exposure roll", session.name || "Untitled roll", getSessionEntries(session.id)));

  const byTag = new Map();
  state.entries.forEach(entry => {
    splitTags(entry.tags).forEach(tag => {
      const key = tag.toLowerCase();
      if (!byTag.has(key)) byTag.set(key, { title: tag, entries: [] });
      byTag.get(key).entries.push(entry);
    });
  });
  byTag.forEach(group => addGroup("Recurring signal", group.title, group.entries));

  return groups.sort((a, b) => b.score - a.score);
}

function suggestedStudioMove(entry) {
  if (entry.finishedNote || entry.status === "Finished") return "Export this series or write a short caption for the finished work.";
  if (!entry.nextStep && entry.action) return `Add a concrete next step for “${entry.action}.”`;
  if (entry.energy === "Tiny edit") return "This looks like a low-energy quick win. Do it before opening a larger project.";
  if (entry.status === "Raw Capture") return "Review this top spark first: circle, reject, or move it into development.";
  if (entry.image) return "Use the contact print as the anchor image and write a caption or edit note.";
  return entry.nextStep || entry.action || "Develop this into a small finished artifact.";
}

function renderArchiveHealth() {
  if (!els.archiveHealth) return;
  const entries = state.entries;
  const draft = safeReadDraft();
  const noSession = entries.filter(entry => !entry.sessionId).length;
  const noTitle = entries.filter(entry => !entry.title).length;
  const noNext = entries.filter(entry => entry.action && !entry.nextStep && !["Finished", "Archived"].includes(entry.status)).length;
  const backupAge = state.lastBackupAt ? formatRelativeAge(state.lastBackupAt) : "Never";
  const lastSaved = state.lastSaved ? formatRelativeAge(state.lastSaved) : "Not saved";
  const healthItems = [
    ["Last local save", lastSaved],
    ["Last JSON backup", backupAge],
    ["No session", noSession],
    ["Untitled exposures", noTitle],
    ["Follow-ups missing next step", noNext],
    ["Recoverable draft", draft ? "Yes" : "No"]
  ];
  els.archiveHealth.innerHTML = `
    <div class="health-list">${healthItems.map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")}</div>
    <div class="archive-actions">
      <button class="secondary compact" data-studio-command="backup" type="button">Export JSON backup</button>
      <button class="secondary compact" data-studio-command="journal" type="button">Clean journal</button>
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
  if (command === "capture") return setView("capture");
  if (command === "journal") return setView("journal");
  if (command === "later") return setView("later");
  if (command === "backup") return exportJson();
  if (command === "review") return scrollStudioPanel(".darkroom-review-panel");
  if (command === "export") return scrollStudioPanel(".export-studio-panel");
  if (command === "session") return scrollStudioPanel(".session-console-panel");
}

function scrollStudioPanel(selector) {
  setView("studio");
  const target = document.querySelector(selector);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderStudioReviewControls() {
  if (!els.studioSessionFilter) return;
  const previous = els.studioSessionFilter.value || "all";
  els.studioSessionFilter.innerHTML = '<option value="all">All sessions</option><option value="none">No session</option>';
  state.sessions.forEach(session => {
    const option = document.createElement("option");
    option.value = session.id;
    option.textContent = `${session.name || "Untitled session"}${session.endedAt ? "" : " · active"}`;
    els.studioSessionFilter.append(option);
  });
  els.studioSessionFilter.value = Array.from(els.studioSessionFilter.options).some(option => option.value === previous) ? previous : "all";
}

function renderStudioReview() {
  if (!els.studioContactSheet || !els.bestSparksSummary) return;
  const entries = getStudioReviewEntries();
  const ranked = entries.slice().sort((a, b) => reviewScore(b) - reviewScore(a));
  renderBestSparksSummary(entries, ranked);
  els.studioContactSheet.innerHTML = "";

  if (ranked.length === 0) {
    const empty = document.createElement("p");
    empty.className = "entry-meta";
    empty.textContent = "No exposures match this review filter.";
    els.studioContactSheet.append(empty);
    return;
  }

  ranked.slice(0, 18).forEach(entry => els.studioContactSheet.append(reviewCard(entry)));
}

function getStudioReviewEntries() {
  const sessionFilter = els.studioSessionFilter?.value || "all";
  const mediumFilter = els.studioMediumFilter?.value || "all";
  const statusFilter = els.studioStatusFilter?.value || "all";
  return state.entries
    .map(normalizeEntryForV13)
    .filter(entry => sessionFilter === "all" || (sessionFilter === "none" ? !entry.sessionId : entry.sessionId === sessionFilter))
    .filter(entry => mediumFilter === "all" || entry.type === mediumFilter)
    .filter(entry => statusFilter === "all" || entry.status === statusFilter)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

function reviewScore(entry) {
  let score = 0;
  if (entry.favorite) score += 8;
  if (entry.status === "Develop Further") score += 6;
  if (entry.status === "In Progress") score += 5;
  if (entry.status === "Finished") score += 4;
  if (entry.status === "Worth Returning To") score += 3;
  if (entry.image) score += 3;
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

function renderBestSparksSummary(entries, ranked) {
  els.bestSparksSummary.innerHTML = "";
  const top = ranked[0];
  const ready = entries.filter(entry => ["Worth Returning To", "Develop Further", "In Progress"].includes(entry.status)).length;
  const rejected = entries.filter(entry => entry.status === "Archived").length;
  const finished = entries.filter(entry => entry.status === "Finished").length;
  const sessionName = bestSessionName(entries);
  const summaryCards = [
    [entries.length, "reviewed exposures"],
    [ready, "worth developing"],
    [finished, "finished prints"],
    [rejected, "rejected / archived"],
    [sessionName, "strongest roll"]
  ];

  const stats = document.createElement("div");
  stats.className = "spark-stats";
  summaryCards.forEach(([value, label]) => stats.append(statCard(value || "—", label)));
  els.bestSparksSummary.append(stats);

  const best = document.createElement("article");
  best.className = "best-spark-card";
  if (!top) {
    best.innerHTML = '<p class="entry-meta">Collect exposures in the field, then return here to circle the strongest ones.</p>';
    els.bestSparksSummary.append(best);
    return;
  }

  const h4 = document.createElement("h4");
  h4.textContent = `Best spark: ${top.title || "Untitled exposure"}`;
  const note = document.createElement("p");
  note.textContent = strongestReason(top);
  const actions = document.createElement("div");
  actions.className = "entry-actions grease-actions";
  actions.append(
    actionButton(top.favorite ? "Uncircle" : "Circle", "favorite", top.id),
    actionButton("Develop", "develop", top.id),
    actionButton("Make project", "project", top.id),
    actionButton("Edit", "edit", top.id)
  );
  best.append(h4, note, actions);
  els.bestSparksSummary.append(best);
}

function bestSessionName(entries) {
  const counts = new Map();
  entries.forEach(entry => {
    const key = entry.sessionId || "none";
    counts.set(key, (counts.get(key) || 0) + reviewScore(entry));
  });
  const [id] = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0] || [];
  if (!id) return "—";
  if (id === "none") return "No session";
  return state.sessions.find(session => session.id === id)?.name || "Unknown roll";
}

function strongestReason(entry) {
  const reasons = [];
  if (entry.favorite) reasons.push("circled");
  if (entry.status) reasons.push(entry.status.toLowerCase());
  if (entry.action) reasons.push(`next action: ${entry.action}`);
  if (entry.project) reasons.push(`project: ${entry.project}`);
  if (entry.priority && entry.priority !== "Normal") reasons.push(`${entry.priority.toLowerCase()} priority`);
  if (entry.image) reasons.push("has a contact print");
  if (splitTags(entry.tags).length) reasons.push(`signals: ${splitTags(entry.tags).slice(0, 3).join(", ")}`);
  return reasons.length ? reasons.join(" · ") : "This exposure rises to the top because it has enough detail to review further.";
}

function reviewCard(entry) {
  const card = document.createElement("article");
  card.className = `review-card ${entry.status === "Archived" ? "archived" : ""}`;
  card.dataset.id = entry.id;

  const frame = document.createElement("div");
  frame.className = "review-frame";
  if (entry.image) {
    const img = document.createElement("img");
    img.src = entry.image;
    img.alt = entry.title || "Trail Muse contact print";
    frame.append(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "review-placeholder";
    placeholder.textContent = entry.type === "Photography Note" ? "▧" : "✦";
    frame.append(placeholder);
  }

  const h4 = document.createElement("h4");
  h4.textContent = `${entry.favorite ? "★ " : ""}${entry.title || "Untitled exposure"}`;
  const meta = document.createElement("div");
  meta.className = "entry-meta";
  meta.append(pill(entry.type, "entry-type"), pill(entry.status, "entry-status"));
  if (entry.location) meta.append(textSpan(entry.location));
  const note = document.createElement("p");
  note.textContent = entry.note || entry.prompt || "No note yet.";

  const actions = document.createElement("div");
  actions.className = "entry-actions grease-actions";
  actions.append(
    actionButton(entry.favorite ? "Uncircle" : "Circle", "favorite", entry.id),
    actionButton("Develop", "develop", entry.id),
    actionButton("Make project", "project", entry.id),
    actionButton("Reject", "reject", entry.id),
    actionButton("Finished", "finish-work", entry.id),
    actionButton("Edit", "edit", entry.id)
  );

  card.append(frame, h4, meta, note, actions);
  return card;
}

function renderSpecimenGallery() {
  if (!els.specimenGallery) return;
  const specimens = state.entries
    .filter(isSpecimenEntry)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  els.specimenGallery.innerHTML = "";

  if (specimens.length === 0) {
    const empty = document.createElement("p");
    empty.className = "entry-meta";
    empty.textContent = "No found object specimen cards yet. Open a Found Object note in the field and describe the material evidence.";
    els.specimenGallery.append(empty);
    return;
  }

  specimens.forEach(entry => {
    const card = document.createElement("article");
    card.className = "specimen-card";
    card.dataset.id = entry.id;
    const image = entry.image
      ? `<img src="${entry.image}" alt="${escapeHtml(specimenTitle(entry))}">`
      : `<div class="specimen-placeholder">◈</div>`;
    const details = specimenDetailPairs(entry)
      .slice(0, 6)
      .map(([label, value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`)
      .join("");
    card.innerHTML = `
      <div class="specimen-frame">${image}</div>
      <div class="specimen-card-body">
        <p class="eyebrow">${entry.specimenLeftInPlace ? "Found, not taken" : "Handling unconfirmed"}</p>
        <h4>${escapeHtml(specimenTitle(entry))}</h4>
        <p>${escapeHtml(entry.note || entry.prompt || "No observation note yet.")}</p>
        ${details ? `<dl>${details}</dl>` : ""}
        <div class="entry-actions grease-actions">
          <button type="button" data-action="edit" data-id="${entry.id}">Edit</button>
          <button type="button" data-action="develop" data-id="${entry.id}">Develop</button>
          <button type="button" data-action="favorite" data-id="${entry.id}">${entry.favorite ? "Uncircle" : "Circle"}</button>
        </div>
      </div>`;
    els.specimenGallery.append(card);
  });
}

function countUniqueTags() {
  return new Set(state.entries.flatMap(entry => splitTags(entry.tags).map(tag => tag.toLowerCase()))).size;
}

function renderTagCloud() {
  els.tagCloud.innerHTML = "";
  const counts = new Map();
  state.entries.forEach(entry => {
    splitTags(entry.tags).forEach(tag => counts.set(tag.toLowerCase(), (counts.get(tag.toLowerCase()) || 0) + 1));
  });

  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 24);
  if (sorted.length === 0) {
    const empty = document.createElement("p");
    empty.className = "entry-meta";
    empty.textContent = "Tags will appear here as recurring tones.";
    els.tagCloud.append(empty);
    return;
  }

  sorted.forEach(([tag, count]) => {
    const chip = pill(`#${tag} · ${count}`, "chip");
    chip.style.setProperty("--weight", count);
    els.tagCloud.append(chip);
  });
}

function getCurrentSession() {
  return state.sessions.find(session => session.id === state.currentSessionId) || null;
}

function startSession() {
  if (state.currentSessionId) {
    const active = getCurrentSession();
    const ok = confirm(`Start a new exposure roll? The active roll${active?.name ? ` “${active.name}”` : ""} will be closed first.`);
    if (!ok) return;
    state.sessions = state.sessions.map(session => session.id === state.currentSessionId ? { ...session, endedAt: new Date().toISOString() } : session);
  }

  const name = els.sessionName.value.trim() || "Untitled trail session";
  const intent = els.sessionIntent.value.trim();
  const session = normalizeSessionForV14({
    id: crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`,
    name,
    intent,
    focus: els.sessionFocus?.value.trim() || "",
    companions: els.sessionCompanions?.value.trim() || "",
    notes: els.sessionNotes?.value.trim() || "",
    light: els.sessionLight.value,
    weather: els.sessionWeather.value,
    terrain: els.sessionTerrain.value,
    pace: els.sessionPace.value,
    startedAt: new Date().toISOString(),
    endedAt: null
  });
  state.sessions.unshift(session);
  state.currentSessionId = session.id;
  els.sessionName.value = "";
  els.sessionIntent.value = "";
  if (els.sessionFocus) els.sessionFocus.value = "";
  if (els.sessionCompanions) els.sessionCompanions.value = "";
  if (els.sessionNotes) els.sessionNotes.value = "";
  els.sessionLight.value = "";
  els.sessionWeather.value = "";
  els.sessionTerrain.value = "";
  els.sessionPace.value = "";
  saveState();
  renderAll();
  flashSaved("Exposure roll started");
}

function closeCurrentSession() {
  if (!state.currentSessionId) {
    alert("There is no active trail session to close.");
    return;
  }
  state.sessions = state.sessions.map(session => {
    if (session.id !== state.currentSessionId) return session;
    return { ...session, endedAt: new Date().toISOString() };
  });
  state.currentSessionId = null;
  saveState();
  renderAll();
  flashSaved("Exposure roll closed");
}

function renderSessionPill() {
  const session = getCurrentSession();
  if (!session) {
    els.currentSessionPill.textContent = "No active session";
    return;
  }
  const conditions = [session.focus, session.light, session.weather, session.terrain, session.pace].filter(Boolean).join(" · ");
  els.currentSessionPill.textContent = conditions ? `Roll: ${session.name} · ${conditions}` : `Roll: ${session.name}`;
}

function exportJson() {
  state.lastBackupAt = new Date().toISOString();
  saveState();
  renderStudio();
  const payload = {
    app: "FI-077 Trail Muse",
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    state
  };
  downloadText(`trail-muse-${dateStamp()}.json`, JSON.stringify(payload, null, 2), "application/json");
}

function importJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      const imported = parsed.state || parsed;
      if (!Array.isArray(imported.entries)) throw new Error("Invalid Trail Muse file.");
      const ok = confirm("Import this Trail Muse file? This will replace the current local journal.");
      if (!ok) return;
      state = {
        ...defaultState(),
        ...imported,
        entries: Array.isArray(imported.entries) ? imported.entries.map(normalizeEntryForV13) : [],
        sessions: Array.isArray(imported.sessions) ? imported.sessions.map(normalizeSessionForV14) : [],
        customDecks: normalizeCustomDecks(imported.customDecks)
      };
      if (!["list", "contact"].includes(state.journalLayout)) state.journalLayout = "contact";
      saveState();
      applyTheme();
      renderAll();
      flashSaved("Trail Muse journal imported");
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

function exportSpecimenCards() {
  const specimens = state.entries
    .filter(isSpecimenEntry)
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (specimens.length === 0) {
    alert("There are no specimen cards to export yet.");
    return;
  }
  const cards = specimens.map(entry => `
    <article class="specimen-card-print">
      <div class="specimen-head">
        <p>FI-077 · Trail Muse · Specimen Card</p>
        <strong>${escapeHtml(entry.specimenLeftInPlace ? "FOUND, NOT TAKEN" : "HANDLING UNCONFIRMED")}</strong>
      </div>
      <h2>${escapeHtml(specimenTitle(entry))}</h2>
      <p class="meta">${escapeHtml(formatDate(entry.createdAt))}${entry.location ? ` · ${escapeHtml(entry.location)}` : ""}</p>
      ${entry.image ? `<img src="${entry.image}" alt="${escapeHtml(specimenTitle(entry))}">` : `<div class="blank-frame">Attach photo or sketch here</div>`}
      ${specimenDetailsHtml(entry)}
      ${entry.note ? `<p class="note">${escapeHtml(entry.note).replace(/\n/g, "<br>")}</p>` : ""}
      ${entry.tags ? `<p class="tags">${splitTags(entry.tags).map(tag => `#${escapeHtml(tag)}`).join(" ")}</p>` : ""}
    </article>`).join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trail Muse Specimen Cards</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; margin: 0; padding: 1.5rem; color: #111; background: #d8d7d1; }
  header { max-width: 1100px; margin: 0 auto 1rem; background: #f8f7ef; border: 1px solid rgba(0,0,0,.22); border-radius: 18px; padding: 1rem; }
  h1 { margin: .2rem 0; font-size: clamp(2rem, 6vw, 4rem); letter-spacing: -.05em; }
  .sheet { max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
  .specimen-card-print { break-inside: avoid; background: #fbfaf4; border: 2px solid #111; border-radius: 16px; padding: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,.16); }
  .specimen-head { display: flex; justify-content: space-between; gap: 1rem; border-bottom: 1px solid #111; margin-bottom: .8rem; padding-bottom: .45rem; font-size: .72rem; letter-spacing: .13em; text-transform: uppercase; }
  h2 { margin: 0 0 .25rem; font-family: Georgia, serif; font-size: 1.55rem; letter-spacing: -.035em; }
  .meta, .tags, .ethics { color: #555; font-weight: 750; }
  img, .blank-frame { width: 100%; aspect-ratio: 4/3; object-fit: cover; filter: grayscale(1) contrast(1.1); border: 10px solid #fff; outline: 1px solid rgba(0,0,0,.25); background: #eee; display: grid; place-items: center; margin: .8rem 0; }
  dl { display: grid; grid-template-columns: 7rem 1fr; gap: .25rem .65rem; margin: .75rem 0; }
  dt { font-weight: 900; text-transform: uppercase; letter-spacing: .08em; font-size: .72rem; }
  dd { margin: 0; }
  .note { border-top: 1px solid rgba(0,0,0,.2); padding-top: .75rem; }
  @media print { body { background: white; padding: 0; } header { box-shadow: none; } .sheet { grid-template-columns: repeat(2, 1fr); } .specimen-card-print { box-shadow: none; page-break-inside: avoid; } }
</style>
</head>
<body>
<header><p>Field Instrument 077 · Trail Muse v2.0</p><h1>Specimen Card Sheet</h1><p>${specimens.length} found object card${specimens.length === 1 ? "" : "s"}. Natural objects are treated as observations first: photograph, sketch, describe, and leave in place unless collecting is allowed and appropriate.</p></header>
<main class="sheet">${cards}</main>
</body>
</html>`;
  downloadText(`trail-muse-specimen-cards-${dateStamp()}.html`, html, "text/html");
}

function exportMakeLaterPlan() {
  const queue = state.entries
    .map(normalizeEntryForV13)
    .filter(entry => entry.action && entry.status !== "Archived")
    .sort((a, b) => followupScore(b) - followupScore(a));
  if (!queue.length) {
    alert("There are no make-later items to export yet.");
    return;
  }
  const projects = groupByProject(queue);
  const sections = projects.map(project => `
    <section class="project">
      <h2>${escapeHtml(project.name)}</h2>
      ${project.items.map(entry => `
        <article class="task">
          <h3>${escapeHtml(entry.title || "Untitled exposure")}</h3>
          <p class="meta">${escapeHtml(entry.type)} · ${escapeHtml(entry.status)} · ${escapeHtml(entry.action)} · ${escapeHtml(entry.priority)} priority · ${escapeHtml(entry.energy)}${entry.due ? ` · ${escapeHtml(dueLabel(entry.due))}` : ""}</p>
          <p><strong>Next step:</strong> ${escapeHtml(nextStepForEntry(entry))}</p>
          ${entry.note ? `<p>${escapeHtml(entry.note).replace(/\n/g, "<br>")}</p>` : ""}
          ${entry.finishedNote ? `<p><strong>Finished work:</strong> ${escapeHtml(entry.finishedNote)}</p>` : ""}
          ${entry.tags ? `<p class="tags">${splitTags(entry.tags).map(tag => `#${escapeHtml(tag)}`).join(" ")}</p>` : ""}
        </article>
      `).join("\n")}
    </section>
  `).join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trail Muse Make-Later Plan</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; max-width: 1050px; margin: 0 auto; padding: 2rem; color: #111; background: #d8d7d1; }
  header, .project, .task { background: #f8f7ef; border: 1px solid rgba(0,0,0,.2); border-radius: 18px; padding: 1.1rem; margin-bottom: 1rem; box-shadow: 0 18px 40px rgba(0,0,0,.12); }
  h1, h2, h3 { letter-spacing: -.04em; line-height: .98; }
  h1 { font-size: clamp(2.4rem, 8vw, 5rem); }
  .meta, .tags { color: #555; font-weight: 750; }
  .task { box-shadow: none; border-style: dashed; }
  @media print { body { background: white; } header, .project, .task { box-shadow: none; break-inside: avoid; } }
</style>
</head>
<body>
<header>
  <p>Field Instrument 077 · Trail Muse v2.0</p>
  <h1>Make-Later Plan</h1>
  <p>${queue.length} queued creative follow-up${queue.length === 1 ? "" : "s"} across ${projects.length} project group${projects.length === 1 ? "" : "s"}. Sorted by follow-up score, priority, energy, and review strength.</p>
</header>
${sections}
</body>
</html>`;
  downloadText(`trail-muse-make-later-plan-${dateStamp()}.html`, html, "text/html");
}

function exportCsv() {
  const headers = ["id", "type", "title", "status", "reviewScore", "followupScore", "sessionName", "action", "priority", "energy", "project", "due", "nextStep", "finishedNote", "location", "mood", "light", "weather", "terrain", "pace", "tags", "specimenName", "specimenMaterial", "specimenTexture", "specimenCondition", "specimenScale", "specimenPosition", "specimenStory", "specimenUse", "specimenLeftInPlace", "prompt", "note", "createdAt", "updatedAt"];
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
  const image = includeImage && entry.image ? `<img src="${entry.image}" alt="${escapeHtml(entry.title || "Trail Muse attachment")}">` : "";
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
      <figure>${entry.image ? `<img src="${entry.image}" alt="${escapeHtml(entry.title || "Trail Muse contact print")}">` : `<div class="placeholder">${entry.type === "Photography Note" ? "▧" : "✦"}</div>`}</figure>
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
  <p class="eyebrow">Field Instrument 077 · Trail Muse v2.0</p>
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
      ${entry.image ? `<img src="${entry.image}" alt="${escapeHtml(entry.title || "zine image")}">` : `<div class="placeholder">${index + 1}</div>`}
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
  <p class="eyebrow">Field Instrument 077 · Trail Muse v2.0</p>
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
    .filter(entry => entry.image)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (!entries.length) {
    alert("There are no photo or sketch attachments to export as a gallery yet.");
    return;
  }
  const cards = entries.map(entry => `
    <article class="gallery-card">
      <img src="${entry.image}" alt="${escapeHtml(entry.title || "Trail Muse gallery image")}">
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
  <p class="eyebrow">Field Instrument 077 · Trail Muse v2.0</p>
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
  <p class="eyebrow">Field Instrument 077 · Trail Muse v2.0</p>
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
  lines.push(`Field Instrument 077 · Trail Muse v2.0`);
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
    if (entry.image) lines.push(`- Attachment: embedded in HTML/JSON exports; omitted from Markdown for portability.`);
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
  <p class="eyebrow">Field Instrument 077 · Trail Muse v2.0</p>
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

function exportSessionHtml(sessionId) {
  const session = state.sessions.find(item => item.id === sessionId);
  if (!session) {
    alert("Trail Muse could not find that exposure roll.");
    return;
  }

  const entries = getSessionEntries(sessionId)
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const stats = sessionStats(session);
  const best = stats.best;
  const conditionLine = [session.intent, session.focus, session.companions ? `with ${session.companions}` : "", session.light, session.weather, session.terrain, session.pace]
    .filter(Boolean)
    .join(" · ");

  const cards = entries.map(entry => `
    <article class="entry">
      <h2>${escapeHtml(entry.title || "Untitled exposure")}</h2>
      <p class="meta">${escapeHtml(entry.type)} · ${escapeHtml(entry.status)} · ${escapeHtml(formatDate(entry.createdAt))}</p>
      ${entry.location ? `<p><strong>Location:</strong> ${escapeHtml(entry.location)}</p>` : ""}
      ${[entry.mood, entry.light, entry.weather, entry.terrain, entry.pace].filter(Boolean).length ? `<p><strong>Field conditions:</strong> ${[entry.mood, entry.light, entry.weather, entry.terrain, entry.pace].filter(Boolean).map(escapeHtml).join(" · ")}</p>` : ""}
      ${entry.prompt ? `<blockquote>${escapeHtml(entry.prompt)}</blockquote>` : ""}
      ${entry.note ? `<p>${escapeHtml(entry.note).replace(/\n/g, "<br>")}</p>` : ""}
      ${entry.action ? `<p><strong>Make later:</strong> ${escapeHtml(entry.action)}${entry.priority ? ` · ${escapeHtml(entry.priority)} priority` : ""}${entry.energy ? ` · ${escapeHtml(entry.energy)}` : ""}${entry.project ? ` · project: ${escapeHtml(entry.project)}` : ""}${entry.due ? ` · ${escapeHtml(dueLabel(entry.due))}` : ""}</p>` : ""}
      ${entry.nextStep ? `<p><strong>Next step:</strong> ${escapeHtml(entry.nextStep)}</p>` : ""}
      ${entry.finishedNote ? `<p><strong>Finished work:</strong> ${escapeHtml(entry.finishedNote)}</p>` : ""}
      ${isSpecimenEntry(entry) ? specimenDetailsHtml(entry) : ""}
      ${entry.tags ? `<p class="tags">${splitTags(entry.tags).map(tag => `#${escapeHtml(tag)}`).join(" ")}</p>` : ""}
      ${entry.image ? `<img src="${entry.image}" alt="${escapeHtml(entry.title || "Trail Muse attachment")}">` : ""}
    </article>
  `).join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(session.name)} · Trail Muse Exposure Roll</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; max-width: 980px; margin: 0 auto; padding: 2rem; color: #111; background: #d8d7d1; }
  header, article, .stats { background: #f8f7ef; border: 1px solid rgba(0,0,0,.18); border-radius: 18px; padding: 1.2rem; margin-bottom: 1rem; box-shadow: 0 18px 40px rgba(0,0,0,.14); }
  h1, h2 { letter-spacing: -0.04em; line-height: .95; }
  h1 { font-size: clamp(2.2rem, 7vw, 4rem); }
  blockquote { border-left: 5px solid #111; padding-left: 1rem; color: #5b5b57; font-style: italic; }
  .meta, .tags { color: #5b5b57; font-weight: 700; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: .8rem; }
  .stats div { border: 1px solid rgba(0,0,0,.16); border-radius: 14px; padding: .8rem; }
  .stats strong { display: block; font-size: 1.7rem; }
  img { max-width: 100%; border: 12px solid #fff; outline: 1px solid rgba(0,0,0,.2); filter: grayscale(1) contrast(1.12); margin-top: .75rem; }
</style>
</head>
<body>
<header>
  <p>Field Instrument 077 · Trail Muse · v2.0 Exposure Roll Export</p>
  <h1>${escapeHtml(session.name || "Untitled exposure roll")}</h1>
  <p>${escapeHtml(conditionLine || "No session conditions recorded.")}</p>
  ${session.notes ? `<p>${escapeHtml(session.notes)}</p>` : ""}
  <p class="meta">Started ${escapeHtml(formatDate(session.startedAt))}${session.endedAt ? ` · Closed ${escapeHtml(formatDate(session.endedAt))}` : " · Active roll"} · Duration ${escapeHtml(sessionDuration(session))}</p>
</header>
<section class="stats">
  <div><strong>${entries.length}</strong><span>exposures</span></div>
  <div><strong>${stats.queue.length}</strong><span>queued</span></div>
  <div><strong>${stats.favorites.length}</strong><span>circled</span></div>
  <div><strong>${stats.finished.length}</strong><span>finished</span></div>
</section>
${best ? `<article><h2>Best spark</h2><p><strong>${escapeHtml(best.title || "Untitled exposure")}</strong></p><p>${escapeHtml(strongestReason(best))}</p></article>` : ""}
${cards || "<p>No entries were captured in this roll.</p>"}
</body>
</html>`;

  downloadText(`trail-muse-roll-${slugify(session.name || "untitled")}-${dateStamp()}.html`, html, "text/html");
}

function slugify(value) {
  return String(value || "trail-muse")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "trail-muse";
}

function loadSampleTrail() {
  const ok = state.entries.length === 0 || confirm("Load a sample Trail Muse journal? This will add demo entries to the current journal.");
  if (!ok) return;

  const session = {
    id: crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`,
    name: "Canal Towpath Morning Walk",
    intent: "quiet, damp, sketchbook, texture study",
    focus: "monochrome photos, specimen notes, essay fragments",
    companions: "solo walk",
    notes: "A slow morning roll after rain. Good for texture, lock hardware, moss, and water-polished stone.",
    light: "Soft overcast",
    weather: "After storm",
    terrain: "Creek / water",
    pace: "Slow looking",
    startedAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    endedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString()
  };
  state.sessions.unshift(session);

  const demo = [
    makeEntry({
      type: "Prompt Response",
      title: "Light opened after cloud",
      prompt: "Find the place where light changes its mind.",
      note: "Under the sycamore roots, the towpath light broke into hard whites and deep grays. It felt like a temporary print that would be gone by noon.",
      location: session.name,
      mood: "damp, luminous, quiet",
      tags: "light, sycamore, threshold",
      action: "Make a zine page",
      priority: "High",
      energy: "One sitting",
      project: "Canal Towpath Zine",
      nextStep: "Pair this note with a single monochrome image and rough page margin.",
      status: "Develop Further",
      sessionId: session.id
    }),
    makeEntry({
      type: "Found Object",
      title: "Rusty washer near lock wall",
      prompt: "Make a specimen card for something you will not take with you.",
      note: "Flat steel washer, rusted almost orange. It looked like a small machine part trying to become a seed. Left in place on the stone wall.",
      location: "Old lock wall",
      mood: "weathered",
      tags: "rust, machine, specimen",
      action: "Make a specimen card",
      priority: "High",
      energy: "One sitting",
      project: "Canal Towpath Zine",
      nextStep: "Lay this out as a specimen card and draw the washer at twice actual size.",
      status: "Worth Returning To",
      specimenName: "Rusty washer",
      specimenMaterial: "weathered steel",
      specimenTexture: "pitted, flaking, grit in the inner edge",
      specimenCondition: "rusted, circular, intact but worn",
      specimenScale: "coin-sized",
      specimenPosition: "on the old lock wall beside damp moss",
      specimenStory: "It may have fallen from repair work and slowly joined the canal wall.",
      specimenUse: "draw as artifact / use in zine page",
      specimenLeftInPlace: true,
      sessionId: session.id
    }),
    makeEntry({
      type: "Photography Note",
      title: "Moss as a tonal map",
      prompt: "Photograph evidence of time.",
      note: "The moss on the mile marker grows heavier on the canal side. Shoot again on an overcast day with the phone lower to the ground so the marker becomes a small monument.",
      location: "Mile marker 7",
      mood: "soft gray, low light",
      tags: "moss, time, marker",
      action: "Edit photo",
      priority: "Normal",
      energy: "Tiny edit",
      project: "Monochrome Mile Markers",
      nextStep: "Make one high-contrast edit and test whether the moss edge still holds detail.",
      status: "In Progress",
      sessionId: session.id
    }),
    makeEntry({
      type: "Trail Thought",
      title: "The trail edits noise",
      prompt: "",
      note: "Walking makes the noisy part of an idea fall away. The trail does not solve the problem. It removes everything that is not the problem.",
      location: session.name,
      mood: "clear",
      tags: "walking, thinking, essay",
      action: "Write this",
      priority: "Critical",
      energy: "Tiny edit",
      project: "Walking Essays",
      nextStep: "Write 300 words around the sentence: the trail edits noise.",
      status: "Develop Further",
      favorite: true,
      sessionId: session.id
    }),
    makeEntry({
      type: "Small Discovery",
      title: "Ants detour around puddle",
      prompt: "Notice the smallest motion around you.",
      note: "A line of ants rerouted around a boot print full of water. It looked like traffic engineering at the scale of a thumbnail.",
      location: "Muddy bend",
      mood: "tiny infrastructure",
      tags: "ants, water, infrastructure",
      action: "Research this",
      priority: "Normal",
      energy: "Research trail",
      project: "Tiny Infrastructure Notes",
      nextStep: "Look up ant trail rerouting and compare it to desire paths.",
      status: "Worth Returning To",
      sessionId: session.id
    })
  ];

  state.entries = [...demo, ...state.entries];
  state.customDecks = {
    ...normalizeCustomDecks(state.customDecks),
    "Towpath Silver": {
      name: "Towpath Silver",
      medium: "Mixed field practice",
      intensity: "Observational",
      description: "A sample custom deck for damp canal walks, stone, hardware, and slow texture studies.",
      prompts: [
        "Find a surface where water has made the composition quieter.",
        "Make a note about a machine part becoming part of the landscape.",
        "Describe a lock wall, bridge, or marker as if it were a mountain face.",
        "Look for a small reflection that contains the whole walk.",
        "Find evidence of repair, erosion, or patient maintenance."
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };
  saveState();
  renderAll();
  flashSaved("Sample exposure roll loaded");
}

function clearAllData() {
  const ok = confirm("Clear all Trail Muse local data on this device? Export first if you want to keep a backup.");
  if (!ok) return;
  state = defaultState();
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(DRAFT_KEY);
  applyTheme();
  renderAll();
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
