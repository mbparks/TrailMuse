const APP_VERSION = "FI-077 Trail Muse v1.1";
const STORAGE_KEY = "fi077_trail_muse_state_v1";

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

const statuses = ["Raw Spark", "Needs Review", "Ready to Make", "In Progress", "Made", "Archived"];
const laterColumns = ["Needs Review", "Ready to Make", "In Progress", "Made"];

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
    description: "Make a specimen card for an object, texture, fragment, trace, or trail relic. Leave natural objects in place."
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
  entries: [],
  sessions: [],
  currentSessionId: null,
  currentPrompt: null,
  lastSaved: null
});

let state = loadState();
let pendingImageData = "";

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
    newEntryTop: document.getElementById("newEntryTop"),
    promptDeck: document.getElementById("promptDeck"),
    promptOutput: document.getElementById("promptOutput"),
    promptResponse: document.getElementById("promptResponse"),
    askMuse: document.getElementById("askMuse"),
    savePromptEntry: document.getElementById("savePromptEntry"),
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
    laterBoard: document.getElementById("laterBoard"),
    dashboardGrid: document.getElementById("dashboardGrid"),
    tagCloud: document.getElementById("tagCloud"),
    currentSessionPill: document.getElementById("currentSessionPill"),
    sessionName: document.getElementById("sessionName"),
    sessionIntent: document.getElementById("sessionIntent"),
    startSession: document.getElementById("startSession"),
    closeSession: document.getElementById("closeSession"),
    exportJson: document.getElementById("exportJson"),
    importJson: document.getElementById("importJson"),
    exportHtml: document.getElementById("exportHtml"),
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
    entryMood: document.getElementById("entryMood"),
    entryTags: document.getElementById("entryTags"),
    entryImage: document.getElementById("entryImage"),
    imagePreviewWrap: document.getElementById("imagePreviewWrap"),
    imagePreview: document.getElementById("imagePreview"),
    removeImage: document.getElementById("removeImage"),
    deleteEntry: document.getElementById("deleteEntry"),
    saveAndNew: document.getElementById("saveAndNew"),
    saveEntry: document.getElementById("saveEntry")
  });
}

function hydrateStaticControls() {
  Object.keys(promptDecks).forEach(deck => {
    const option = document.createElement("option");
    option.value = deck;
    option.textContent = deck;
    els.promptDeck.append(option);
  });

  entryTypes.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    els.entryType.append(option.cloneNode(true));
    els.typeFilter.append(option);
  });
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

  els.newEntryTop.addEventListener("click", () => openEntryDialog({ type: "Trail Thought" }));
  els.openFullCapture.addEventListener("click", () => openEntryDialog({ type: "Trail Thought" }));
  els.askMuse.addEventListener("click", askMuse);
  els.savePromptEntry.addEventListener("click", savePromptResponse);

  els.quickPanel.addEventListener("click", event => {
    const target = event.target.closest("[data-quick]");
    if (!target) return;
    openEntryDialog({ type: target.dataset.quick });
  });

  [els.searchBox, els.typeFilter, els.statusFilter].forEach(control => {
    control.addEventListener("input", renderJournal);
    control.addEventListener("change", renderJournal);
  });

  els.entryForm.addEventListener("submit", event => {
    event.preventDefault();
    saveEntryFromDialog(false);
  });

  els.saveAndNew.addEventListener("click", () => saveEntryFromDialog(true));
  els.closeDialog.addEventListener("click", closeDialog);
  els.deleteEntry.addEventListener("click", deleteCurrentEntry);
  els.entryImage.addEventListener("change", handleImageSelection);
  els.removeImage.addEventListener("click", () => {
    pendingImageData = "";
    els.entryImage.value = "";
    updateImagePreview();
  });

  els.journalList.addEventListener("click", handleEntryAction);
  els.laterBoard.addEventListener("click", handleEntryAction);

  els.startSession.addEventListener("click", startSession);
  els.closeSession.addEventListener("click", closeCurrentSession);

  els.exportJson.addEventListener("click", exportJson);
  els.importJson.addEventListener("change", importJson);
  els.exportHtml.addEventListener("click", exportHtml);
  els.exportCsv.addEventListener("click", exportCsv);
  els.printJournal.addEventListener("click", () => window.print());
  els.loadDemo.addEventListener("click", loadSampleTrail);
  els.clearDemo.addEventListener("click", clearAllData);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed, entries: Array.isArray(parsed.entries) ? parsed.entries : [] };
  } catch (error) {
    console.warn("Trail Muse could not load saved state.", error);
    return defaultState();
  }
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
  els.themeToggle.textContent = state.theme === "dark" ? "☀" : "☾";
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
  const deck = promptDecks[deckName] || promptDecks.Wanderer;
  const prompt = deck[Math.floor(Math.random() * deck.length)];
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
    status: response ? "Raw Spark" : "Needs Review"
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
    tags: "",
    action: "",
    status: "Raw Spark",
    favorite: false,
    image: "",
    sessionId: state.currentSessionId,
    createdAt: now,
    updatedAt: now,
    ...overrides
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
    fragment.querySelector("button").addEventListener("click", () => openEntryDialog({ type: module.type }));
    card.dataset.type = module.type;
    els.captureGrid.append(fragment);
  });
}

function openEntryDialog(seed = {}) {
  pendingImageData = seed.image || "";
  els.entryForm.reset();
  els.entryId.value = seed.id || "";
  els.entryType.value = seed.type || "Trail Thought";
  els.entryStatus.value = seed.status || "Raw Spark";
  els.entryTitle.value = seed.title || suggestedTitle(seed.type || "Trail Thought");
  els.entryLocation.value = seed.location || getCurrentSession()?.name || "";
  els.entryPrompt.value = seed.prompt || "";
  els.entryNote.value = seed.note || "";
  els.entryAction.value = seed.action || "";
  els.entryMood.value = seed.mood || getCurrentSession()?.intent || "";
  els.entryTags.value = seed.tags || "";
  els.dialogEyebrow.textContent = seed.id ? "Edit field note" : "New field note";
  els.dialogTitle.textContent = seed.id ? "Revise exposure" : `Capture ${seed.type || "exposure"}`;
  els.deleteEntry.hidden = !seed.id;
  updateImagePreview();

  if (typeof els.dialog.showModal === "function") {
    els.dialog.showModal();
  } else {
    els.dialog.setAttribute("open", "");
  }
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

function saveEntryFromDialog(keepOpen) {
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
    mood: els.entryMood.value.trim(),
    tags: normalizeTags(els.entryTags.value),
    image: pendingImageData,
    updatedAt: now
  };

  if (id) {
    const index = state.entries.findIndex(entry => entry.id === id);
    if (index !== -1) state.entries[index] = { ...state.entries[index], ...values };
  } else {
    const entry = makeEntry(values);
    state.entries.unshift(entry);
  }

  saveState();
  renderAll();
  flashSaved("Field note saved");

  if (keepOpen) {
    const nextType = els.entryType.value;
    openEntryDialog({ type: nextType, location: values.location, mood: values.mood });
  } else {
    closeDialog();
  }
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
  renderMiniStats();
  renderJournal();
  renderLaterBoard();
  renderStudio();
  renderSessionPill();
}

function renderMiniStats() {
  const entries = state.entries;
  const made = entries.filter(entry => entry.status === "Made").length;
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

function getFilteredEntries() {
  const query = els.searchBox.value.trim().toLowerCase();
  const type = els.typeFilter.value;
  const status = els.statusFilter.value;

  return state.entries
    .filter(entry => type === "all" || entry.type === type)
    .filter(entry => status === "all" || entry.status === status)
    .filter(entry => {
      if (!query) return true;
      const haystack = [entry.title, entry.type, entry.status, entry.prompt, entry.note, entry.location, entry.mood, entry.tags, entry.action]
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
  els.emptyJournal.classList.toggle("active", entries.length === 0);
  entries.forEach(entry => els.journalList.append(entryCard(entry)));
}

function entryCard(entry, compact = false) {
  const card = document.createElement("article");
  card.className = `entry-card ${entry.status === "Archived" ? "archived" : ""}`;
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
  if (entry.mood) meta.append(textSpan(entry.mood));
  splitTags(entry.tags).forEach(tag => meta.append(pill(`#${tag}`, "chip")));

  const actions = document.createElement("div");
  actions.className = "entry-actions";
  actions.append(
    actionButton("Edit", "edit", entry.id),
    actionButton(entry.favorite ? "Unstar" : "Star", "favorite", entry.id),
    actionButton("Make later", "make-later", entry.id),
    actionButton(entry.status === "Archived" ? "Restore" : "Archive", "archive", entry.id),
    actionButton("Delete", "delete", entry.id)
  );

  main.append(topline, prompt, note, meta);
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
  if (action === "status") updateStatus(entry.id, button.dataset.status);
}

function toggleFavorite(id) {
  mutateEntry(id, entry => ({ ...entry, favorite: !entry.favorite }));
}

function sendToLater(id) {
  mutateEntry(id, entry => ({
    ...entry,
    action: entry.action || defaultActionForType(entry.type),
    status: entry.status === "Archived" || entry.status === "Made" ? "Needs Review" : "Ready to Make"
  }));
  setView("later");
}

function defaultActionForType(type) {
  const map = {
    "Drawing Note": "Draw this",
    "Photography Note": "Edit photo",
    "Writing Note": "Write this",
    "Found Object": "Make a zine page",
    "Small Discovery": "Research this",
    "Trail Thought": "Write this",
    "Sensory Note": "Combine with another exposure",
    "Prompt Response": "Turn into project"
  };
  return map[type] || "Turn into project";
}

function toggleArchive(id) {
  mutateEntry(id, entry => ({ ...entry, status: entry.status === "Archived" ? "Needs Review" : "Archived" }));
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

function renderLaterBoard() {
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

  const actions = document.createElement("div");
  actions.className = "entry-actions";
  const nextStatus = nextLaterStatus(entry.status);
  actions.append(
    actionButton("Edit", "edit", entry.id),
    statusButton(`Move to ${nextStatus}`, entry.id, nextStatus)
  );

  card.append(title, type, action, note, actions);
  return card;
}

function nextLaterStatus(status) {
  const index = laterColumns.indexOf(status);
  if (index < 0) return "Ready to Make";
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
  const made = entries.filter(entry => entry.status === "Made");
  const sessions = state.sessions.length;
  const favorites = entries.filter(entry => entry.favorite).length;
  const images = entries.filter(entry => entry.image).length;

  els.dashboardGrid.innerHTML = "";
  [
    [entries.length, "total exposures"],
    [active.length, "active negatives"],
    [queue.length, "darkroom queue"],
    [made.length, "finished prints"],
    [favorites, "starred"],
    [images, "contact prints"],
    [sessions, "sessions"],
    [countUniqueTags(), "recurring tones"]
  ].forEach(([value, label]) => els.dashboardGrid.append(statCard(value, label)));

  renderTagCloud();
  renderSessionPill();
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
  const name = els.sessionName.value.trim() || "Untitled trail session";
  const intent = els.sessionIntent.value.trim();
  const session = {
    id: crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`,
    name,
    intent,
    startedAt: new Date().toISOString(),
    endedAt: null
  };
  state.sessions.unshift(session);
  state.currentSessionId = session.id;
  els.sessionName.value = "";
  els.sessionIntent.value = "";
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
  els.currentSessionPill.textContent = session ? `Session: ${session.name}` : "No active session";
}

function exportJson() {
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
      state = { ...defaultState(), ...imported };
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

function exportCsv() {
  const headers = ["id", "type", "title", "status", "action", "location", "mood", "tags", "prompt", "note", "createdAt", "updatedAt"];
  const rows = state.entries.map(entry => headers.map(header => csvEscape(entry[header] || "")).join(","));
  downloadText(`trail-muse-${dateStamp()}.csv`, [headers.join(","), ...rows].join("\n"), "text/csv");
}

function exportHtml() {
  const entries = state.entries
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const cards = entries.map(entry => `
    <article class="entry">
      <h2>${escapeHtml(entry.title || "Untitled exposure")}</h2>
      <p class="meta">${escapeHtml(entry.type)} · ${escapeHtml(entry.status)} · ${escapeHtml(formatDate(entry.createdAt))}</p>
      ${entry.location ? `<p><strong>Location:</strong> ${escapeHtml(entry.location)}</p>` : ""}
      ${entry.prompt ? `<blockquote>${escapeHtml(entry.prompt)}</blockquote>` : ""}
      ${entry.note ? `<p>${escapeHtml(entry.note).replace(/\n/g, "<br>")}</p>` : ""}
      ${entry.action ? `<p><strong>Make later:</strong> ${escapeHtml(entry.action)}</p>` : ""}
      ${entry.tags ? `<p class="tags">${splitTags(entry.tags).map(tag => `#${escapeHtml(tag)}`).join(" ")}</p>` : ""}
      ${entry.image ? `<img src="${entry.image}" alt="${escapeHtml(entry.title || "Trail Muse attachment")}">` : ""}
    </article>
  `).join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trail Muse Silver Field Journal</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; max-width: 920px; margin: 0 auto; padding: 2rem; color: #111; background: #d8d7d1; }
  header, article { background: #f8f7ef; border: 1px solid rgba(0,0,0,.18); border-radius: 18px; padding: 1.2rem; margin-bottom: 1rem; box-shadow: 0 18px 40px rgba(0,0,0,.14); }
  h1, h2 { letter-spacing: -0.04em; line-height: .95; }
  h1 { font-size: clamp(2.2rem, 7vw, 4rem); }
  blockquote { border-left: 5px solid #111; padding-left: 1rem; color: #5b5b57; font-style: italic; }
  .meta, .tags { color: #5b5b57; font-weight: 700; }
  img { max-width: 100%; border: 12px solid #fff; outline: 1px solid rgba(0,0,0,.2); filter: grayscale(1) contrast(1.12); margin-top: .75rem; }
</style>
</head>
<body>
<header>
  <p>Field Instrument 077 · Trail Muse</p>
  <h1>Silver Field Journal Export</h1>
  <p>Exported ${escapeHtml(formatDate(new Date().toISOString()))}. ${entries.length} exposures collected.</p>
</header>
${cards || "<p>No entries yet.</p>"}
</body>
</html>`;
  downloadText(`trail-muse-field-journal-${dateStamp()}.html`, html, "text/html");
}


function loadSampleTrail() {
  const ok = state.entries.length === 0 || confirm("Load a sample Trail Muse journal? This will add demo entries to the current journal.");
  if (!ok) return;

  const session = {
    id: crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}`,
    name: "Canal Towpath Morning Walk",
    intent: "quiet, damp, sketchbook, texture study",
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
      status: "Ready to Make",
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
      action: "Draw this",
      status: "Needs Review",
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
      status: "Ready to Make",
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
      status: "Needs Review",
      sessionId: session.id
    })
  ];

  state.entries = [...demo, ...state.entries];
  saveState();
  renderAll();
  flashSaved("Sample exposure roll loaded");
}

function clearAllData() {
  const ok = confirm("Clear all Trail Muse local data on this device? Export first if you want to keep a backup.");
  if (!ok) return;
  state = defaultState();
  localStorage.removeItem(STORAGE_KEY);
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
