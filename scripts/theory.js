import { shoseijutsuData } from "../data/index.js";

const categoryMap = new Map(
  Object.values(shoseijutsuData.foundation).map((category) => [category.id, category])
);
const orderedCategoryIds = ["cognition", "behavior", "social", "structure", "wisdom"];
const categories = orderedCategoryIds
  .map((id) => categoryMap.get(id))
  .filter(Boolean);

const searchInput = document.getElementById("foundation-search");
const searchBox = document.getElementById("foundation-search-box");
const tabsContainer = document.getElementById("foundation-tabs");
const resultsContainer = document.getElementById("foundation-results");
const emptyState = document.getElementById("foundation-empty");
const countLabel = document.getElementById("foundation-count");

const tabOptions = [
  { key: "index", label: "索引" },
  ...categories.map((category) => ({
    key: category.id,
    label: category.title,
  })),
];

const scrollStoragePrefix = "theory-scroll:";
const currentScrollTarget = () => {
  const pageName = window.location.pathname.split("/").pop() || "theory.html";
  return `${pageName}${window.location.search}`;
};

const params = new URLSearchParams(window.location.search);
const initialTab = params.get("tab");
const isValidTab = (value) => tabOptions.some((option) => option.key === value);
let activeCategory = isValidTab(initialTab) ? initialTab : "index";

const normalize = (value) => value.toLowerCase().trim();
const compactTitle = (value) =>
  value
    .replace(/（[^）]*）/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

const isIndexActive = () => activeCategory === "index";

const renderTabs = () => {
  tabsContainer.innerHTML = "";
  tabOptions.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab tab-button";
    button.dataset.category = option.key;
    button.setAttribute("aria-pressed", option.key === activeCategory ? "true" : "false");
    button.textContent = option.label;
    button.addEventListener("click", () => {
      activeCategory = option.key;
      if (!isIndexActive()) {
        searchInput.value = "";
      }
      renderTabs();
      renderCards();
    });
    tabsContainer.appendChild(button);
  });

  if (isIndexActive()) {
    searchBox.classList.remove("is-hidden");
    searchInput.disabled = false;
  } else {
    searchBox.classList.add("is-hidden");
    searchInput.disabled = true;
  }
};

const matchesFilter = (item, keyword) => {
  if (!isIndexActive() && activeCategory && item.categoryId !== activeCategory) {
    return false;
  }
  if (!keyword || !isIndexActive()) {
    return true;
  }
  const searchable = [
    item.tagId,
    item.title,
    item.summary,
    item.definition,
    ...(item.keyPoints ?? []),
    ...(item.pitfalls ?? []),
    ...(item.strategies ?? []),
    ...(item.applicationConditions ?? []),
  ]
    .filter(Boolean)
    .join(" ");
  return normalize(searchable).includes(keyword);
};

const renderCards = () => {
  const keyword = normalize(searchInput.value);
  const allItems = categories.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      categoryId: category.id,
      categoryTitle: category.title,
    }))
  );

  const filtered = allItems.filter((item) => matchesFilter(item, keyword));
  resultsContainer.innerHTML = filtered
    .map((item) => {
      const encodedTag = encodeURIComponent(item.tagId);
      const shortTitle = compactTitle(item.title);
      const backTarget = encodeURIComponent(`theory.html?tab=${encodeURIComponent(activeCategory)}`);
      return `
        <a class="detail-card link-card theory-card theory-card--${item.categoryId}" href="theory-card.html?tag=${encodedTag}&back=${backTarget}">
          <div class="theory-card-head">
            <span class="theory-card-tag">${item.tagId}</span>
            <span class="theory-card-title">${shortTitle}</span>
          </div>
          <p class="theory-card-summary">${item.summary}</p>
        </a>
      `;
    })
    .join("");

  const hasResults = filtered.length > 0;
  resultsContainer.classList.toggle("is-hidden", !hasResults);
  emptyState.classList.toggle("is-hidden", hasResults);
  countLabel.textContent = `全${filtered.length}件`;
};

searchInput.addEventListener("input", renderCards);
resultsContainer.addEventListener("click", (event) => {
  const link = event.target.closest("a.detail-card");
  if (!link) {
    return;
  }
  const url = new URL(link.href, window.location.origin);
  const backParam = url.searchParams.get("back");
  if (!backParam) {
    return;
  }
  const storageKey = `${scrollStoragePrefix}${backParam}`;
  sessionStorage.setItem(storageKey, String(window.scrollY));
});

const restoreScrollPosition = () => {
  const storageKey = `${scrollStoragePrefix}${currentScrollTarget()}`;
  const stored = sessionStorage.getItem(storageKey);
  if (!stored) {
    return;
  }
  sessionStorage.removeItem(storageKey);
  window.scrollTo(0, Number(stored));
};

renderTabs();
renderCards();
restoreScrollPosition();
