import { hubDefaultPosts } from './hub-data.js';

const storageKey = 'hubUserPosts';
const reactionKey = 'hubReactions';
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

const loadReactions = () => {
  const raw = window.localStorage.getItem(reactionKey);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
};

const saveReactions = (reactions) => {
  window.localStorage.setItem(reactionKey, JSON.stringify(reactions));
};

const getPostKey = (post) => `${post.source}-${post.id}`;

const buildCardSocial = (post, reactions) => {
  const postKey = getPostKey(post);
  const state = reactions[postKey] ?? { likes: 0, comments: [] };
  reactions[postKey] = state;

  const social = document.createElement('div');
  social.className = 'hub-card-social';

  const reactionRow = document.createElement('div');
  reactionRow.className = 'hub-card-reactions';

  const likeCount = document.createElement('span');
  likeCount.className = 'hub-reaction';

  const commentCount = document.createElement('span');
  commentCount.className = 'hub-reaction';

  reactionRow.append(likeCount, commentCount);

  const actions = document.createElement('div');
  actions.className = 'hub-card-actions';

  const likeButton = document.createElement('button');
  likeButton.type = 'button';
  likeButton.className = 'hub-action';

  actions.append(likeButton);

  const updateReactions = () => {
    likeCount.textContent = `いいね ${state.likes}`;
    commentCount.textContent = `コメント ${state.comments.length}`;
    likeButton.textContent = state.likes ? `いいね済み ${state.likes}` : 'いいね';
  };

  likeButton.addEventListener('click', () => {
    state.likes += 1;
    updateReactions();
    saveReactions(reactions);
  });

  updateReactions();
  social.append(reactionRow, actions);
  return social;
};

const buildCard = (post, reactions) => {
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

  const meta = document.createElement('p');
  meta.className = 'hub-card-meta';
  if (post.source === 'user') {
    const dateText = formatDate(post.createdAt);
    meta.textContent = `投稿者：${post.creator}${dateText ? `／${dateText}` : ''}`;
  } else {
    meta.textContent = post.meta || 'みんなの処世術';
  }

  link.append(title, summary, meta);

  if (post.tags?.length) {
    link.append(buildTagList(post.tags));
  }

  const social = buildCardSocial(post, reactions);
  card.append(link, social);

  return card;
};

const renderPosts = () => {
  if (!list) {
    return;
  }

  const userPosts = loadPosts().map((post) => ({ ...post, source: 'user' }));
  const defaultPosts = hubDefaultPosts.map((post) => ({ ...post, source: 'default' }));
  const posts = [...userPosts, ...defaultPosts];
  const reactions = loadReactions();

  list.innerHTML = '';
  posts.forEach((post) => {
    list.append(buildCard(post, reactions));
  });
};

renderPosts();
