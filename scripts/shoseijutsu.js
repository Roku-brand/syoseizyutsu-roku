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
const groupFilterContainer = document.getElementById("technique-group-filters");
const resultsContainer = document.getElementById("technique-results");
const emptyState = document.getElementById("technique-empty");
const countLabel = document.getElementById("technique-count");

const filterOptions = [
  { key: "all", label: "すべて" },
  ...Object.entries(areaLabels).map(([key, label]) => ({ key, label })),
];

const groupOptions = Object.entries(shoseijutsuData.techniques).flatMap(
  ([areaKey, section]) =>
    section.items.map((group) => ({
      key: `${areaKey}:${group.name}`,
      label: `${areaLabels[areaKey] ?? section.title}・${group.name}`,
      areaKey,
      groupName: group.name,
    }))
);

let activeArea = "all";
let activeGroup = "all";

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
      renderGroupFilters();
      renderCards();
    });
    filterContainer.appendChild(button);
  });
};

const renderGroupFilters = () => {
  groupFilterContainer.innerHTML = "";
  const visibleOptions =
    activeArea === "all"
      ? groupOptions
      : groupOptions.filter((option) => option.areaKey === activeArea);

  if (!visibleOptions.some((option) => option.key === activeGroup)) {
    activeGroup = "all";
  }

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "tag tag-button tag--compact";
  allButton.dataset.group = "all";
  allButton.setAttribute("aria-pressed", activeGroup === "all" ? "true" : "false");
  allButton.textContent = "すべて";
  allButton.addEventListener("click", () => {
    activeGroup = "all";
    renderGroupFilters();
    renderCards();
  });
  groupFilterContainer.appendChild(allButton);

  visibleOptions.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag tag-button tag--compact";
    button.dataset.group = option.key;
    button.setAttribute("aria-pressed", option.key === activeGroup ? "true" : "false");
    button.textContent = option.label;
    button.addEventListener("click", () => {
      activeGroup = option.key;
      renderGroupFilters();
      renderCards();
    });
    groupFilterContainer.appendChild(button);
  });
};

const matchesFilter = (item, keyword, tag) => {
  if (activeArea !== "all" && item.areaKey !== activeArea) {
    return false;
  }
  if (
    activeGroup !== "all" &&
    `${item.areaKey}:${item.groupName}` !== activeGroup
  ) {
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

  const grouped = new Map();
  filtered.forEach((item) => {
    const key = `${item.areaKey}-${item.groupName}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        label: item.groupName,
        areaLabel: item.areaLabel,
        sectionTitle: item.sectionTitle,
        items: [],
      });
    }
    grouped.get(key).items.push(item);
  });

  resultsContainer.innerHTML = Array.from(grouped.values())
    .map((group) => {
      const cardsHtml = group.items
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

      return `
        <section class="card-group">
          <div class="card-group-header">
            <div>
              <h3>${group.label}</h3>
              <p class="card-group-meta">${group.areaLabel} / ${group.sectionTitle}</p>
            </div>
            <span class="card-group-count">${group.items.length}件</span>
          </div>
          <div class="card-grid">
            ${cardsHtml}
          </div>
        </section>
      `;
    })
    .join("");

  const hasResults = filtered.length > 0;
  resultsContainer.classList.toggle("is-hidden", !hasResults);
  emptyState.classList.toggle("is-hidden", hasResults);
  countLabel.textContent = `表示件数: ${filtered.length}件 / グループ: ${grouped.size}件`;
};

const handleInput = () => {
  renderCards();
};

keywordInput.addEventListener("input", handleInput);
tagInput.addEventListener("input", handleInput);

renderFilters();
renderGroupFilters();
renderCards();
