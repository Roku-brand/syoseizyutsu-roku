import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { clearHubPosts, deleteHubPost, fetchHubState } from './hub-api.js';

const supabase = createClient(
  'https://otwnmfoubxdenqkrkxmx.supabase.co',
  'sb_publishable_cEI9jtk6n0S01-2dGaPn3A_MLT28InS',
);

const ADMIN_EMAIL = 'tsubasa00928@gmail.com';

const list = document.querySelector('#admin-card-list');
const emptyState = document.querySelector('#admin-empty');
const clearButton = document.querySelector('#admin-clear');
let accessToken = '';
let posts = [];

const requireAdmin = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    document.querySelector('#admin-login')?.classList.remove('is-hidden');
    document.querySelector('#admin-content')?.classList.add('is-hidden');
    return false;
  }
  if ((session.user.email || '').trim().toLowerCase() !== ADMIN_EMAIL) {
    document.body.innerHTML =
      '<main class="container section"><h1>アクセスできません</h1><p>このページは管理者本人のみ利用できます。</p><a href="mypage.html">マイページへ戻る</a></main>';
    return false;
  }
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  if (error || profile?.role !== 'admin') {
    document.body.innerHTML =
      '<main class="container section"><h1>アクセスできません</h1><p>このページは管理者本人のみ利用できます。</p><a href="mypage.html">マイページへ戻る</a></main>';
    return false;
  }
  accessToken = session.access_token;
  return true;
};

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

  list.innerHTML = '';
  posts.forEach((post) => {
    list.append(buildCard(post));
  });

  emptyState?.classList.toggle('is-hidden', posts.length > 0);
  if (clearButton) {
    clearButton.disabled = posts.length === 0;
  }
};

const loadPosts = async () => {
  if (list) {
    list.innerHTML = '<p class="notice">投稿を読み込み中です。</p>';
  }
  try {
    const state = await fetchHubState();
    posts = state.posts;
  } catch (error) {
    posts = [];
    if (list) {
      list.innerHTML = `<p class="notice">${error.message}</p>`;
    }
    return;
  }
  renderPosts();
};

const withAdminAction = async (action) => {
  if (!accessToken) {
    window.location.replace('/app.html?login=required');
    return;
  }
  try {
    await action(accessToken);
  } catch (error) {
    window.alert(error.message);
    throw error;
  }
};

if (list) {
  list.addEventListener('click', async (event) => {
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
    target.disabled = true;
    try {
      await withAdminAction((accessToken) => deleteHubPost(postId, accessToken));
      posts = posts.filter((post) => post.id !== postId);
      renderPosts();
    } finally {
      target.disabled = false;
    }
  });
}

if (clearButton) {
  clearButton.addEventListener('click', async () => {
    if (posts.length === 0) {
      return;
    }
    const confirmed = window.confirm('すべての処世術カードを削除しますか？');
    if (!confirmed) {
      return;
    }
    clearButton.disabled = true;
    try {
      await withAdminAction((accessToken) => clearHubPosts(accessToken));
      posts = [];
      renderPosts();
    } finally {
      clearButton.disabled = false;
    }
  });
}

const loginForm = document.querySelector('#admin-login-form');
loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.querySelector('#admin-email')?.value.trim();
  const message = document.querySelector('#admin-login-message');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: new URL('hub-admin.html', window.location.href).href },
  });
  if (message) {
    message.classList.remove('is-hidden');
    message.textContent = error
      ? error.message
      : 'ログイン用メールを送信しました。メール内のリンクを開いてください。';
  }
});

if (await requireAdmin()) {
  document.querySelector('#admin-login')?.classList.add('is-hidden');
  document.querySelector('#admin-content')?.classList.remove('is-hidden');
  await loadPosts();
}
