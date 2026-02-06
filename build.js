import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const readJson = (relativePath) =>
  JSON.parse(readFileSync(join(__dirname, relativePath), "utf-8"));

const ensureDir = (dir) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
};

// ---------------------------------------------------------------------------
// SEO helpers (mirrors scripts/theory-card.js logic)
// ---------------------------------------------------------------------------

const chooseByLength = (candidates, min, max) => {
  const match = candidates.find((t) => t.length >= min && t.length <= max);
  if (match) return match;
  const target = (min + max) / 2;
  return candidates
    .slice()
    .sort((a, b) => Math.abs(a.length - target) - Math.abs(b.length - target))[0];
};

const clampLength = (text, min, max, { suffix = "…", padText = "" } = {}) => {
  let result = text;
  if (result.length < min && padText) result = `${result}${padText}`;
  if (result.length > max)
    return `${result.slice(0, Math.max(max - suffix.length, 1))}${suffix}`;
  return result;
};

const buildTheoryTitle = (card) => {
  const suffix = "｜処世術禄 理論集";
  const candidates = [
    `${card.title}で判断の偏りを知る方法${suffix}`,
    `${card.title}の要点と活用法｜${card.tagId}${suffix}`,
    `${card.title}を理解する心理理論${suffix}`,
  ];
  const picked = chooseByLength(candidates, 32, 45);
  return clampLength(picked, 32, 45, { padText: "の解説" });
};

const buildTheoryDescription = (card) => {
  const summary = (card.summary ?? "").replace(/。$/, "");
  const base = `${summary}判断に迷う人向けに、心理学・行動科学の研究背景から${card.title}を仕事や生活に活かす手順を解説します。`;
  return clampLength(base, 80, 120, {
    padText: "結論を急ぐ癖や思い込みの原因を整理します。",
  });
};

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------

const foundationFiles = [
  "behavior",
  "cognition",
  "social",
  "structure",
  "wisdom",
];
const foundationCategories = foundationFiles.map((name) =>
  readJson(`data/foundation/${name}.json`)
);

const techniqueData = readJson("data/techniques/all-techniques.json");

// Build theory tagId → title map (used by technique pages)
const theoryTitleMap = new Map();
for (const category of foundationCategories) {
  for (const item of category.items) {
    theoryTitleMap.set(item.tagId, item.title);
  }
}

// ---------------------------------------------------------------------------
// HTML templates
// ---------------------------------------------------------------------------

const listSection = (title, entries) => {
  if (!entries || entries.length === 0) return "";
  return `
        <section>
          <h4>${escapeHtml(title)}</h4>
          <ul>
            ${entries.map((e) => `<li>${escapeHtml(e)}</li>`).join("\n            ")}
          </ul>
        </section>`;
};

const theoryCardHtml = (card, categoryId) => {
  const pageTitle = escapeHtml(buildTheoryTitle(card));
  const pageDescription = escapeHtml(buildTheoryDescription(card));

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" href="../../assets/icons/favicon.png" type="image/png" />
  <title>${pageTitle}</title>
  <meta name="description" content="${pageDescription}" />
  <link rel="stylesheet" href="../../styles.css" />
</head>
<body>
  <header>
    <div class="container nav">
      <div class="brand">処世術禄</div>
      <input type="checkbox" id="nav-toggle" class="nav-toggle" aria-label="メニューを開閉">
      <label for="nav-toggle" class="nav-toggle-button">
        <span class="nav-toggle-icon" aria-hidden="true"></span>
        <span class="nav-toggle-text">メニュー</span>
      </label>
      <nav class="nav-links">
        <a class="nav-link" href="../../index.html">トップ</a>
        <a class="nav-link" href="../../shoseijutsu.html">処世術集</a>
        <a class="nav-link" href="../../theory.html">理論集</a>
        <a class="nav-link" href="../../hub.html">みんなの処世術</a>
        <a class="nav-link" href="../../about.html">処世術禄とは</a>
      </nav>
      <div class="nav-actions">
        <a class="nav-icon-button" href="../../search.html" aria-label="総合検索">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" />
            <path d="M16.5 16.5L21 21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </a>
      </div>
    </div>
  </header>

  <main class="container">
    <section class="section">
      <a class="back-link" href="../../theory.html">← 理論集に戻る</a>
      <div class="theory-detail" id="theory-detail">
        <div class="detail-card detail-card--page theory-card theory-card--${escapeHtml(categoryId)}">
          <div class="detail-header">
            <h2>${escapeHtml(card.tagId)} ${escapeHtml(card.title)}</h2>
            <p class="detail-summary theory-card-summary">${escapeHtml(card.summary)}</p>
          </div>
          <div class="detail-body">
            <p>${escapeHtml(card.definition)}</p>${listSection("要点", card.keyPoints)}${listSection("落とし穴", card.pitfalls)}${listSection("実装ヒント", card.strategies)}${listSection("適用場面", card.applicationConditions)}
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="container">
    <p>理論の理解は、処世術を「信念」から「技術」に変えます。</p>
    <p>©禄ブランド</p>
    <p>最終更新日: <time class="js-last-updated"></time></p>
  </footer>
  <script src="../../scripts/footer-date.js"></script>
</body>
</html>
`;
};

const techniqueCardHtml = (item, categoryName, subcategoryName) => {
  const pageTitle = escapeHtml(
    clampLength(`${item.title}｜処世術禄 処世術集`, 32, 45, { padText: "の解説" })
  );
  const pageDescription = escapeHtml(
    clampLength(item.subtitle || `${item.title}の実践ガイド`, 80, 120, {
      padText: `心理学・行動科学に基づく処世術「${item.title}」の解説です。`,
    })
  );

  const theoryLinks =
    item.theoryTagIds && item.theoryTagIds.length
      ? `
        <section>
          <h4>関連理論</h4>
          <ul>
            ${item.theoryTagIds
              .map((tagId) => {
                const title = theoryTitleMap.get(tagId);
                const display = title
                  ? `${escapeHtml(tagId)}（${escapeHtml(title)}）`
                  : escapeHtml(tagId);
                return `<li><a class="foundation-link" href="../../theory/${encodeURIComponent(tagId)}/">${display}</a></li>`;
              })
              .join("\n            ")}
          </ul>
        </section>`
      : "";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" href="../../assets/icons/favicon.png" type="image/png" />
  <title>${pageTitle}</title>
  <meta name="description" content="${pageDescription}" />
  <link rel="stylesheet" href="../../styles.css" />
</head>
<body>
  <header>
    <div class="container nav">
      <div class="brand">処世術禄</div>
      <input type="checkbox" id="nav-toggle" class="nav-toggle" aria-label="メニューを開閉">
      <label for="nav-toggle" class="nav-toggle-button">
        <span class="nav-toggle-icon" aria-hidden="true"></span>
        <span class="nav-toggle-text">メニュー</span>
      </label>
      <nav class="nav-links">
        <a class="nav-link" href="../../index.html">トップ</a>
        <a class="nav-link" href="../../shoseijutsu.html">処世術集</a>
        <a class="nav-link" href="../../theory.html">理論集</a>
        <a class="nav-link" href="../../hub.html">みんなの処世術</a>
        <a class="nav-link" href="../../about.html">処世術禄とは</a>
      </nav>
      <div class="nav-actions">
        <a class="nav-icon-button" href="../../search.html" aria-label="総合検索">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2" />
            <path d="M16.5 16.5L21 21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </a>
      </div>
    </div>
  </header>

  <main class="container">
    <section class="section">
      <a class="back-link" href="../../shoseijutsu.html">← 処世術集に戻る</a>
      <div class="theory-detail">
        <div class="detail-card detail-card--page">
          <div class="detail-header">
            <h2>${escapeHtml(item.id)} ${escapeHtml(item.title)}</h2>
            ${item.subtitle ? `<p class="detail-summary">${escapeHtml(item.subtitle)}</p>` : ""}
          </div>
          <div class="detail-body">
            <div class="tag-list tag-list--compact">
              <span class="tag tag--compact">${escapeHtml(categoryName)}</span>
              <span class="tag tag--compact">${escapeHtml(subcategoryName)}</span>
            </div>${theoryLinks}
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="container">
    <p>処世術は「場面・背景・感情」まで揃えることで、再現性が高まります。</p>
    <p>©禄ブランド</p>
    <p>最終更新日: <time class="js-last-updated"></time></p>
  </footer>
  <script src="../../scripts/footer-date.js"></script>
</body>
</html>
`;
};

// ---------------------------------------------------------------------------
// Generate JS wrapper files from JSON (backward compatibility)
// ---------------------------------------------------------------------------

const generateJsWrappers = () => {
  const varNames = {
    behavior: "behaviorData",
    cognition: "cognitionData",
    social: "socialData",
    structure: "structureData",
    wisdom: "wisdomData",
  };

  for (const name of foundationFiles) {
    const json = readFileSync(
      join(__dirname, `data/foundation/${name}.json`),
      "utf-8"
    );
    const js = `export const ${varNames[name]} = ${json.trimEnd()};\n`;
    writeFileSync(join(__dirname, `data/foundation/${name}.js`), js);
  }

  const techJson = readFileSync(
    join(__dirname, "data/techniques/all-techniques.json"),
    "utf-8"
  );
  writeFileSync(
    join(__dirname, "data/techniques/all-techniques.js"),
    `export const techniqueCards = ${techJson.trimEnd()};\n`
  );

  console.log("  JS wrappers generated");
};

// ---------------------------------------------------------------------------
// Generate static theory card pages
// ---------------------------------------------------------------------------

const generateTheoryPages = () => {
  let count = 0;
  for (const category of foundationCategories) {
    for (const card of category.items) {
      const dir = join(__dirname, "theory", card.tagId);
      ensureDir(dir);
      const html = theoryCardHtml(card, category.id);
      writeFileSync(join(dir, "index.html"), html);
      count++;
    }
  }
  console.log(`  Theory pages: ${count}`);
  return count;
};

// ---------------------------------------------------------------------------
// Generate static technique card pages
// ---------------------------------------------------------------------------

const generateTechniquePages = () => {
  let count = 0;
  for (const category of techniqueData.categories) {
    for (const subcategory of category.subcategories) {
      for (const item of subcategory.items) {
        const dir = join(__dirname, "technique", item.id);
        ensureDir(dir);
        const html = techniqueCardHtml(item, category.name, subcategory.name);
        writeFileSync(join(dir, "index.html"), html);
        count++;
      }
    }
  }
  console.log(`  Technique pages: ${count}`);
  return count;
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log("Building static card pages...");
generateJsWrappers();
const theoryCount = generateTheoryPages();
const techniqueCount = generateTechniquePages();
console.log(`Done! Generated ${theoryCount + techniqueCount} pages total.`);
