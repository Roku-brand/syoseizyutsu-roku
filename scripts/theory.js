import { shoseijutsuData } from "../data/index.js";

const categoryMap = new Map(
  Object.values(shoseijutsuData.foundation).map((category) => [category.id, category])
);
const orderedCategoryIds = ["cognition", "behavior", "social", "structure", "wisdom"];
const categories = orderedCategoryIds
  .map((id) => categoryMap.get(id))
  .filter(Boolean);

const searchInput = document.getElementById("foundation-search");
const tabsContainer = document.getElementById("foundation-tabs");
const resultsContainer = document.getElementById("foundation-results");
const emptyState = document.getElementById("foundation-empty");
const countLabel = document.getElementById("foundation-count");

const tabOptions = categories.map((category) => ({
  key: category.id,
  label: category.title,
}));

let activeCategory = tabOptions[0]?.key ?? "";

const normalize = (value) => value.toLowerCase().trim();

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
      renderTabs();
      renderCards();
    });
    tabsContainer.appendChild(button);
  });
};

const matchesFilter = (item, keyword) => {
  if (activeCategory && item.categoryId !== activeCategory) {
    return false;
  }
  if (!keyword) {
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
      const listSection = (title, entries) => {
        if (!entries || entries.length === 0) {
          return "";
        }
        return `
          <section>
            <h4>${title}</h4>
            <ul>
              ${entries.map((entry) => `<li>${entry}</li>`).join("")}
            </ul>
          </section>
        `;
      };

      return `
        <details class="detail-card">
          <summary>
            <span class="badge">${item.categoryTitle}</span>
            <span class="detail-title">${item.tagId} ${item.title}</span>
          </summary>
          <div class="detail-body">
            <p class="detail-summary">${item.summary}</p>
            <p>${item.definition}</p>
            ${listSection("要点", item.keyPoints)}
            ${listSection("落とし穴", item.pitfalls)}
            ${listSection("実装ヒント", item.strategies)}
            ${listSection("適用場面", item.applicationConditions)}
          </div>
        </details>
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
