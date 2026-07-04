import { hubDefaultPosts } from './hub-data.js';
import { fetchHubState, getPostKey } from './hub-api.js';

const storageKey = 'hubUserPosts';
const reactionKey = 'hubReactions';
const list = document.querySelector('#hub-card-grid');
const emptyState = document.querySelector('#hub-empty');
const filteredEmptyState = document.querySelector('#hub-empty-filter');
const searchInput = document.querySelector('#hub-search-input');
const sortSelect = document.querySelector('#hub-sort');
const resultCount = document.querySelector('#hub-result-count');

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

const loadLocalPosts = () => {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((post) => ({ ...post, source: 'user' })) : [];
  } catch {
    return [];
  }
};

const loadLocalReactions = () => {
  const raw = window.localStorage.getItem(reactionKey);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

let userPosts = [];
let reactions = {};
let loadError = '';

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

const buildCardReactions = (post) => {
  const postKey = getPostKey(post);
  const state = reactions[postKey] ?? { likes: 0, comments: [] };

  const reactionRow = document.createElement('div');
  reactionRow.className = 'hub-card-reactions hub-card-reactions--inline';

  const likeCount = document.createElement('span');
  likeCount.className = 'hub-reaction';
  likeCount.textContent = `いいね ${state.likes ?? 0}`;

  const commentCount = document.createElement('span');
  commentCount.className = 'hub-reaction';
  commentCount.textContent = `コメント ${state.comments?.length ?? 0}`;

  reactionRow.append(likeCount, commentCount);
  return reactionRow;
};

const buildCard = (post) => {
  const card = document.createElement('div');
  card.className = 'card hub-card';
  if (post.source === 'user') {
    card.classList.add('hub-card--user');
  }

  const link = document.createElement('a');
  link.className = 'hub-card-link';
  link.href = post.source === 'user' ? `hub-detail.html?id=${post.id}` : `hub-detail.html?topic=${post.id}`;

  const title = document.createElement('h3');
  title.textContent = post.title;

  const summary = document.createElement('p');
  summary.className = 'hub-card-summary';
  summary.textContent =
    post.summary || post.note || post.bullets?.[0] || '新しい処世術が投稿されました。';

  const metaRow = document.createElement('div');
  metaRow.className = 'hub-card-meta-row';

  const meta = document.createElement('p');
  meta.className = 'hub-card-meta';
  if (post.source === 'user') {
    const dateText = formatDate(post.createdAt);
    meta.textContent = `投稿者：${post.creator}${dateText ? `／${dateText}` : ''}`;
  } else {
    meta.textContent = post.meta || 'みんなの処世術';
  }

  metaRow.append(meta, buildCardReactions(post));
  link.append(title, summary, metaRow);

  if (post.tags?.length) {
    link.append(buildTagList(post.tags));
  }

  card.append(link);
  return card;
};

const buildSearchText = (post) =>
  [
    post.title,
    post.summary,
    post.note,
    post.creator,
    ...(post.bullets ?? []),
    ...(post.tags ?? []),
  ]
    .filter(Boolean)
    .join(' ');

const getLikes = (post) => reactions[getPostKey(post)]?.likes ?? 0;

const sortPosts = (posts, mode) => {
  if (mode === 'likes') {
    return [...posts].sort((a, b) => getLikes(b) - getLikes(a));
  }
  return [...posts].sort((a, b) => {
    const aTime = Date.parse(a.createdAt ?? '') || 0;
    const bTime = Date.parse(b.createdAt ?? '') || 0;
    return bTime - aTime;
  });
};

const renderPosts = () => {
  if (!list) {
    return;
  }

  const defaultPosts = hubDefaultPosts.map((post) => ({ ...post, source: 'default' }));
  const posts = [...userPosts, ...defaultPosts];
  const query = searchInput?.value.trim().toLowerCase() ?? '';
  const filteredPosts = posts.filter((post) => {
    if (!query) {
      return true;
    }
    return buildSearchText(post).toLowerCase().includes(query);
  });
  const sortedPosts = sortPosts(filteredPosts, sortSelect?.value ?? 'new');

  list.innerHTML = '';
  sortedPosts.forEach((post) => {
    list.append(buildCard(post));
  });

  emptyState?.classList.toggle('is-hidden', posts.length > 0);
  filteredEmptyState?.classList.toggle('is-hidden', posts.length === 0 || filteredPosts.length > 0);

  if (resultCount) {
    const suffix = loadError ? `（${loadError}）` : '';
    resultCount.textContent = posts.length > 0 ? `${filteredPosts.length}件の処世術が見つかりました。${suffix}` : suffix;
  }
};

const loadHub = async () => {
  if (resultCount) {
    resultCount.textContent = '投稿を読み込み中です。';
  }
  try {
    const state = await fetchHubState();
    userPosts = state.posts;
    reactions = state.reactions;
    loadError = '';
  } catch (error) {
    userPosts = loadLocalPosts();
    reactions = loadLocalReactions();
    loadError = `サーバー接続不可: ${error.message}`;
  }
  renderPosts();
};

searchInput?.addEventListener('input', renderPosts);
sortSelect?.addEventListener('change', renderPosts);

loadHub();
