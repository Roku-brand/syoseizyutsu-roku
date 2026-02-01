import { shoseijutsuData } from "../data/index.js";

const areaLabels = {
  life: "人生",
  thinking: "思考",
  people: "対人",
  skill: "スキル",
  achievement: "達成",
};

const titleEl = document.getElementById("group-title");
const subtitleEl = document.getElementById("group-subtitle");
const detailsContainer = document.getElementById("group-details");
const emptyState = document.getElementById("group-empty");
const backLink = document.getElementById("group-back-link");
const quickListCard = document.getElementById("group-quicklist-card");
const quickList = document.getElementById("group-quicklist");
const descriptionMeta = document.querySelector('meta[name="description"]');

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

const buildTechniqueTitle = (groupName, areaLabel) => {
  const suffix = "｜処世術禄";
  const candidates = [
    `${groupName}で迷ったときの判断と行動${suffix}`,
    `${groupName}の悩みを整える${areaLabel}処世術${suffix}`,
    `${groupName}に効く${areaLabel}の実践処世術${suffix}`,
  ];
  const picked = chooseByLength(candidates, 32, 45);
  return clampLength(picked, 32, 45, { padText: "の実践ヒント" });
};

const buildTechniqueDescription = (group, areaLabel) => {
  const example = group.details?.[0];
  const exampleText = example
    ? example.title.replace(/。$/, "")
    : `${group.name}の具体策`;
  const base = `${group.name}で悩む人向けに、${areaLabel}の視点で判断と行動を整える処世術を解説します。${exampleText}などで迷いを減らします。`;
  return clampLength(base, 80, 120, {
    padText: "具体的な行動例で不安を減らす流れをまとめます。",
  });
};

const groupParam = new URLSearchParams(window.location.search).get("group");

const parseGroupParam = () => {
  if (!groupParam) {
    return null;
  }
  const segments = groupParam.split(":");
  if (segments.length < 2) {
    return null;
  }
  const areaKey = segments.shift();
  const groupName = segments.join(":");
  return { areaKey, groupName };
};

const renderFoundationLink = (tag) => {
  const encodedTag = encodeURIComponent(tag);
  const backTarget = encodeURIComponent(`group.html?group=${encodeURIComponent(groupParam ?? "")}`);
  return `<a class="foundation-link" href="theory-card.html?tag=${encodedTag}&back=${backTarget}">${tag}</a>`;
};

const renderDetails = (group) => {
  detailsContainer.innerHTML = group.details
    .map((detail) => {
      const foundations = (detail.foundations ?? [])
        .flatMap((entry) => entry.split(" ").filter(Boolean));
      const foundationsMarkup = foundations.length
        ? `
          <div class="entry-meta">
            <span>関連理論：</span>
            ${foundations
              .map((foundation) => renderFoundationLink(foundation))
              .join(", ")}
          </div>
        `
        : "";

      return `
        <article class="shoseijutsu-entry">
          <div class="entry-index">§${detail.id}</div>
          <h3 class="entry-title">${detail.title}</h3>
          <p class="entry-summary">${detail.subtitle}</p>
          ${foundationsMarkup}
        </article>
      `;
    })
    .join("");
};

const renderGroup = () => {
  const parsed = parseGroupParam();
  if (!parsed) {
    titleEl.textContent = "処世術群";
    subtitleEl.textContent = "グループ指定がありません。";
    detailsContainer.classList.add("is-hidden");
    quickListCard.classList.add("is-hidden");
    emptyState.classList.remove("is-hidden");
    return;
  }

  const { areaKey, groupName } = parsed;
  const areaSection = shoseijutsuData.techniques[areaKey];
  const group = areaSection?.items.find((item) => item.name === groupName);

  if (!areaSection || !group) {
    titleEl.textContent = "処世術群";
    subtitleEl.textContent = "該当するグループが見つかりません。";
    detailsContainer.classList.add("is-hidden");
    quickListCard.classList.add("is-hidden");
    emptyState.classList.remove("is-hidden");
    return;
  }

  const areaLabel = areaLabels[areaKey] ?? areaSection.title ?? areaKey;
  titleEl.textContent = `${group.name}の処世術`;
  subtitleEl.textContent = `${areaLabel}の観点から整理した処世術群です。`;
  backLink.href = `shoseijutsu.html?group=${encodeURIComponent(groupParam)}`;
  document.title = buildTechniqueTitle(group.name, areaLabel);
  if (descriptionMeta) {
    descriptionMeta.setAttribute("content", buildTechniqueDescription(group, areaLabel));
  }

  emptyState.classList.add("is-hidden");
  detailsContainer.classList.remove("is-hidden");
  quickListCard.classList.remove("is-hidden");
  quickList.innerHTML = group.details
    .map((detail) => `<li>${detail.title}</li>`)
    .join("");
  renderDetails(group);
};

renderGroup();
