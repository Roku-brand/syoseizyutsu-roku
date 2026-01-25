import { hubDefaultPosts } from './hub-data.js';

const storageKey = 'hubUserPosts';
const list = document.querySelector('#hub-card-grid');

const formatDate = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

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

const buildTagList = (tags) => {
  const tagList = document.createElement('div');
  tagList.className = 'tag-list tag-list--compact hub-card-tags';
  tags.forEach((tag) => {
    const span = document.createElement('span');
    span.className = 'tag tag--compact';
    span.textContent = tag;
    tagList.append(span);
  });
  return tagList;
};

const buildCard = (post) => {
  const card = document.createElement('a');
  card.className = 'card hub-card hub-card-link';
  card.href = post.source === 'user' ? `hub-detail.html?id=${post.id}` : `hub-detail.html?topic=${post.id}`;

  const title = document.createElement('h3');
  title.textContent = post.title;

  const summary = document.createElement('p');
  summary.className = 'hub-card-summary';
  summary.textContent =
    post.summary || post.note || post.bullets?.[0] || '新しい処世術が投稿されました。';

  const meta = document.createElement('p');
  meta.className = 'hub-card-meta';
  if (post.source === 'user') {
    const dateText = formatDate(post.createdAt);
    meta.textContent = `投稿者：${post.creator}${dateText ? `／${dateText}` : ''}`;
  } else {
    meta.textContent = post.meta || 'みんなの処世術';
  }

  card.append(title, summary, meta);

  if (post.tags?.length) {
    card.append(buildTagList(post.tags));
  }

  return card;
};

const renderPosts = () => {
  if (!list) {
    return;
  }

  const userPosts = loadPosts().map((post) => ({ ...post, source: 'user' }));
  const defaultPosts = hubDefaultPosts.map((post) => ({ ...post, source: 'default' }));
  const posts = [...userPosts, ...defaultPosts];

  list.innerHTML = '';
  posts.forEach((post) => {
    list.append(buildCard(post));
  });
};

renderPosts();
