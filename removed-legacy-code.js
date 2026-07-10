/* FI-077 Trail Muse — legacy code removed in cleanup pass.
   Snapshot of shadowed v1 duplicates and unreachable removed-feature code.
   Kept for reference only. Not loaded by the app. */


/* ===== renderAll  (shadowed-copy)  original lines 1711-1726 ===== */
function renderAll() {
  renderSaveIndicator();
  renderPrompt();
  renderPromptDeckOptions();
  renderMiniStats();
  renderJournalSessionFilter();
  renderJournal();
  renderAnalytics();
  renderLaterBoard();
  renderStudio();
  renderSessionPill();
  renderTrailModeConsole();
  renderSessionArchive();
  renderDeckEditor();
}


/* ===== renderAnalytics  (shadowed-copy)  original lines 1727-1760 ===== */
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
  const photos = entries.filter(entry => entry.image || entry.type === "Photography Note").length;
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


/* ===== populateAnalyticsSessionFilter  (shadowed-copy)  original lines 1761-1773 ===== */
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


/* ===== analyticsStat  (shadowed-copy)  original lines 1774-1777 ===== */
function analyticsStat(value, label, note) {
  return `<article class="analytics-stat"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span><small>${escapeHtml(note)}</small></article>`;
}


/* ===== renderAnalyticsBars  (shadowed-copy)  original lines 1778-1784 ===== */
function renderAnalyticsBars(entries) {
  const counts = countValues(entries.map(entry => entry.type || "Field Note"));
  const sorted = [...counts.entries()].sort((a,b) => b[1]-a[1]);
  const max = sorted[0]?.[1] || 1;
  els.analyticsTypeChart.innerHTML = sorted.length ? sorted.map(([label,value]) => `<div class="analytics-bar-row"><span class="analytics-bar-label">${escapeHtml(label)}</span><span class="analytics-bar-track"><span class="analytics-bar-fill" style="width:${Math.max(3, value/max*100)}%"></span></span><span class="analytics-bar-value">${value}</span></div>`).join("") : '<p class="analytics-empty-note">No captures in this selection.</p>';
}


/* ===== renderAnalyticsConditions  (shadowed-copy)  original lines 1785-1797 ===== */
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


/* ===== renderAnalyticsTimeline  (shadowed-copy)  original lines 1798-1810 ===== */
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


/* ===== renderAnalyticsReadiness  (shadowed-copy)  original lines 1811-1825 ===== */
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


/* ===== renderAnalyticsHikeTable  (shadowed-copy)  original lines 1826-1835 ===== */
function renderAnalyticsHikeTable(sessions) {
  if (!sessions.length) { els.analyticsHikeTable.innerHTML='<p class="analytics-empty-note">No session records in this selection.</p>'; return; }
  const rows = sessions.slice().sort((a,b)=>new Date(b.startedAt||b.startTimestamp||0)-new Date(a.startedAt||a.startTimestamp||0)).map(session => {
    const entries = state.entries.filter(entry => entry.sessionId === session.id);
    const assigned = entries.filter(entry => entry.project).length;
    return `<tr><td>${escapeHtml(session.name || "Untitled hike")}</td><td>${escapeHtml(formatDateTime(session.startTimestamp || session.startedAt))}</td><td>${escapeHtml(formatDuration(sessionDurationMs(session)))}</td><td>${entries.length}</td><td>${escapeHtml(session.weather || "—")}</td><td>${escapeHtml(session.terrain || "—")}</td><td>${assigned}</td></tr>`;
  }).join("");
  els.analyticsHikeTable.innerHTML=`<table><thead><tr><th>Hike</th><th>Started</th><th>Duration</th><th>Entries</th><th>Weather</th><th>Terrain</th><th>In projects</th></tr></thead><tbody>${rows}</tbody></table>`;
}


/* ===== sessionDurationMs  (shadowed-copy)  original lines 1836-1840 ===== */
function sessionDurationMs(session) {
  const start = new Date(session.startTimestamp || session.startedAt || 0).getTime();
  const end = new Date(session.finishTimestamp || session.endedAt || Date.now()).getTime();
  return Number.isFinite(start) && Number.isFinite(end) && end >= start ? end-start : 0;
}

/* ===== averageCaptureGap  (shadowed-copy)  original lines 1841-1845 ===== */
function averageCaptureGap(entries) {
  const times = entries.map(entry=>new Date(entry.capturedAt || entry.createdAt || 0).getTime()).filter(Number.isFinite).sort((a,b)=>a-b);
  if (times.length < 2) return 0;
  return times.slice(1).reduce((sum,time,index)=>sum+(time-times[index]),0)/(times.length-1);
}

/* ===== formatDuration  (shadowed-copy)  original lines 1846-1850 ===== */
function formatDuration(ms) {
  if (!ms || ms < 60000) return ms ? "<1 min" : "0 min";
  const minutes=Math.round(ms/60000), hours=Math.floor(minutes/60), remainder=minutes%60;
  return hours ? `${hours}h ${remainder}m` : `${minutes} min`;
}

/* ===== formatDateTime  (shadowed-copy)  original lines 1851-1855 ===== */
function formatDateTime(value) {
  if (!value) return "—";
  const date=new Date(value); if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString([], {dateStyle:"medium", timeStyle:"short"});
}

/* ===== countValues  (shadowed-copy)  original lines 1856-1858 ===== */
function countValues(values) {
  const map=new Map(); values.filter(Boolean).forEach(value=>map.set(String(value), (map.get(String(value))||0)+1)); return map;
}

/* ===== valuesFromSessionsAndEntries  (shadowed-copy)  original lines 1859-1864 ===== */
function valuesFromSessionsAndEntries(sessions, entries, key) {
  const sessionValues=sessions.map(session=>session[key]).filter(Boolean);
  const entryValues=entries.filter(entry=>!entry.sessionId || !sessions.some(session=>session.id===entry.sessionId)).map(entry=>entry[key]).filter(Boolean);
  return [...sessionValues,...entryValues];
}


/* ===== renderMiniStats  (shadowed-copy)  original lines 1865-1885 ===== */
function renderMiniStats() {
  const entries = state.entries;
  const made = entries.filter(entry => entry.status === "Finished").length;
  const later = entries.filter(entry => entry.action && entry.status !== "Archived").length;
  const photos = entries.filter(entry => entry.image).length;
  const favorites = entries.filter(entry => entry.favorite).length;

  if (!els.miniStats) return;
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


/* ===== renderSessionArchive  (unreachable)  original lines 1953-1976 ===== */
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


/* ===== renderActiveSessionConsole  (unreachable)  original lines 1977-2017 ===== */
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


/* ===== sessionArchiveCard  (unreachable)  original lines 2018-2051 ===== */
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
      ${session.id === state.currentSessionId ? `<button class="secondary compact" data-session-action="close" data-session-id="${session.id}" type="button">Close</button>` : ""}
      <button class="secondary compact" data-session-action="filter" data-session-id="${session.id}" type="button">Journal</button>
      <button class="danger compact" data-session-action="delete" data-session-id="${session.id}" type="button">Delete roll</button>
    </div>`;
  return card;
}


/* ===== handleSessionAction  (unreachable)  original lines 2052-2098 ===== */
function handleSessionAction(event) {
  const button = event.target.closest("[data-session-action]");
  if (!button) return;
  const id = button.dataset.sessionId;
  const action = button.dataset.sessionAction;
  const session = state.sessions.find(item => item.id === id);
  if (!session) return;

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


/* ===== renderJournal  (shadowed-copy)  original lines 2119-2129 ===== */
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


/* ===== entryCard  (shadowed-copy)  original lines 2130-2203 ===== */
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
  const capturedAt = entry.capturedAt || entry.createdAt;
  const date = new Date(capturedAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  meta.append(textSpan(`Captured ${date}`));
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


/* ===== specimenTitle  (unreachable)  original lines 2234-2237 ===== */
function specimenTitle(entry = {}) {
  return entry.specimenName || entry.title || "Unnamed field specimen";
}


/* ===== specimenBlock  (unreachable)  original lines 2250-2275 ===== */
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


/* ===== renderProjectGallery  (unreachable)  original lines 2568-2603 ===== */
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


/* ===== renderStudio  (shadowed-copy)  original lines 2689-2731 ===== */
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
  renderTrailModeConsole();
  renderSessionArchive();
}



/* ===== renderStudioCommandCenter  (unreachable)  original lines 2732-2755 ===== */
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
      <p class="eyebrow">Trail Muse Studio v2.7.8</p>
      <h3>Mobile field notes become a desktop darkroom.</h3>
      <p>Use this command surface after a walk: review the contact sheet, build a series, finish a project, export a journal, and back up the archive before the next roll.</p>
    </div>
    <div class="command-grid">
      ${studioCommandTile("Active roll", sessionLabel, activeSession ? "Review or close the current roll. New rolls can only begin in Muse." : "No roll is active. New rolls can only begin in Muse.", "session", activeSession ? "Review roll" : "Review rolls")}
      ${studioCommandTile("Best spark", topLabel, top ? strongestReason(top) : "Collect a prompt response, thought, photograph, specimen, or discovery first.", top ? "review" : "muse", top ? "Open review" : "Open Muse")}
      ${studioCommandTile("Make-later queue", `${openQueue.length} open item${openQueue.length === 1 ? "" : "s"}`, nextQueueSummary(openQueue), "later", "Develop queue")}
      ${studioCommandTile("Archive backup", backupLabel, "Export JSON after meaningful field sessions so the local archive can be restored or moved to another device.", "backup", "Export backup")}
    </div>`;
}


/* ===== studioCommandTile  (unreachable)  original lines 2756-2764 ===== */
function studioCommandTile(kicker, title, note, command, label) {
  return `<article class="command-tile">
    <p class="eyebrow">${escapeHtml(kicker)}</p>
    <h4>${escapeHtml(title)}</h4>
    <p>${escapeHtml(note)}</p>
    <button class="secondary compact" data-studio-command="${escapeHtml(command)}" type="button">${escapeHtml(label)}</button>
  </article>`;
}


/* ===== nextQueueSummary  (unreachable)  original lines 2765-2776 ===== */
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


/* ===== renderStudioWorkflow  (unreachable)  original lines 2777-2850 ===== */
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
      note: state.currentSessionId ? "A field session is active. Review or close it here; begin new rolls only in Muse." : "No field session is active. Studio is review-only; begin new rolls in Muse.",
      status: state.sessions.length ? "good" : "idle",
      command: "session",
      label: "Review rolls"
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


/* ===== workflowItem  (unreachable)  original lines 2851-2857 ===== */
function workflowItem({ title, value, note, status, command, label }) {
  return `<article class="workflow-item ${escapeHtml(status || "idle")}">
    <div><p class="eyebrow">${escapeHtml(title)}</p><h4>${escapeHtml(value)}</h4><p>${escapeHtml(note)}</p></div>
    <button class="secondary compact" data-studio-command="${escapeHtml(command)}" type="button">${escapeHtml(label)}</button>
  </article>`;
}


/* ===== renderSeriesBuilder  (unreachable)  original lines 2858-2899 ===== */
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


/* ===== collectSeriesGroups  (unreachable)  original lines 2900-2933 ===== */
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


/* ===== suggestedStudioMove  (unreachable)  original lines 2934-2942 ===== */
function suggestedStudioMove(entry) {
  if (entry.finishedNote || entry.status === "Finished") return "Export this series or write a short caption for the finished work.";
  if (!entry.nextStep && entry.action) return `Add a concrete next step for “${entry.action}.”`;
  if (entry.energy === "Tiny edit") return "This looks like a low-energy quick win. Do it before opening a larger project.";
  if (entry.status === "Raw Capture") return "Review this top spark first: circle, reject, or move it into development.";
  if (entry.image) return "Use the contact print as the anchor image and write a caption or edit note.";
  return entry.nextStep || entry.action || "Develop this into a small finished artifact.";
}


/* ===== renderStudioReviewControls  (unreachable)  original lines 3013-3025 ===== */
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


/* ===== reviewCard  (unreachable)  original lines 3146-3188 ===== */
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


/* ===== renderSpecimenGallery  (unreachable)  original lines 3189-3231 ===== */
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


/* ===== countUniqueTags  (unreachable)  original lines 3232-3235 ===== */
function countUniqueTags() {
  return new Set(state.entries.flatMap(entry => splitTags(entry.tags).map(tag => tag.toLowerCase()))).size;
}


/* ===== renderTagCloud  (unreachable)  original lines 3236-3258 ===== */
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


/* ===== exportSpecimenCards  (unreachable)  original lines 3498-3551 ===== */
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
<header><p>Field Instrument 077 · Trail Muse v2.7.8</p><h1>Specimen Card Sheet</h1><p>${specimens.length} found object card${specimens.length === 1 ? "" : "s"}. Natural objects are treated as observations first: photograph, sketch, describe, and leave in place unless collecting is allowed and appropriate.</p></header>
<main class="sheet">${cards}</main>
</body>
</html>`;
  downloadText(`trail-muse-specimen-cards-${dateStamp()}.html`, html, "text/html");
}


/* ===== exportMakeLaterPlan  (unreachable)  original lines 3552-3604 ===== */
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
  <p>Field Instrument 077 · Trail Muse v2.7.8</p>
  <h1>Make-Later Plan</h1>
  <p>${queue.length} queued creative follow-up${queue.length === 1 ? "" : "s"} across ${projects.length} project group${projects.length === 1 ? "" : "s"}. Sorted by follow-up score, priority, energy, and review strength.</p>
</header>
${sections}
</body>
</html>`;
  downloadText(`trail-muse-make-later-plan-${dateStamp()}.html`, html, "text/html");
}


/* ===== loadSampleTrail  (unreachable)  original lines 4034-4170 ===== */
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


/* ===== projectByName  (unreachable)  original lines 4610-4614 ===== */
function projectByName(name) {
  const key = String(name || "").trim().toLowerCase();
  return (state.projects || []).find(project => project.name.toLowerCase() === key) || null;
}



/* ===== second pass: dead after removing no-op bindings ===== */

/* ----- renderFollowupEngine  original lines 1935-1999 ----- */
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


/* ----- followupPillsHtml  original lines 2000-2008 ----- */
function followupPillsHtml(entry) {
  return [
    entry.action,
    `priority: ${entry.priority || "Normal"}`,
    `energy: ${entry.energy || "One sitting"}`,
    entry.project ? `project: ${entry.project}` : ""
  ].filter(Boolean).map(value => `<span class="entry-action">${escapeHtml(value)}</span>`).join("");
}


/* ----- renderLaterBoard  original lines 2067-2096 ----- */
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


/* ----- laterCard  original lines 2097-2139 ----- */
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


/* ----- nextLaterStatus  original lines 2140-2145 ----- */
function nextLaterStatus(status) {
  const index = laterColumns.indexOf(status);
  if (index < 0) return "Develop Further";
  return laterColumns[Math.min(index + 1, laterColumns.length - 1)];
}


/* ----- statusButton  original lines 2146-2151 ----- */
function statusButton(label, id, status) {
  const button = actionButton(label, "status", id);
  button.dataset.status = status;
  return button;
}


/* ----- renderStudioReview  original lines 2222-2239 ----- */
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


/* ----- getStudioReviewEntries  original lines 2240-2251 ----- */
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


/* ----- renderBestSparksSummary  original lines 2274-2317 ----- */
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


/* ----- bestSessionName  original lines 2318-2329 ----- */
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


/* ----- startSession  original lines 2346-2387 ----- */
function startSession() {
  if (state.currentSessionId) {
    const active = getCurrentSession();
    const ok = confirm(`Start a new exposure roll? The active roll${active?.name ? ` “${active.name}”` : ""} will be closed first.`);
    if (!ok) return;
    state.sessions = state.sessions.map(session => session.id === state.currentSessionId ? { ...session, endedAt: new Date().toISOString(), finishTimestamp: new Date().toISOString() } : session);
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
    endedAt: null,
    startTimestamp: new Date().toISOString(),
    finishTimestamp: null
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


/* ----- exportSessionHtml  original lines 2928-3001 ----- */
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
  <p>Field Instrument 077 · Trail Muse · v2.7.8 Exposure Roll Export</p>
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

