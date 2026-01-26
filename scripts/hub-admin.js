const storageKey = 'hubUserPosts';
const reactionKey = 'hubReactions';

const list = document.querySelector('#admin-card-list');
const emptyState = document.querySelector('#admin-empty');
const clearButton = document.querySelector('#admin-clear');

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

const savePosts = (posts) => {
  window.localStorage.setItem(storageKey, JSON.stringify(posts));
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

const getReactionKey = (postId) => `user-${postId}`;

const removeReactionForPost = (postId) => {
  const reactions = loadReactions();
  const key = getReactionKey(postId);
  if (key in reactions) {
    delete reactions[key];
    saveReactions(reactions);
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
  card.className = 'admin-card';
  card.dataset.postId = post.id;

  const main = document.createElement('div');
  main.className = 'admin-card-main';

  const header = document.createElement('div');
  header.className = 'admin-card-header';

  const title = document.createElement('h3');
  title.textContent = post.title;

  const badge = document.createElement('span');
  badge.className = 'admin-card-badge';
  badge.textContent = 'ユーザー投稿';

  header.append(title, badge);

  const meta = document.createElement('p');
  meta.className = 'admin-card-meta';
  const dateText = formatDate(post.createdAt);
  meta.textContent = `投稿者：${post.creator}${dateText ? `／${dateText}` : ''}`;

  const summary = document.createElement('p');
  summary.className = 'admin-card-summary';
  summary.textContent = post.summary || post.note || post.bullets?.[0] || '本文が登録されています。';

  main.append(header, meta, summary);

  if (post.tags?.length) {
    main.append(buildTagList(post.tags));
  }

  const actions = document.createElement('div');
  actions.className = 'admin-card-actions';

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'danger-button';
  deleteButton.dataset.postId = post.id;
  deleteButton.textContent = '削除';

  actions.append(deleteButton);
  card.append(main, actions);

  return card;
};

const renderPosts = () => {
  if (!list) {
    return;
  }

  const posts = loadPosts();
  list.innerHTML = '';

  posts.forEach((post) => {
    list.append(buildCard(post));
  });

  if (emptyState) {
    emptyState.classList.toggle('is-hidden', posts.length > 0);
  }
  if (clearButton) {
    clearButton.disabled = posts.length === 0;
  }
};

const deletePost = (postId) => {
  const posts = loadPosts();
  const nextPosts = posts.filter((post) => post.id !== postId);
  savePosts(nextPosts);
  removeReactionForPost(postId);
  renderPosts();
};

if (list) {
  list.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (!target.matches('[data-post-id]')) {
      return;
    }
    const postId = target.dataset.postId;
    if (!postId) {
      return;
    }
    const confirmed = window.confirm('この処世術カードを削除しますか？');
    if (!confirmed) {
      return;
    }
    deletePost(postId);
  });
}

if (clearButton) {
  clearButton.addEventListener('click', () => {
    const posts = loadPosts();
    if (posts.length === 0) {
      return;
    }
    const confirmed = window.confirm('すべての処世術カードを削除しますか？');
    if (!confirmed) {
      return;
    }
    savePosts([]);
    saveReactions({});
    renderPosts();
  });
}

renderPosts();
