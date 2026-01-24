import { shoseijutsuData } from "../data/index.js";

const areaLabels = {
  life: "人生",
  thinking: "思考",
  people: "対人",
  skill: "スキル",
  achievement: "達成",
};

const techniques = Object.entries(shoseijutsuData.techniques).flatMap(
  ([areaKey, section]) =>
    section.items.flatMap((group) =>
      group.details.map((detail) => {
        const foundationTags = (detail.foundations ?? [])
          .flatMap((entry) => entry.split(/\s+/))
          .filter(Boolean);
        return {
          id: `${areaKey}-${group.name}-${detail.id}`,
          areaKey,
          areaLabel: areaLabels[areaKey] ?? section.title,
          sectionTitle: section.title,
          groupName: group.name,
          title: detail.title,
          subtitle: detail.subtitle,
          foundations: foundationTags,
        };
      })
    )
);

const keywordInput = document.getElementById("technique-keyword");
const tagInput = document.getElementById("technique-tag");
const filterContainer = document.getElementById("technique-area-filters");
const resultsContainer = document.getElementById("technique-results");
const emptyState = document.getElementById("technique-empty");
const countLabel = document.getElementById("technique-count");

const filterOptions = [
  { key: "all", label: "すべて" },
  ...Object.entries(areaLabels).map(([key, label]) => ({ key, label })),
];

let activeArea = "all";

const normalize = (value) => value.toLowerCase().trim();

const renderFilters = () => {
  filterContainer.innerHTML = "";
  filterOptions.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag tag-button";
    button.dataset.area = option.key;
    button.setAttribute("aria-pressed", option.key === activeArea ? "true" : "false");
    button.textContent = option.label;
    button.addEventListener("click", () => {
      activeArea = option.key;
      renderFilters();
      renderCards();
    });
    filterContainer.appendChild(button);
  });
};

const matchesFilter = (item, keyword, tag) => {
  if (activeArea !== "all" && item.areaKey !== activeArea) {
    return false;
  }
  const searchable = [
    item.title,
    item.subtitle,
    item.groupName,
    item.sectionTitle,
    item.areaLabel,
    item.foundations.join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  const normalized = normalize(searchable);
  const keywordMatch = keyword ? normalized.includes(keyword) : true;
  const tagMatch = tag
    ? normalize(item.foundations.join(" ")).includes(tag) || normalized.includes(tag)
    : true;

  return keywordMatch && tagMatch;
};

const renderCards = () => {
  const keyword = normalize(keywordInput.value);
  const tag = normalize(tagInput.value);
  const filtered = techniques.filter((item) => matchesFilter(item, keyword, tag));

  resultsContainer.innerHTML = filtered
    .map((item) => {
      const foundationsHtml = item.foundations.length
        ? `<div class="tag-list card-tags">${item.foundations
            .map((tagItem) => `<span class="tag tag--small">${tagItem}</span>`)
            .join("")}</div>`
        : "";

      return `
        <article class="card card-detail">
          <div class="badge">${item.areaLabel}</div>
          <h3>${item.title}</h3>
          ${item.subtitle ? `<p class="card-subtitle">${item.subtitle}</p>` : ""}
          <p class="card-meta">${item.groupName} / ${item.sectionTitle}</p>
          ${foundationsHtml}
        </article>
      `;
    })
    .join("");

  const hasResults = filtered.length > 0;
  resultsContainer.classList.toggle("is-hidden", !hasResults);
  emptyState.classList.toggle("is-hidden", hasResults);
  countLabel.textContent = `表示件数: ${filtered.length}件`;
};

const handleInput = () => {
  renderCards();
};

keywordInput.addEventListener("input", handleInput);
tagInput.addEventListener("input", handleInput);

renderFilters();
renderCards();
