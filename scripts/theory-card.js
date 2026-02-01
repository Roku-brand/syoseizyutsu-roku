import { shoseijutsuData } from "../data/index.js";

const detailContainer = document.getElementById("theory-detail");
const emptyState = document.getElementById("theory-empty");
const backLink = document.getElementById("theory-back-link");
const descriptionMeta = document.querySelector('meta[name="description"]');

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
const backTarget = params.get("back");

if (backLink && backTarget) {
  backLink.href = backTarget;
}

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

const chooseByLength = (candidates, min, max) => {
  const match = candidates.find((text) => text.length >= min && text.length <= max);
  if (match) {
    return match;
  }
  const target = (min + max) / 2;
  return candidates
    .slice()
    .sort((a, b) => Math.abs(a.length - target) - Math.abs(b.length - target))[0];
};

const clampLength = (text, min, max, { suffix = "…", padText = "" } = {}) => {
  let result = text;
  if (result.length < min && padText) {
    result = `${result}${padText}`;
  }
  if (result.length > max) {
    return `${result.slice(0, Math.max(max - suffix.length, 1))}${suffix}`;
  }
  return result;
};

const buildTheoryTitle = (cardData) => {
  const suffix = "｜処世術禄 理論集";
  const candidates = [
    `${cardData.title}で判断の偏りを知る方法${suffix}`,
    `${cardData.title}の要点と活用法｜${cardData.tagId}${suffix}`,
    `${cardData.title}を理解する心理理論${suffix}`,
  ];
  const picked = chooseByLength(candidates, 32, 45);
  return clampLength(picked, 32, 45, { padText: "の解説" });
};

const buildTheoryDescription = (cardData) => {
  const summary = cardData.summary?.replace(/。$/, "") ?? "";
  const base = `${summary}判断に迷う人向けに、心理学・行動科学の研究背景から${cardData.title}を仕事や生活に活かす手順を解説します。`;
  return clampLength(base, 80, 120, {
    padText: "結論を急ぐ癖や思い込みの原因を整理します。",
  });
};

if (!card) {
  detailContainer.innerHTML = "";
  emptyState.classList.remove("is-hidden");
} else {
  document.title = buildTheoryTitle(card);
  if (descriptionMeta) {
    descriptionMeta.setAttribute("content", buildTheoryDescription(card));
  }
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
