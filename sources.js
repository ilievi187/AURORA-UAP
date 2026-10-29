const REGIONS = ["all", "europe", "americas", "asia-pacific", "middle-east-africa", "global"];
const ROLE_LABELS = {
  "official-institution": "Официална институция / Official",
  "public-broadcaster": "Обществен оператор / Broadcaster",
  "international-desk": "Редакция / News desk",
  "specialist-press": "Специализирана редакция / Specialist"
};

const regionSelect = document.querySelector("#sourceRegion");
const sourceStatus = document.querySelector("#sourceStatus");
const sourceList = document.querySelector("#sourceList");
const matchStatus = document.querySelector("#matchStatus");
const matchList = document.querySelector("#matchList");
const reloadButton = document.querySelector("#reloadMatches");
const healthButton = document.querySelector("#checkHealth");
const healthStatus = document.querySelector("#healthStatus");
const healthList = document.querySelector("#healthList");

let catalog = [];
let requestId = 0;
let healthRequestId = 0;

const HEALTH_ERRORS = {
  timeout: "изтекло време",
  network: "няма връзка",
  server: "грешка на издателя",
  status: "отказан отговор",
  redirect: "недопустимо пренасочване",
  size: "твърде голям отговор",
  format: "не е RSS, Atom или RDF"
};

function safeHttps(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function setStatus(node, state, text) {
  node.dataset.state = state;
  node.textContent = text;
}

function renderCatalog() {
  const region = regionSelect.value;
  const visible = catalog.filter((entry) => region === "all" || entry.region === region);
  sourceList.replaceChildren();
  if (!visible.length) {
    sourceList.append(el("p", "source-note", "Няма източници за този регион."));
    return;
  }
  for (const entry of visible) {
    const card = el("article", "live-card");
    card.append(el("p", "live-meta", `${entry.country_name} · ${entry.language}`));
    card.append(el("h3", "", entry.publisher));
    const badges = el("div", "source-badges");
    badges.append(el("span", "", ROLE_LABELS[entry.role] || entry.role));
    badges.append(el("span", "", entry.format.toUpperCase()));
    badges.append(el("span", "", entry.preview ? "В прегледа / Preview" : "Само в каталога / Catalog"));
    card.append(badges);
    card.append(el("p", "", entry.covers));
    if (entry.note) card.append(el("p", "source-note", entry.note));
    const actions = el("div", "source-actions");
    const home = safeHttps(entry.homepage);
    const feed = safeHttps(entry.feed_url);
    if (home) {
      const link = el("a", "", "Сайт на издателя");
      link.href = home;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      actions.append(link);
    }
    if (feed) {
      const link = el("a", "", "Официален фийд");
      link.href = feed;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      actions.append(link);
    }
    card.append(actions);
    sourceList.append(card);
  }
}

function resetHealth() {
  healthRequestId += 1;
  healthList.replaceChildren();
  setStatus(healthStatus, "ready", "Още не е правена проверка на състоянието.");
}

function renderHealth(payload) {
  healthList.replaceChildren();
  if (payload.status === "empty_region") {
    setStatus(healthStatus, "ready", "Няма източници за този регион.");
    return;
  }
  if (payload.status === "unavailable") {
    setStatus(healthStatus, "error", "Избраните източници не върнаха валиден фийд.");
  } else {
    const live = (payload.sources || []).filter((row) => row.availability === "live").length;
    setStatus(healthStatus, "ready", `${live} от ${(payload.sources || []).length} отговориха с RSS, Atom или RDF. Това не е брой наблюдения.`);
  }
  for (const row of payload.sources || []) {
    const card = el("article", "live-card");
    card.append(el("h3", "", row.publisher || row.id || "Източник"));
    const bits = [
      `HTTP ${Number(row.http_status) || 0}`,
      `${Number(row.elapsed_ms) || 0} ms`,
      row.format ? String(row.format).toUpperCase() : "",
      row.availability === "live" ? `${Number(row.accepted) || 0} заглавия` : (HEALTH_ERRORS[row.error] || "недостъпен"),
      Number(row.duplicate_titles) > 0 ? `${row.duplicate_titles} повторения` : ""
    ].filter(Boolean);
    card.append(el("p", "live-meta", bits.join(" · ")));
    if (row.feed_host) card.append(el("p", "source-note", `Издателски адрес: ${row.feed_host}`));
    healthList.append(card);
  }
}

async function loadHealth() {
  const token = ++healthRequestId;
  const region = REGIONS.includes(regionSelect.value) ? regionSelect.value : "all";
  setStatus(healthStatus, "loading", "Проверка на достъпността…");
  healthList.replaceChildren();
  healthButton.disabled = true;
  healthButton.setAttribute("aria-busy", "true");
  try {
    const response = await fetch(`/api/source-health?region=${encodeURIComponent(region)}`, {cache: "no-store"});
    const payload = await response.json();
    if (token !== healthRequestId) return;
    if (!response.ok && payload.status !== "unavailable") throw new Error("health");
    renderHealth(payload);
  } catch {
    if (token !== healthRequestId) return;
    setStatus(healthStatus, "error", "Проверката на състоянието не успя. Няма добавени заглавия.");
  } finally {
    if (token === healthRequestId) {
      healthButton.disabled = false;
      healthButton.removeAttribute("aria-busy");
    }
  }
}

function renderMatches(payload) {
  matchList.replaceChildren();
  const names = new Map(catalog.map((entry) => [entry.id, entry.publisher]));
  const checked = (payload.checked || []).map((id) => names.get(id) || id).join(", ");
  if (payload.status === "unavailable") {
    setStatus(matchStatus, "error", "Източниците не отговориха. Каталогът остава достъпен, без добавени заглавия.");
    return;
  }
  if (payload.status === "empty_region") {
    setStatus(matchStatus, "ready", "Няма източници за този регион. Няма добавени заглавия.");
    return;
  }
  if (!payload.items?.length) {
    setStatus(matchStatus, "ready", `Няма съвпадения по UAP, UFO, OVNI, AARO или НЛО. Проверени: ${checked}`);
    return;
  }
  setStatus(matchStatus, "ready", `${payload.items.length} съвпадения. Това са заглавия от издателите, не потвърдени случаи. Проверени: ${checked}`);
  for (const item of payload.items) {
    const href = safeHttps(item.url);
    if (!href) continue;
    const card = el("article", "live-card");
    const when = Number.isFinite(Date.parse(item.published)) ? new Date(item.published).toLocaleString("bg") : "";
    card.append(el("p", "live-meta", [item.source, when].filter(Boolean).join(" · ")));
    const heading = el("h3");
    const link = el("a", "", item.title);
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    heading.append(link);
    card.append(heading);
    matchList.append(card);
  }
}

async function loadMatches() {
  const token = ++requestId;
  const region = REGIONS.includes(regionSelect.value) ? regionSelect.value : "all";
  setStatus(matchStatus, "loading", "Проверка на официалните фийдове…");
  matchList.replaceChildren();
  reloadButton.disabled = true;
  reloadButton.setAttribute("aria-busy", "true");
  try {
    const response = await fetch(`/api/discovery?region=${encodeURIComponent(region)}`, {cache: "no-store"});
    const payload = await response.json();
    if (token !== requestId) return;
    if (!response.ok && payload.status !== "unavailable") throw new Error("discovery");
    renderMatches(payload);
  } catch {
    if (token !== requestId) return;
    setStatus(matchStatus, "error", "Проверката не успя. Няма добавени заглавия.");
  } finally {
    if (token === requestId) {
      reloadButton.disabled = false;
      reloadButton.removeAttribute("aria-busy");
    }
  }
}

async function loadCatalog() {
  try {
    const response = await fetch("/api/sources", {cache: "no-store"});
    if (!response.ok) throw new Error("sources");
    const payload = await response.json();
    catalog = Array.isArray(payload.sources) ? payload.sources : [];
    if (!catalog.length) throw new Error("empty");
    setStatus(sourceStatus, "ready", `${catalog.length} проверени източника · ${payload.checked_on || ""}`);
    renderCatalog();
    await loadMatches();
  } catch {
    catalog = [];
    setStatus(sourceStatus, "error", "Каталогът не се зареди. Няма показвани източници или заглавия.");
  }
}

regionSelect.addEventListener("change", () => {
  renderCatalog();
  resetHealth();
  loadMatches();
});
reloadButton.addEventListener("click", loadMatches);
healthButton.addEventListener("click", loadHealth);
loadCatalog();
