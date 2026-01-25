# 処世術禄

## カード詳細ページと sitemap 生成

このリポジトリは GitHub Pages 向けの静的サイトです。理論カード（B-/C-/S-/T-/W-）の詳細ページと `sitemap.xml` を自動生成するために、以下のスクリプトを用意しています。

### 実行手順

```bash
npm run build:pages
```

- `scripts/generate-pages-and-sitemap.mjs` がカードデータを読み込み、
  - `theories/<tagId>/index.html`
  - `wisdom/<tagId>/index.html`
  を生成します。
- 生成したページを含めて `sitemap.xml` を最新化します。

### 生成物のコミット方法

1. `npm run build:pages` を実行します。
2. `git status` で生成物が増えていることを確認します。
3. 生成物（`theories/`, `wisdom/`, `sitemap.xml` など）を `git add` してコミットします。

```bash
git add theories wisdom sitemap.xml
git commit -m "Generate card detail pages and sitemap"
```
