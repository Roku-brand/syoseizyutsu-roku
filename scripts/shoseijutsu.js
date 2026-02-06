import { shoseijutsuData } from "../data/index.js";

const areaOrder = ["relationships", "work", "mental", "life", "challenge"];
const areaLabels = {
  relationships: "人間関係",
  work: "仕事",
  mental: "メンタル",
  life: "人生",
  challenge: "挑戦",
};

// Helper function to get category by key from the new structure
const getCategoryByKey = (key) => {
  return shoseijutsuData.techniques.categories?.find((c) => c.key === key);
};

const groupBoardContainer = document.getElementById("technique-group-board");
const tabButtons = document.querySelectorAll(".tab-button");
const viewPanels = document.querySelectorAll("[data-view-panel]");

const searchInput = document.getElementById("technique-search");
const tagList = document.getElementById("technique-tag-list");
const resultCount = document.getElementById("technique-result-count");
const resultList = document.getElementById("technique-index-results");
const emptyState = document.getElementById("technique-index-empty");

const foundationTitleMap = new Map();
for (const category of Object.values(shoseijutsuData.foundation)) {
  for (const card of category.items) {
    foundationTitleMap.set(card.tagId, card.title);
  }
}

const findFoundationTitle = (tagId) => foundationTitleMap.get(tagId) ?? null;

const groupOptions = areaOrder.flatMap((areaKey) => {
  const section = getCategoryByKey(areaKey);
  if (!section) {
    return [];
  }
  return section.subcategories.map((group) => ({
    key: `${areaKey}:${group.name}`,
    label: `${areaLabels[areaKey] ?? section.name}・${group.name}`,
    areaKey,
    groupName: group.name,
  }));
});

const areaParam = new URLSearchParams(window.location.search).get("area");
const isValidArea = (value) => value && areaOrder.includes(value);
let activeArea = isValidArea(areaParam) ? areaParam : "all";
let activeGroup = "all";

const groupParam = new URLSearchParams(window.location.search).get("group");
const viewParam = new URLSearchParams(window.location.search).get("view");
let activeView = viewParam === "index" ? "index" : "list";
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
  areaOrder.forEach((areaKey) => {
    const label = areaLabels[areaKey];
    if (activeArea !== "all" && activeArea !== areaKey) {
      return;
    }
    const areaSection = document.createElement("section");
    areaSection.className = "group-area";
    areaSection.dataset.area = areaKey;

    const title = document.createElement("h2");
    title.className = "group-area-title";
    title.textContent = label;
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

      const content = document.createElement("div");
      content.className = "group-card-content";

      const name = document.createElement("div");
      name.className = "group-card-title";
      name.textContent = option.groupName;

      const category = getCategoryByKey(areaKey);
      const detail = category?.subcategories.find(
        (group) => group.name === option.groupName
      );
      const subtitle = document.createElement("div");
      subtitle.className = "group-card-subtitle";
      // Use first item's title as subtitle since new structure doesn't have subtitle
      subtitle.textContent = detail?.items?.[0]?.title ?? "迷いを解くための視点を整理する";

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

const setActiveArea = (area, { syncUrl = true } = {}) => {
  activeArea = area;
  if (syncUrl) {
    const nextUrl = new URL(window.location.href);
    if (activeArea === "all") {
      nextUrl.searchParams.delete("area");
    } else {
      nextUrl.searchParams.set("area", activeArea);
    }
    window.history.replaceState({}, "", nextUrl);
  }
  renderGroupBoard();
  if (activeView === "list") {
    syncSelectedTab();
  }
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

const buildIndexItems = () => {
  let index = 1;
  return areaOrder.flatMap((areaKey) => {
    const section = getCategoryByKey(areaKey);
    if (!section) {
      return [];
    }
    return section.subcategories.flatMap((group) =>
      group.items.map((item) => ({
        areaKey,
        areaLabel: areaLabels[areaKey] ?? section.name ?? areaKey,
        groupName: group.name,
        id: index++,
        title: item.title,
        subtitle: item.subtitle ?? "",
        searchText: `${group.name} ${item.title} ${item.subtitle ?? ""} ${
          item.theoryTagIds?.join(" ") ?? ""
        } ${areaLabels[areaKey] ?? section.name ?? areaKey}`,
        groupKey: `${areaKey}:${group.name}`,
        theoryTagIds: item.theoryTagIds ?? [],
      }))
    );
  });
};

const indexItems = buildIndexItems();
const activeTags = new Set();

const setActiveView = (view, { syncUrl = true } = {}) => {
  activeView = view;
  viewPanels.forEach((panel) => {
    const isVisible = panel.dataset.viewPanel === view;
    panel.classList.toggle("is-hidden", !isVisible);
  });
  if (syncUrl) {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("view", view);
    window.history.replaceState({}, "", nextUrl);
  }
  syncSelectedTab();
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

const renderFoundationLink = (tagId) => {
  const encodedTag = encodeURIComponent(tagId);
  const title = findFoundationTitle(tagId);
  const displayText = title ? `${tagId}（${title}）` : tagId;
  return `<a class="foundation-link" href="theory/${encodedTag}/">${displayText}</a>`;
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
      (item) => {
        const theoryTags = item.theoryTagIds ?? [];
        const theoryMarkup = theoryTags.length
          ? `
            <div class="entry-meta">
              <span>関連理論：</span>
              ${theoryTags
                .map((tagId) => renderFoundationLink(tagId))
                .join(", ")}
            </div>
          `
          : "";
        const subtitleMarkup = item.subtitle
          ? `<p class="index-result-summary">${item.subtitle}</p>`
          : "";
        return `
        <li class="index-result-card">
          <div class="index-result-header">
            <span class="badge">No.${item.id}</span>
            <h3 class="index-result-title">${item.title}</h3>
          </div>
          ${subtitleMarkup}
          ${theoryMarkup}
          <div class="tag-list tag-list--compact">
            <span class="tag tag--compact">${item.areaLabel}</span>
            <a class="tag tag--compact" href="group.html?group=${encodeURIComponent(
              item.groupKey
            )}">
              ${item.groupName}
            </a>
          </div>
        </li>
      `;
      }
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

const setSelectedTab = (selectedTab) => {
  tabButtons.forEach((button) => {
    button.setAttribute("aria-pressed", button === selectedTab ? "true" : "false");
  });
};

const getSelectedTab = () => {
  if (activeView === "index") {
    return document.querySelector('[data-view="index"]');
  }
  if (activeArea === "all") {
    return document.querySelector('[data-view="list"]');
  }
  return document.querySelector(`[data-area="${activeArea}"]`);
};

const syncSelectedTab = () => {
  const selectedTab = getSelectedTab();
  if (selectedTab) {
    setSelectedTab(selectedTab);
  }
};

const initTabs = () => {
  if (!tabButtons.length) {
    return;
  }
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.view === "index") {
        setActiveView("index");
        return;
      }
      if (button.dataset.view === "list") {
        setActiveView("list");
        setActiveArea("all");
        return;
      }
      const nextArea = button.dataset.area;
      if (!nextArea) {
        return;
      }
      setActiveView("list");
      setActiveArea(nextArea);
    });
  });
};

applyGroupFromUrl();
if (activeArea === "all" && activeGroup !== "all") {
  activeArea = activeGroup.split(":")[0];
}
setActiveArea(activeArea, { syncUrl: false });
setActiveView(activeView, { syncUrl: false });
syncSelectedTab();
initTabs();
initIndex();
