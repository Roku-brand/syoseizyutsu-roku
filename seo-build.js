import { readFileSync, writeFileSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const ROOT = dirname(fileURLToPath(import.meta.url));
const SITE_ORIGIN = (process.env.SITE_ORIGIN || "https://syoseizyutsu-roku.vercel.app").replace(/\/$/, "");
const OLD_ORIGINS = [
  "https://roku-brand.github.io/syoseijyutsu-roku",
  "https://syoseizyutsu-roku.vercel.app",
];

const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), "utf8"));
const xmlEscape = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const lastModified = (path) => {
  try {
    const date = execFileSync("git", ["log", "-1", "--format=%cs", "--", path], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  } catch {}

  try {
    return statSync(join(ROOT, path)).mtime.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

const upsertHeadTag = (html, pattern, tag) => {
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace(/\s*<link rel="stylesheet"/, `\n${tag}\n  <link rel="stylesheet"`);
};

const normalizePageSeo = (file, path) => {
  const fullPath = join(ROOT, file);
  let html = readFileSync(fullPath, "utf8");

  for (const origin of OLD_ORIGINS) {
    html = html.split(origin).join(SITE_ORIGIN);
  }

  const canonicalUrl = `${SITE_ORIGIN}${path}`;
  html = upsertHeadTag(
    html,
    /\s*<link rel="canonical" href="[^"]*"\s*\/?>/,
    `  <link rel="canonical" href="${canonicalUrl}" />`
  );
  html = upsertHeadTag(
    html,
    /\s*<meta property="og:url" content="[^"]*"\s*\/?>/,
    `  <meta property="og:url" content="${canonicalUrl}" />`
  );

  writeFileSync(fullPath, html);
};

const staticPages = [
  { file: "index.html", path: "/", changefreq: "weekly", priority: "1.0" },
  { file: "shoseijutsu.html", path: "/shoseijutsu.html", changefreq: "weekly", priority: "0.9" },
  { file: "theory.html", path: "/theory.html", changefreq: "weekly", priority: "0.9" },
  { file: "hub.html", path: "/hub.html", changefreq: "weekly", priority: "0.8" },
  { file: "about.html", path: "/about.html", changefreq: "monthly", priority: "0.6" },
  { file: "search.html", path: "/search.html", changefreq: "weekly", priority: "0.7" },
];

const entries = [];
for (const page of staticPages) {
  normalizePageSeo(page.file, page.path);
  entries.push({
    loc: `${SITE_ORIGIN}${page.path}`,
    lastmod: lastModified(page.file),
    changefreq: page.changefreq,
    priority: page.priority,
  });
}

const foundationNames = ["behavior", "cognition", "social", "structure", "wisdom"];
for (const name of foundationNames) {
  const sourcePath = `data/foundation/${name}.json`;
  const modified = lastModified(sourcePath);
  const category = readJson(sourcePath);

  for (const item of category.items) {
    entries.push({
      loc: `${SITE_ORIGIN}/theory/${encodeURIComponent(item.tagId)}/`,
      lastmod: modified,
      changefreq: "monthly",
      priority: "0.7",
    });
  }
}

const techniqueSource = "data/techniques/all-techniques.json";
const techniqueModified = lastModified(techniqueSource);
const techniqueData = readJson(techniqueSource);
for (const category of techniqueData.categories) {
  for (const subcategory of category.subcategories) {
    for (const item of subcategory.items) {
      entries.push({
        loc: `${SITE_ORIGIN}/technique/${encodeURIComponent(item.id)}/`,
        lastmod: techniqueModified,
        changefreq: "monthly",
        priority: "0.7",
      });
    }
  }
}

const sitemapEntries = entries
  .map(
    ({ loc, lastmod, changefreq, priority }) => `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  )
  .join("\n");

writeFileSync(
  join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapEntries}\n</urlset>\n`
);

writeFileSync(
  join(ROOT, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`
);

console.log(`SEO normalized for ${staticPages.length} root pages.`);
console.log(`Sitemap generated with ${entries.length} URLs for ${SITE_ORIGIN}.`);
