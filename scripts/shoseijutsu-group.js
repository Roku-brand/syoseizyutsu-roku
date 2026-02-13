import { shoseijutsuData } from "../data/index.js";

const foundationTitleMap = new Map();
for (const category of Object.values(shoseijutsuData.foundation)) {
  for (const card of category.items) {
    foundationTitleMap.set(card.tagId, card.title);
  }
}

const findFoundationTitle = (tagId) => foundationTitleMap.get(tagId) ?? null;

const areaLabels = {
  relationships: "人間関係",
  work: "仕事",
  mental: "メンタル",
  life: "人生",
  challenge: "挑戦",
};

const getCategoryByKey = (key) => {
  return shoseijutsuData.techniques.categories?.find((c) => c.key === key);
};

const titleEl = document.getElementById("group-title");
const subtitleEl = document.getElementById("group-subtitle");
const detailsContainer = document.getElementById("group-details");
const emptyState = document.getElementById("group-empty");
const backLink = document.getElementById("group-back-link");
const quickListCard = document.getElementById("group-quicklist-card");
const quickList = document.getElementById("group-quicklist");
const sideToc = document.getElementById("group-side-toc");
const sideTocList = document.getElementById("group-side-toc-list");
const techniqueCountEl = document.getElementById("group-technique-count");
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
  const example = group.items?.[0];
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
  const title = findFoundationTitle(tag);
  const displayText = title ? `${tag}（${title}）` : tag;
  return `<a class="foundation-link" href="theory/${encodedTag}/">${displayText}</a>`;
};

const toSectionNumber = (index) => String(index + 1).padStart(2, "0");

const renderQuickList = (items) => {
  quickList.innerHTML = items
    .map(
      (item, index) => `
      <button class="group-quick-card" type="button" data-scroll-target="group-section-${index + 1}">
        <span class="group-quick-number">${toSectionNumber(index)}</span>
        <p class="group-quick-title">${item.title}</p>
      </button>
    `,
    )
    .join("");
};

const renderDetails = (group) => {
  detailsContainer.innerHTML = group.items
    .map((item, index) => {
      const theoryTagIds = item.theoryTagIds ?? [];
      const foundationsMarkup = theoryTagIds.length
        ? `
          <div class="entry-meta">
            <span>関連理論：</span>
            ${theoryTagIds
              .map((tagId) => renderFoundationLink(tagId))
              .join(", ")}
          </div>
        `
        : "";
      const subtitleMarkup = item.subtitle
        ? `<p class="entry-summary">${item.subtitle}</p>`
        : "";

      return `
        <article class="shoseijutsu-entry" id="group-section-${index + 1}" data-section-index="${index + 1}">
          <div class="entry-index">§${toSectionNumber(index)}</div>
          <h3 class="entry-title">${item.title}</h3>
          ${subtitleMarkup}
          ${foundationsMarkup}
        </article>
      `;
    })
    .join("");
};

const setupSmoothScroll = () => {
  const links = document.querySelectorAll("[data-scroll-target]");
  for (const link of links) {
    link.addEventListener("click", () => {
      const targetId = link.getAttribute("data-scroll-target");
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) {
        return;
      }
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
};

const renderSideToc = (items) => {
  sideTocList.innerHTML = items
    .map(
      (_item, index) => `
        <li>
          <a class="group-side-toc-link" href="#group-section-${index + 1}" data-scroll-target="group-section-${index + 1}" data-toc-link="group-section-${index + 1}">${toSectionNumber(index)}</a>
        </li>
      `,
    )
    .join("");
};

const setupSideTocObserver = () => {
  if (!sideToc || !sideTocList || window.innerWidth <= 980) {
    return;
  }

  const sections = document.querySelectorAll(".shoseijutsu-entry");
  const tocLinks = new Map();
  for (const link of sideTocList.querySelectorAll("[data-toc-link]")) {
    tocLinks.set(link.getAttribute("data-toc-link"), link);
  }

  const setActive = (id) => {
    for (const link of tocLinks.values()) {
      link.classList.remove("is-active");
    }
    const activeLink = tocLinks.get(id);
    if (activeLink) {
      activeLink.classList.add("is-active");
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visibleEntries.length > 0) {
        setActive(visibleEntries[0].target.id);
      }
    },
    {
      root: null,
      rootMargin: "-30% 0px -55% 0px",
      threshold: [0.15, 0.35, 0.6],
    },
  );

  for (const section of sections) {
    observer.observe(section);
  }

  if (sections[0]) {
    setActive(sections[0].id);
  }
};

const showNotFound = (message) => {
  titleEl.textContent = "処世術群";
  subtitleEl.textContent = message;
  detailsContainer.classList.add("is-hidden");
  quickListCard.classList.add("is-hidden");
  sideToc?.classList.add("is-hidden");
  emptyState.classList.remove("is-hidden");
};

const renderGroup = () => {
  const parsed = parseGroupParam();
  if (!parsed) {
    showNotFound("グループ指定がありません。");
    return;
  }

  const { areaKey, groupName } = parsed;
  const areaSection = getCategoryByKey(areaKey);
  const group = areaSection?.subcategories.find((item) => item.name === groupName);

  if (!areaSection || !group) {
    showNotFound("該当するグループが見つかりません。");
    return;
  }

  const areaLabel = areaLabels[areaKey] ?? areaSection.name ?? areaKey;
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

  renderQuickList(group.items);
  renderDetails(group);
  renderSideToc(group.items);

  if (techniqueCountEl) {
    techniqueCountEl.textContent = `全${group.items.length}術`;
  }

  if (window.innerWidth > 980 && group.items.length > 0) {
    sideToc?.classList.remove("is-hidden");
  } else {
    sideToc?.classList.add("is-hidden");
  }

  setupSmoothScroll();
  setupSideTocObserver();
};

renderGroup();
