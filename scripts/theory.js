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

let activeCategory = "index";

const normalize = (value) => value.toLowerCase().trim();

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
      return `
        <a class="detail-card link-card" href="theory-card.html?tag=${encodedTag}">
          <div class="theory-card-head">
            <span class="badge">${item.categoryTitle}</span>
            <span class="theory-card-tag">${item.tagId}</span>
          </div>
          <div class="theory-card-title">${item.title}</div>
          <p class="detail-summary">${item.summary}</p>
          <p class="link-card-meta">クリックして詳細を見る</p>
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

renderTabs();
renderCards();
