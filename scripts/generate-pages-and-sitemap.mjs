import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { shoseijutsuData } from "../data/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const baseUrl = "https://roku-brand.github.io/syoseizyutsu-roku";

const staticPages = [
  "index.html",
  "shoseijutsu.html",
  "theory.html",
  "hub.html",
  "group.html",
  "hub-create.html",
  "hub-detail.html",
  "about.html",
  "theory-card.html",
];

const htmlEscape = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const listSection = (title, entries) => {
  if (!entries || entries.length === 0) {
    return "";
  }
  const items = entries.map((entry) => `<li>${htmlEscape(entry)}</li>`).join("");
  return `
    <section>
      <h4>${htmlEscape(title)}</h4>
      <ul>
        ${items}
      </ul>
    </section>
  `;
};

const ensureDir = async (dirPath) => {
  await fs.mkdir(dirPath, { recursive: true });
};

const writeFileIfChanged = async (filePath, contents) => {
  try {
    const existing = await fs.readFile(filePath, "utf8");
    if (existing === contents) {
      return false;
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
  await fs.writeFile(filePath, contents, "utf8");
  return true;
};

const formatDate = (date) => date.toISOString().slice(0, 10);

const resolveOutputDirectory = (tagId) => {
  if (tagId.startsWith("W-")) {
    return "wisdom";
  }
  return "theories";
};

const buildCardPages = async () => {
  const categories = Object.values(shoseijutsuData.foundation);
  const generated = [];
  let createdCount = 0;
  let skippedCount = 0;

  for (const category of categories) {
    for (const card of category.items) {
      const outputDirName = resolveOutputDirectory(card.tagId);
      const outputDir = path.join(repoRoot, outputDirName, card.tagId, "index.html");
      const relativeRoot = path.posix.relative(
        path.posix.join(outputDirName, card.tagId),
        ""
      );
      const rootPrefix = relativeRoot ? `${relativeRoot}/` : "";

      const titleText = `${card.tagId} ${card.title}`;
      const descriptionSource = card.summary || card.definition || "";
      const description = htmlEscape(descriptionSource).slice(0, 160);

      const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>処世術禄 | ${htmlEscape(titleText)}</title>
  <meta name="description" content="${description}" />
  <link rel="stylesheet" href="${rootPrefix}styles.css" />
</head>
<body>
  <header>
    <div class="container nav">
      <div class="brand">処世術禄</div>
      <nav class="nav-links">
        <a class="nav-link" href="${rootPrefix}index.html">トップ</a>
        <a class="nav-link" href="${rootPrefix}shoseijutsu.html">処世術集</a>
        <a class="nav-link" href="${rootPrefix}theory.html">理論集</a>
        <a class="nav-link" href="${rootPrefix}hub.html">みんなの処世術</a>
        <a class="nav-link" href="${rootPrefix}about.html">処世術禄とは</a>
      </nav>
    </div>
  </header>

  <main class="container">
    <section class="section">
      <a class="back-link" href="${rootPrefix}theory.html">← 理論集に戻る</a>
      <div class="detail-card detail-card--page theory-card theory-card--${htmlEscape(
        category.id
      )}">
        <div class="detail-header">
          <h2>${htmlEscape(titleText)}</h2>
          ${
            card.summary
              ? `<p class="detail-summary theory-card-summary">${htmlEscape(
                  card.summary
                )}</p>`
              : ""
          }
        </div>
        <div class="detail-body">
          ${card.definition ? `<p>${htmlEscape(card.definition)}</p>` : ""}
          ${listSection("要点", card.keyPoints)}
          ${listSection("落とし穴", card.pitfalls)}
          ${listSection("実装ヒント", card.strategies)}
          ${listSection("適用場面", card.applicationConditions)}
        </div>
      </div>
    </section>
  </main>

  <footer class="container">
    <p>理論の理解は、処世術を「信念」から「技術」に変えます。</p>
  </footer>
</body>
</html>
`;

      await ensureDir(path.dirname(outputDir));
      const wrote = await writeFileIfChanged(outputDir, html);
      if (wrote) {
        createdCount += 1;
      } else {
        skippedCount += 1;
      }
      generated.push({
        tagId: card.tagId,
        path: `${outputDirName}/${card.tagId}/`,
        filePath: outputDir,
      });
    }
  }

  return { generated, createdCount, skippedCount };
};

const buildSitemap = async (entries) => {
  const urls = [];

  for (const page of staticPages) {
    const filePath = path.join(repoRoot, page);
    try {
      const stats = await fs.stat(filePath);
      urls.push({
        loc: `${baseUrl}/${page}`,
        lastmod: formatDate(stats.mtime),
      });
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  for (const entry of entries) {
    const stats = await fs.stat(entry.filePath);
    urls.push({
      loc: `${baseUrl}/${entry.path}`,
      lastmod: formatDate(stats.mtime),
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>\n    <loc>${url.loc}</loc>\n    <lastmod>${url.lastmod}</lastmod>\n  </url>`
  )
  .join("\n")}
</urlset>
`;

  const sitemapPath = path.join(repoRoot, "sitemap.xml");
  await fs.writeFile(sitemapPath, xml, "utf8");
};

const run = async () => {
  const { generated, createdCount, skippedCount } = await buildCardPages();
  await buildSitemap(generated);
  console.log(
    `Generated ${createdCount} pages. Skipped ${skippedCount} unchanged pages. Total: ${generated.length}.`
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
