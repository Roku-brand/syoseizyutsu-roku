import { hubDefaultPosts } from './hub-data.js';

const storageKey = 'hubUserPosts';

const loadPosts = () => {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const findDefaultPost = (topic) => hubDefaultPosts.find((post) => post.id === topic);
const findUserPost = (id) => loadPosts().find((post) => post.id === id);

const renderDetail = ({ eyebrow, title, summary, meta, tags, techniques, nextSteps }) => {
  document.title = `処世術禄 | ${title}`;
  const tagList = tags.map((tag) => `<span class="tag tag--compact">${tag}</span>`).join('');
  const techniqueList = techniques.map((item) => `<li>${item}</li>`).join('');
  const nextList = nextSteps.map((item) => `<li>${item}</li>`).join('');

  return `
    <div class="detail-card detail-card--page hub-detail-card">
      <div class="detail-header">
        <p class="hub-detail-eyebrow">${eyebrow}</p>
        <h2>${title}</h2>
        <p class="detail-summary">${summary}</p>
        <p class="hub-detail-meta">${meta}</p>
        <div class="tag-list tag-list--compact">${tagList}</div>
      </div>
      <div class="detail-body">
        <section>
          <h4>処世術リスト（10+）</h4>
          <ol class="hub-technique-list">
            ${techniqueList}
          </ol>
        </section>
        <section>
          <h4>次の一手</h4>
          <ul>
            ${nextList}
          </ul>
        </section>
      </div>
    </div>
  `;
};

const renderUserDetail = (post) => {
  document.title = `処世術禄 | ${post.title}`;
  const tagList = post.tags?.length
    ? post.tags.map((tag) => `<span class="tag tag--compact">${tag}</span>`).join('')
    : '';
  const techniqueList = (post.bullets ?? []).map((item) => `<li>${item}</li>`).join('');
  const note = post.note || '投稿者からのひと言はありません。';
  const dateText = post.createdAt ? new Date(post.createdAt).toLocaleDateString('ja-JP') : '';
  const metaText = `投稿者：${post.creator}${dateText ? `／${dateText}` : ''}`;

  return `
    <div class="detail-card detail-card--page hub-detail-card">
      <div class="detail-header">
        <p class="hub-detail-eyebrow">みんなの投稿</p>
        <h2>${post.title}</h2>
        <p class="detail-summary">${note}</p>
        <p class="hub-detail-meta">${metaText}</p>
        ${tagList ? `<div class="tag-list tag-list--compact">${tagList}</div>` : ''}
      </div>
      <div class="detail-body">
        <section>
          <h4>処世術リスト</h4>
          <ol class="hub-technique-list">
            ${techniqueList || '<li>本文のリストはまだありません。</li>'}
          </ol>
        </section>
      </div>
    </div>
  `;
};

const detailContainer = document.getElementById('hub-detail');
const emptyState = document.getElementById('hub-empty');
const backLink = document.getElementById('hub-back-link');

const params = new URLSearchParams(window.location.search);
const topic = params.get('topic');
const userId = params.get('id');

let detailMarkup = '';

if (userId) {
  const post = findUserPost(userId);
  if (post) {
    detailMarkup = renderUserDetail(post);
  }
} else if (topic) {
  const detail = findDefaultPost(topic);
  if (detail) {
    detailMarkup = renderDetail({
      eyebrow: 'みんなの処世術',
      title: detail.title,
      summary: detail.summary,
      meta: detail.meta,
      tags: detail.tags,
      techniques: detail.techniques,
      nextSteps: detail.nextSteps,
    });
  }
}

if (!detailMarkup) {
  detailContainer.innerHTML = '';
  emptyState.classList.remove('is-hidden');
} else {
  detailContainer.innerHTML = detailMarkup;
  emptyState.classList.add('is-hidden');
}

if (backLink) {
  backLink.href = 'hub.html#hub-list';
}
