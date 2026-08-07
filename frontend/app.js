const DATA_BASE = "https://raw.githubusercontent.com/cutejessli/oneness-scripture-data/main";
const MANIFEST_URL = `${DATA_BASE}/metadata/library-index.json`;

const els = {
  sidebar: document.querySelector("#sidebar"),
  openSidebar: document.querySelector("#openSidebar"),
  closeSidebar: document.querySelector("#closeSidebar"),
  libraryStats: document.querySelector("#libraryStats"),
  bookSearch: document.querySelector("#bookSearch"),
  showUpcoming: document.querySelector("#showUpcoming"),
  bookLibrary: document.querySelector("#bookLibrary"),
  sectionLabel: document.querySelector("#sectionLabel"),
  chapterTitle: document.querySelector("#chapterTitle"),
  controlBar: document.querySelector("#controlBar"),
  chapterSelect: document.querySelector("#chapterSelect"),
  prevChapter: document.querySelector("#prevChapter"),
  nextChapter: document.querySelector("#nextChapter"),
  prevChapterBottom: document.querySelector("#prevChapterBottom"),
  nextChapterBottom: document.querySelector("#nextChapterBottom"),
  layerButtons: [...document.querySelectorAll("[data-layer]")],
  chapterView: document.querySelector("#chapterView"),
  statusStrip: document.querySelector("#statusStrip"),
  verseList: document.querySelector("#verseList"),
  notesPanel: document.querySelector("#notesPanel"),
  errorCard: document.querySelector("#errorCard"),
  errorMessage: document.querySelector("#errorMessage"),
  retryButton: document.querySelector("#retryButton"),
  themeToggle: document.querySelector("#themeToggle"),
};

const state = {
  manifest: null,
  book: null,
  chapter: null,
  layer: "restored",
  source: null,
  mystical: null,
};

function padChapter(n) {
  return String(n).padStart(3, "0");
}

function parseHash() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ""));
  return {
    book: params.get("book"),
    chapter: Number(params.get("chapter")) || null,
    layer: ["restored", "mystical", "both"].includes(params.get("layer")) ? params.get("layer") : null,
  };
}

function writeHash() {
  if (!state.book || !state.chapter) return;
  const params = new URLSearchParams({ book: state.book.id, chapter: String(state.chapter), layer: state.layer });
  history.replaceState(null, "", `#${params.toString()}`);
}

function chapterPath(bookId, chapter, mystical = false) {
  const num = padChapter(chapter);
  return mystical
    ? `${DATA_BASE}/scripture/${bookId}/mystical/${bookId}-${num}-mystical.json`
    : `${DATA_BASE}/scripture/${bookId}/${bookId}-${num}.json`;
}

async function fetchJson(url) {
  const response = await fetch(`${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function sectionKey(book) {
  return `${book.testament} · ${book.section}`;
}

function renderLibrary() {
  const query = els.bookSearch.value.trim().toLowerCase();
  const showUpcoming = els.showUpcoming.checked;
  const books = state.manifest.books
    .filter((book) => showUpcoming || book.restoredCount > 0)
    .filter((book) => !query || book.name.toLowerCase().includes(query));

  els.bookLibrary.innerHTML = "";
  const groups = new Map();
  for (const book of books) {
    const key = sectionKey(book);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(book);
  }

  for (const [label, groupBooks] of groups.entries()) {
    const section = document.createElement("section");
    section.className = "library-group";
    const heading = document.createElement("h3");
    heading.textContent = label;
    section.appendChild(heading);

    groupBooks.sort((a, b) => a.order - b.order).forEach((book) => {
      const button = document.createElement("button");
      button.className = `book-button${state.book?.id === book.id ? " active" : ""}${book.restoredCount ? "" : " upcoming"}`;
      button.disabled = !book.restoredCount;
      button.innerHTML = `<span>${book.name}</span><span class="book-meta">${book.restoredCount ? `${book.restoredCount}/${book.chapterCount}` : "upcoming"}</span>`;
      button.addEventListener("click", () => selectBook(book));
      section.appendChild(button);
    });

    els.bookLibrary.appendChild(section);
  }
}

function renderStats() {
  const stats = state.manifest.stats;
  els.libraryStats.textContent = `${stats.booksLive} books live · ${stats.restoredChaptersLive} restored chapters · ${stats.mysticalChaptersLive} mystical companions`;
}

function availableChapters(book) {
  return (book.availableChapters || []).filter(Number.isFinite).sort((a, b) => a - b);
}

function renderChapterSelect() {
  const chapters = availableChapters(state.book);
  els.chapterSelect.innerHTML = chapters.map((n) => `<option value="${n}">Chapter ${n}</option>`).join("");
  els.chapterSelect.value = String(state.chapter);

  const index = chapters.indexOf(state.chapter);
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < chapters.length - 1;
  [els.prevChapter, els.prevChapterBottom].forEach((el) => el.disabled = !hasPrev);
  [els.nextChapter, els.nextChapterBottom].forEach((el) => el.disabled = !hasNext);
}

async function selectBook(book, preferredChapter = null) {
  const chapters = availableChapters(book);
  if (!chapters.length) return;
  state.book = book;
  state.chapter = chapters.includes(preferredChapter) ? preferredChapter : chapters[0];
  renderLibrary();
  closeSidebar();
  await loadChapter();
}

function moveChapter(delta) {
  const chapters = availableChapters(state.book);
  const index = chapters.indexOf(state.chapter);
  const next = chapters[index + delta];
  if (next) {
    state.chapter = next;
    loadChapter();
  }
}

async function loadChapter() {
  if (!state.book || !state.chapter) return;
  state.source = null;
  state.mystical = null;
  showLoadingState();

  const needsSource = state.layer === "restored" || state.layer === "both";
  const hasMystical = state.book.mysticalChapters?.includes(state.chapter);
  const needsMystical = (state.layer === "mystical" || state.layer === "both") && hasMystical;

  try {
    const [source, mystical] = await Promise.all([
      needsSource ? fetchJson(chapterPath(state.book.id, state.chapter, false)) : Promise.resolve(null),
      needsMystical ? fetchJson(chapterPath(state.book.id, state.chapter, true)) : Promise.resolve(null),
    ]);
    state.source = source;
    state.mystical = mystical;
    renderChapter();
    writeHash();
    window.scrollTo({ top: 0, behavior: "instant" });
  } catch (error) {
    showError(error);
  }
}

function showLoadingState() {
  els.errorCard.hidden = true;
  els.chapterView.hidden = false;
  els.controlBar.hidden = false;
  els.verseList.innerHTML = `<div class="status-strip">Loading ${state.book.name} ${state.chapter}…</div>`;
  els.notesPanel.innerHTML = "";
  els.chapterTitle.textContent = `${state.book.name} ${state.chapter}`;
  els.sectionLabel.textContent = `${state.book.testament} · ${state.book.section}`;
  renderChapterSelect();
}

function verseMap(data, key) {
  const map = new Map();
  for (const verse of data?.verses || []) map.set(Number(verse.verse), verse[key] ?? "");
  return map;
}

function renderChapter() {
  const sourceMap = verseMap(state.source, "restored");
  const mysticalMap = verseMap(state.mystical, "mystical_translation");
  const verseNumbers = [...new Set([...sourceMap.keys(), ...mysticalMap.keys()])].sort((a, b) => a - b);

  els.chapterTitle.textContent = `${state.book.name} ${state.chapter}`;
  els.sectionLabel.textContent = `${state.book.testament} · ${state.book.section}`;
  els.controlBar.hidden = false;
  els.errorCard.hidden = true;
  els.chapterView.hidden = false;

  const audit = state.source?.audit_status?.status || state.book.status || "draft";
  const mysticalAvailable = state.book.mysticalChapters?.includes(state.chapter);
  els.statusStrip.textContent = `${audit.replaceAll("-", " ")}${mysticalAvailable ? " · mystical companion available" : ""}`;

  els.verseList.innerHTML = "";
  for (const number of verseNumbers) {
    const row = document.createElement("section");
    row.className = "verse";
    const num = document.createElement("div");
    num.className = "verse-number";
    num.textContent = number;
    const content = document.createElement("div");

    if (state.layer === "both") {
      content.className = "verse-both";
      content.innerHTML = `
        <div><span class="layer-label">Restored</span><p class="verse-text">${escapeHtml(sourceMap.get(number) || "")}</p></div>
        <div><span class="layer-label">Mystical</span><p class="verse-text mystical-text">${escapeHtml(mysticalMap.get(number) || "")}</p></div>`;
    } else {
      const text = state.layer === "mystical" ? mysticalMap.get(number) : sourceMap.get(number);
      content.innerHTML = `<p class="verse-text${state.layer === "mystical" ? " mystical-text" : ""}">${escapeHtml(text || "")}</p>`;
    }
    row.append(num, content);
    els.verseList.appendChild(row);
  }

  renderNotes();
  renderChapterSelect();
  els.layerButtons.forEach((button) => button.classList.toggle("active", button.dataset.layer === state.layer));
}

function renderNotes() {
  const sourceNotes = state.source?.translation_notes || [];
  const safety = state.source?.safety_note;
  const witness = state.source?.source_witness_audit_flags || [];
  const contemplative = state.mystical?.contemplative_note;

  const sections = [];
  if (sourceNotes.length) sections.push(details("Translation notes", `<ul>${sourceNotes.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>`));
  if (witness.length) sections.push(details("Source / witness audit flags", `<ul>${witness.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}</ul>`));
  if (safety) sections.push(details("Editorial safeguard", `<p>${escapeHtml(safety)}</p>`));
  if (contemplative) sections.push(details("Contemplative note", `<p>${escapeHtml(contemplative)}</p>`));
  els.notesPanel.innerHTML = sections.join("");
}

function details(title, html) {
  return `<details><summary>${escapeHtml(title)}</summary><div class="notes-content">${html}</div></details>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showError(error) {
  els.chapterView.hidden = true;
  els.errorCard.hidden = false;
  els.errorMessage.textContent = `The repository returned: ${error.message}.`;
}

function closeSidebar() {
  els.sidebar.classList.remove("open");
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("oneness-scripture-theme", theme);
}

function setupEvents() {
  els.openSidebar.addEventListener("click", () => els.sidebar.classList.add("open"));
  els.closeSidebar.addEventListener("click", closeSidebar);
  els.bookSearch.addEventListener("input", renderLibrary);
  els.showUpcoming.addEventListener("change", renderLibrary);
  els.chapterSelect.addEventListener("change", () => {
    state.chapter = Number(els.chapterSelect.value);
    loadChapter();
  });
  [els.prevChapter, els.prevChapterBottom].forEach((el) => el.addEventListener("click", () => moveChapter(-1)));
  [els.nextChapter, els.nextChapterBottom].forEach((el) => el.addEventListener("click", () => moveChapter(1)));
  els.layerButtons.forEach((button) => button.addEventListener("click", () => {
    state.layer = button.dataset.layer;
    loadChapter();
  }));
  els.retryButton.addEventListener("click", loadChapter);
  els.themeToggle.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "light";
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

async function init() {
  setupEvents();
  const savedTheme = localStorage.getItem("oneness-scripture-theme");
  if (savedTheme) applyTheme(savedTheme);
  else if (matchMedia("(prefers-color-scheme: dark)").matches) applyTheme("dark");
  else applyTheme("light");

  try {
    state.manifest = await fetchJson(MANIFEST_URL);
    renderStats();
    renderLibrary();

    const hash = parseHash();
    if (hash.layer) state.layer = hash.layer;
    const requestedBook = state.manifest.books.find((item) => item.id === hash.book && item.restoredCount > 0);
    const firstLiveBook = state.manifest.books.find((item) => item.restoredCount > 0);
    const book = requestedBook || firstLiveBook;
    if (book) await selectBook(book, requestedBook ? hash.chapter : null);
  } catch (error) {
    els.libraryStats.textContent = "Library unavailable";
    showError(error);
  }
}

init();
