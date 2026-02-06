import { shoseijutsuData } from "../data/index.js";

const areaLabels = {
  life: "人生",
  thinking: "思考",
  people: "対人",
  skill: "スキル",
  achievement: "達成",
};

const searchInput = document.getElementById("global-search-input");
const countLabel = document.getElementById("global-search-count");
const emptyState = document.getElementById("global-search-empty");
const panels = document.querySelectorAll("[data-search-panel]");
const buttons = Array.from(document.querySelectorAll("[data-search-type]"));
const techniqueResults = document.getElementById("global-technique-results");
const theoryResults = document.getElementById("global-theory-results");

const searchConfig = {
  technique: {
    placeholder: "例：会話、仕事、断る、迷い",
  },
  theory: {
    placeholder: "例：認知、判断、バイアス、習慣",
  },
};

const normalizeText = (value) => value.toLowerCase();
const normalize = (value) => value.toLowerCase().trim();

const buildTechniqueItems = () =>
  // New schema (data/techniques/all-techniques.js)
  Array.isArray(shoseijutsuData.techniques?.categories)
    ? shoseijutsuData.techniques.categories.flatMap((category) =>
        (category.subcategories ?? []).flatMap((group) =>
          (group.items ?? []).map((item, index) => ({
            type: "technique",
            areaKey: category.key,
            areaLabel: areaLabels[category.key] ?? category.name ?? category.key,
            groupName: group.name,
            groupKey: `${category.key}:${group.name}`,
            id: item.id ?? `${category.key}-${index + 1}`,
            title: item.title,
            subtitle: item.subtitle ?? "",
            searchText: `${group.name} ${item.title} ${item.subtitle ?? ""} ${
              areaLabels[category.key] ?? category.name ?? category.key
            } ${item.theoryTagIds?.join(" ") ?? ""}`,
          }))
        )
      )
    : // Legacy schema fallback
      Object.entries(shoseijutsuData.techniques).flatMap(([areaKey, section]) =>
        (section.items ?? []).flatMap((group) =>
          (group.details ?? []).map((detail) => ({
            type: "technique",
            areaKey,
            areaLabel: areaLabels[areaKey] ?? section.title ?? areaKey,
            groupName: group.name,
            groupKey: `${areaKey}:${group.name}`,
            id: detail.id,
            title: detail.title,
            subtitle: detail.subtitle,
            searchText: `${group.name} ${detail.title} ${detail.subtitle} ${
              areaLabels[areaKey] ?? section.title ?? areaKey
            }`,
          }))
        )
      );

const categoryMap = new Map(
  Object.values(shoseijutsuData.foundation).map((category) => [category.id, category])
);
const orderedCategoryIds = ["cognition", "behavior", "social", "structure", "wisdom"];
const categories = orderedCategoryIds
  .map((id) => categoryMap.get(id))
  .filter(Boolean);

const buildTheoryItems = () =>
  categories.flatMap((category) =>
    category.items.map((item) => ({
      type: "theory",
      categoryId: category.id,
      categoryTitle: category.title,
      tagId: item.tagId,
      title: item.title,
      summary: item.summary,
      definition: item.definition,
      keyPoints: item.keyPoints ?? [],
      pitfalls: item.pitfalls ?? [],
      strategies: item.strategies ?? [],
      applicationConditions: item.applicationConditions ?? [],
    }))
  );

const techniqueItems = buildTechniqueItems();
const theoryItems = buildTheoryItems();

const compactTitle = (value) =>
  value
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const buildTechniqueSearchText = (item) => normalizeText(item.searchText);

const buildTheorySearchText = (item) =>
  normalizeText(
    [
      item.tagId,
      item.title,
      item.summary,
      item.definition,
      item.categoryTitle,
      ...(item.keyPoints ?? []),
      ...(item.pitfalls ?? []),
      ...(item.strategies ?? []),
      ...(item.applicationConditions ?? []),
    ]
      .filter(Boolean)
      .join(" ")
  );

const matchesQuery = (text, query) => {
  if (!query) {
    return true;
  }
  const terms = query.split(/\s+/).filter(Boolean);
  return terms.every((term) => text.includes(normalizeText(term)));
};

const renderTechniqueResults = (items) => {
  techniqueResults.innerHTML = items
    .map((item) => {
      const groupUrl = `group.html?group=${encodeURIComponent(item.groupKey)}`;
      return `
        <li>
          <a class="index-result-card link-card" href="${groupUrl}">
            <div class="index-result-header">
              <span class="badge">No.${item.id}</span>
              <h3 class="index-result-title">${item.title}</h3>
            </div>
            <p class="index-result-summary">${item.subtitle}</p>
            <div class="tag-list tag-list--compact">
              <span class="tag tag--compact">${item.areaLabel}</span>
              <span class="tag tag--compact">${item.groupName}</span>
            </div>
          </a>
        </li>
      `;
    })
    .join("");
};

const renderTheoryResults = (items) => {
  theoryResults.innerHTML = items
    .map((item) => {
      const encodedTag = encodeURIComponent(item.tagId);
      const shortTitle = compactTitle(item.title);
      return `
        <a class="detail-card link-card theory-card theory-card--${item.categoryId}" href="theory/${encodedTag}/">
          <div class="theory-card-head">
            <span class="theory-card-tag">${item.tagId}</span>
            <span class="theory-card-title">${shortTitle}</span>
          </div>
          <p class="theory-card-summary">${item.summary}</p>
        </a>
      `;
    })
    .join("");
};

let activeType = "technique";

const updatePanels = () => {
  panels.forEach((panel) => {
    const isActive = panel.dataset.searchPanel === activeType;
    panel.classList.toggle("is-hidden", !isActive);
  });
  buttons.forEach((button) => {
    const isSelected = button.dataset.searchType === activeType;
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
    button.setAttribute("aria-selected", isSelected ? "true" : "false");
    button.setAttribute("tabindex", isSelected ? "0" : "-1");
  });
  const placeholder = searchConfig[activeType]?.placeholder ?? "";
  if (searchInput) {
    searchInput.placeholder = placeholder;
  }
};

const renderResults = () => {
  if (!searchInput || !countLabel || !emptyState) {
    return;
  }
  const query = normalize(searchInput.value ?? "");
  if (activeType === "technique") {
    const filtered = techniqueItems.filter((item) =>
      matchesQuery(buildTechniqueSearchText(item), query)
    );
    renderTechniqueResults(filtered);
    countLabel.textContent = `該当件数：${filtered.length}件`;
    emptyState.classList.toggle("is-hidden", filtered.length > 0);
  } else {
    const filtered = theoryItems.filter((item) =>
      matchesQuery(buildTheorySearchText(item), query)
    );
    renderTheoryResults(filtered);
    countLabel.textContent = `該当件数：${filtered.length}件`;
    emptyState.classList.toggle("is-hidden", filtered.length > 0);
  }
};

const setActiveType = (type) => {
  if (!searchConfig[type]) {
    return;
  }
  activeType = type;
  updatePanels();
  renderResults();
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set("type", type);
  window.history.replaceState({}, "", nextUrl);
};

const initFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");
  if (type && searchConfig[type]) {
    activeType = type;
  }
};

const initQueryFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");
  if (query && searchInput) {
    searchInput.value = query;
  }
};

buttons.forEach((button) => {
  const activate = () => setActiveType(button.dataset.searchType);
  button.addEventListener("click", activate);
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  });
});

searchInput?.addEventListener("input", renderResults);

initFromUrl();
initQueryFromUrl();
updatePanels();
renderResults();
