const storageKey = 'hubUserPosts';
const list = document.querySelector('.card-grid');

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
  const card = document.createElement('article');
  card.className = 'card hub-card hub-card--user';

  const title = document.createElement('h3');
  title.textContent = post.title;

  const summary = document.createElement('p');
  summary.className = 'hub-card-summary';
  summary.textContent = post.note || post.bullets?.[0] || '新しい処世術が投稿されました。';

  const meta = document.createElement('p');
  meta.className = 'hub-card-meta';
  const dateText = formatDate(post.createdAt);
  meta.textContent = `投稿者：${post.creator}${dateText ? `／${dateText}` : ''}`;

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

  const posts = loadPosts();
  posts.forEach((post) => {
    list.prepend(buildCard(post));
  });
};

renderPosts();
