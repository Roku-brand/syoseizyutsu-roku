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

  emptyState.classList.add("is-hidden");
  detailsContainer.classList.remove("is-hidden");
  quickListCard.classList.remove("is-hidden");
  quickList.innerHTML = group.details
    .map((detail) => `<li>${detail.title}</li>`)
    .join("");
  renderDetails(group);
};

renderGroup();
