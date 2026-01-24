import { shoseijutsuData } from "../data/index.js";

const areaLabels = {
  life: "人生",
  thinking: "思考",
  people: "対人",
  skill: "スキル",
  achievement: "達成",
};

const groupBoardContainer = document.getElementById("technique-group-board");

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
    title.textContent = label;
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

applyGroupFromUrl();
renderGroupBoard();
