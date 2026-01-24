import { shoseijutsuData } from "../data/index.js";

const detailContainer = document.getElementById("theory-detail");
const emptyState = document.getElementById("theory-empty");

const categories = Object.values(shoseijutsuData.foundation);

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

const params = new URLSearchParams(window.location.search);
const tagId = params.get("tag");

const findCard = () => {
  for (const category of categories) {
    const item = category.items.find((card) => card.tagId === tagId);
    if (item) {
      return {
        ...item,
        categoryId: category.id,
        categoryTitle: category.title,
      };
    }
  }
  return null;
};

const card = findCard();

if (!card) {
  detailContainer.innerHTML = "";
  emptyState.classList.remove("is-hidden");
} else {
  document.title = `処世術禄 | ${card.tagId} ${card.title}`;
  emptyState.classList.add("is-hidden");
  detailContainer.innerHTML = `
    <div class="detail-card detail-card--page theory-card theory-card--${card.categoryId}">
      <div class="detail-header">
        <h2>${card.tagId} ${card.title}</h2>
        <p class="detail-summary theory-card-summary">${card.summary}</p>
      </div>
      <div class="detail-body">
        <p>${card.definition}</p>
        ${listSection("要点", card.keyPoints)}
        ${listSection("落とし穴", card.pitfalls)}
        ${listSection("実装ヒント", card.strategies)}
        ${listSection("適用場面", card.applicationConditions)}
      </div>
    </div>
  `;
}
