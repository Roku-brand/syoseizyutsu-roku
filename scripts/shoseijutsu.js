import { shoseijutsuData } from "../data/index.js";

const areaLabels = {
  life: "人生",
  thinking: "思考",
  people: "対人",
  skill: "スキル",
  achievement: "達成",
};

const groupBoardContainer = document.getElementById("technique-group-board");
const viewButtons = document.querySelectorAll("[data-view]");
const viewPanels = document.querySelectorAll("[data-view-panel]");

const searchInput = document.getElementById("technique-search");
const tagList = document.getElementById("technique-tag-list");
const resultCount = document.getElementById("technique-result-count");
const resultList = document.getElementById("technique-index-results");
const emptyState = document.getElementById("technique-index-empty");

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

const groupParam = new URLSearchParams(window.location.search).get("group");
const viewParam = new URLSearchParams(window.location.search).get("view");
const applyGroupFromUrl = () => {
  if (!groupParam) {
    return;
  }
  const match = groupOptions.find((option) => option.key === groupParam);
  if (!match) {
    return;
  }
  activeArea = match.areaKey;
  activeGroup = match.key;
};

const iconMap = {
  人生設計: `
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" stroke-width="3" />
      <circle cx="32" cy="32" r="4" fill="currentColor" />
      <path d="M32 10L38 32L32 54L26 32Z" fill="currentColor" opacity="0.35" />
      <path d="M10 32H54" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  `,
  夢と挑戦: `
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path
        d="M32 8c8 7 14 16 10 26-2 6-8 10-15 11 2 7-2 11-8 13 0-6-4-11-9-13 6-2 11-7 11-15 0-9 6-16 11-22z"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M32 12c6 6 10 13 7 21-2 6-7 10-14 12"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
  `,
  後悔回避: `
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M20 22h16c8 0 14 6 14 14" fill="none" stroke="currentColor" stroke-width="3" />
      <path d="M24 18l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      <path d="M44 46H28c-8 0-14-6-14-14" fill="none" stroke="currentColor" stroke-width="3" />
      <path d="M40 50l8-8-8-8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>
  `,
  変化対応: `
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path
        d="M12 40c6-8 18-12 30-8 6 2 10 6 10 10"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
      <path
        d="M14 48c8 4 18 4 30-2 4-2 6-5 8-8"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
      />
    </svg>
  `,
  "運と偶然": `
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect x="14" y="14" width="36" height="36" rx="8" fill="none" stroke="currentColor" stroke-width="3" />
      <circle cx="24" cy="24" r="3" fill="currentColor" />
      <circle cx="40" cy="24" r="3" fill="currentColor" />
      <circle cx="32" cy="32" r="3" fill="currentColor" />
      <circle cx="24" cy="40" r="3" fill="currentColor" />
      <circle cx="40" cy="40" r="3" fill="currentColor" />
    </svg>
  `,
};

const defaultIcon = `
  <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" stroke-width="3" />
    <path d="M32 18v28M18 32h28" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
  </svg>
`;

const renderGroupBoard = () => {
  groupBoardContainer.innerHTML = "";
  Object.entries(areaLabels).forEach(([areaKey, label]) => {
    const areaSection = document.createElement("section");
    areaSection.className = "group-area";

    const title = document.createElement("h2");
    title.className = "group-area-title";
    title.innerHTML = `処世術群 <span>≪${label}≫</span>`;
    areaSection.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "group-card-grid";

    const areaGroups = groupOptions.filter((option) => option.areaKey === areaKey);
    areaGroups.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "group-card";
      button.dataset.group = option.key;
      button.setAttribute("aria-pressed", option.key === activeGroup ? "true" : "false");

      const icon = document.createElement("div");
      icon.className = "group-card-icon";
      icon.innerHTML = iconMap[option.groupName] ?? defaultIcon;
      button.appendChild(icon);

      const content = document.createElement("div");
      content.className = "group-card-content";

      const name = document.createElement("div");
      name.className = "group-card-title";
      name.textContent = option.groupName;

      const detail = shoseijutsuData.techniques[areaKey]?.items.find(
        (group) => group.name === option.groupName
      );
      const subtitle = document.createElement("div");
      subtitle.className = "group-card-subtitle";
      subtitle.textContent = detail?.details?.[0]?.subtitle ?? "迷いを解くための視点を整理する";

      content.appendChild(name);
      content.appendChild(subtitle);
      button.appendChild(content);

      button.addEventListener("click", () => {
        const nextUrl = new URL("group.html", window.location.href);
        nextUrl.searchParams.set("group", option.key);
        window.location.assign(nextUrl.toString());
      });

      grid.appendChild(button);
    });

    areaSection.appendChild(grid);
    groupBoardContainer.appendChild(areaSection);
  });
};

const tagOptions = [
  {
    id: "work",
    label: "仕事",
    keywords: [
      "仕事",
      "職場",
      "キャリア",
      "上司",
      "部下",
      "会議",
      "評価",
      "成果",
      "プロジェクト",
      "タスク",
      "転職",
      "営業",
      "チーム",
    ],
  },
  {
    id: "conversation",
    label: "会話",
    keywords: [
      "会話",
      "話",
      "伝え",
      "聞く",
      "質問",
      "説明",
      "雑談",
      "交渉",
      "コミュニケーション",
    ],
  },
  {
    id: "romance",
    label: "恋愛",
    keywords: ["恋愛", "恋", "パートナー", "告白", "関係", "デート", "結婚"],
  },
  {
    id: "conflict",
    label: "葛藤",
    keywords: ["葛藤", "対立", "衝突", "摩擦", "怒", "不安", "ストレス", "反発"],
  },
  {
    id: "decision",
    label: "意思決定",
    keywords: ["判断", "決定", "選択", "意思決定", "迷い", "優先"],
  },
  {
    id: "habit",
    label: "習慣",
    keywords: ["習慣", "継続", "ルーチン", "日常", "週次", "毎日"],
  },
];

const buildIndexItems = () =>
  Object.entries(shoseijutsuData.techniques).flatMap(([areaKey, section]) =>
    section.items.flatMap((group) =>
      group.details.map((detail) => ({
        areaKey,
        areaLabel: areaLabels[areaKey] ?? section.title ?? areaKey,
        groupName: group.name,
        id: detail.id,
        title: detail.title,
        subtitle: detail.subtitle,
        searchText: `${group.name} ${detail.title} ${detail.subtitle} ${
          areaLabels[areaKey] ?? section.title ?? areaKey
        }`,
        groupKey: `${areaKey}:${group.name}`,
      }))
    )
  );

const indexItems = buildIndexItems();
const activeTags = new Set();

const setActiveView = (view) => {
  viewButtons.forEach((button) => {
    const isSelected = button.dataset.view === view;
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });
  viewPanels.forEach((panel) => {
    const isVisible = panel.dataset.viewPanel === view;
    panel.classList.toggle("is-hidden", !isVisible);
  });
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set("view", view);
  window.history.replaceState({}, "", nextUrl);
};

const normalizeText = (value) => value.toLowerCase();

const matchesSearch = (item, query) => {
  if (!query) {
    return true;
  }
  const terms = query.split(/\s+/).filter(Boolean);
  const text = normalizeText(item.searchText);
  return terms.every((term) => text.includes(normalizeText(term)));
};

const matchesTags = (item) => {
  if (!activeTags.size) {
    return true;
  }
  const text = item.searchText;
  return [...activeTags].some((tagId) => {
    const tag = tagOptions.find((option) => option.id === tagId);
    return tag?.keywords.some((keyword) => text.includes(keyword));
  });
};

const renderTags = () => {
  if (!tagList) {
    return;
  }
  tagList.innerHTML = "";
  tagOptions.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag tag-button";
    button.textContent = option.label;
    button.setAttribute("aria-pressed", activeTags.has(option.id) ? "true" : "false");
    button.addEventListener("click", () => {
      if (activeTags.has(option.id)) {
        activeTags.delete(option.id);
      } else {
        activeTags.add(option.id);
      }
      renderTags();
      renderIndex();
    });
    tagList.appendChild(button);
  });
};

const renderIndex = () => {
  if (!resultList || !resultCount || !emptyState) {
    return;
  }
  const query = searchInput?.value ?? "";
  const filtered = indexItems.filter(
    (item) => matchesSearch(item, query) && matchesTags(item)
  );
  resultCount.textContent = `該当件数：${filtered.length}件`;
  resultList.innerHTML = filtered
    .map(
      (item) => `
        <li class="index-result-card">
          <div class="index-result-header">
            <span class="badge">No.${item.id}</span>
            <h3 class="index-result-title">${item.title}</h3>
          </div>
          <p class="index-result-summary">${item.subtitle}</p>
          <div class="tag-list tag-list--compact">
            <span class="tag tag--compact">${item.areaLabel}</span>
            <a class="tag tag--compact" href="group.html?group=${encodeURIComponent(
              item.groupKey
            )}">
              ${item.groupName}
            </a>
          </div>
        </li>
      `
    )
    .join("");
  emptyState.classList.toggle("is-hidden", filtered.length > 0);
};

const initIndex = () => {
  if (!searchInput) {
    return;
  }
  renderTags();
  renderIndex();
  searchInput.addEventListener("input", () => {
    renderIndex();
  });
};

const initTabs = () => {
  if (!viewButtons.length) {
    return;
  }
  const defaultView = viewParam === "index" ? "index" : "list";
  setActiveView(defaultView);
  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.view);
    });
  });
};

applyGroupFromUrl();
renderGroupBoard();
initTabs();
initIndex();
