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

const renderGroupBoard = () => {
  groupBoardContainer.innerHTML = "";
  Object.entries(areaLabels).forEach(([areaKey, label]) => {
    const column = document.createElement("div");
    column.className = "group-column";

    const title = document.createElement("div");
    title.className = "group-column-title";
    title.textContent = `≪${label}≫`;
    column.appendChild(title);

    const list = document.createElement("div");
    list.className = "group-list";
    groupOptions
      .filter((option) => option.areaKey === areaKey)
      .forEach((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "tag tag-button group-button group-button--hero";
        button.dataset.group = option.key;
        button.setAttribute("aria-pressed", option.key === activeGroup ? "true" : "false");
        button.textContent = option.groupName;
        button.addEventListener("click", () => {
          const nextUrl = new URL("group.html", window.location.href);
          nextUrl.searchParams.set("group", option.key);
          window.location.assign(nextUrl.toString());
        });
        list.appendChild(button);
      });

    column.appendChild(list);
    groupBoardContainer.appendChild(column);
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
