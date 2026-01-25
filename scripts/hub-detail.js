import { hubDefaultPosts } from './hub-data.js';

const storageKey = 'hubUserPosts';
const reactionKey = 'hubReactions';

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

const buildCommentItem = (comment) => {
  const item = document.createElement('li');
  item.className = 'hub-comment';
  const text = document.createElement('p');
  text.textContent = comment.text;
  const meta = document.createElement('span');
  meta.className = 'hub-comment-meta';
  meta.textContent = comment.createdAt
    ? new Date(comment.createdAt).toLocaleDateString('ja-JP')
    : '今さっき';
  item.append(text, meta);
  return item;
};

const buildDetailSocial = (postKey, reactions) => {
  const state = reactions[postKey] ?? { likes: 0, comments: [] };
  reactions[postKey] = state;

  const social = document.createElement('section');
  social.className = 'hub-card-social hub-detail-social';

  const heading = document.createElement('h3');
  heading.className = 'hub-detail-social-title';
  heading.textContent = 'コメント';

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

  const commentSection = document.createElement('div');
  commentSection.className = 'hub-comment-section';

  const commentList = document.createElement('ul');
  commentList.className = 'hub-comment-list';

  const emptyNote = document.createElement('p');
  emptyNote.className = 'hub-comment-empty';
  emptyNote.textContent = '最初のコメントを追加しましょう。';

  const commentForm = document.createElement('form');
  commentForm.className = 'hub-comment-form';

  const commentInput = document.createElement('textarea');
  commentInput.className = 'hub-comment-input';
  commentInput.rows = 3;
  commentInput.placeholder = 'コメントを書く（例：私も似た状況で助かりました）';

  const commentSubmit = document.createElement('button');
  commentSubmit.type = 'submit';
  commentSubmit.className = 'hub-comment-submit';
  commentSubmit.textContent = '送信';

  commentForm.append(commentInput, commentSubmit);
  commentSection.append(commentList, emptyNote, commentForm);

  const updateReactions = () => {
    likeCount.textContent = `いいね ${state.likes}`;
    commentCount.textContent = `コメント ${state.comments.length}`;
    likeButton.textContent = state.likes ? `いいね済み ${state.likes}` : 'いいね';
    commentList.innerHTML = '';
    if (state.comments.length) {
      emptyNote.classList.add('is-hidden');
      state.comments.forEach((comment) => {
        commentList.append(buildCommentItem(comment));
      });
    } else {
      emptyNote.classList.remove('is-hidden');
    }
  };

  likeButton.addEventListener('click', () => {
    state.likes += 1;
    updateReactions();
    saveReactions(reactions);
  });

  commentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = commentInput.value.trim();
    if (!value) {
      return;
    }
    state.comments.push({ text: value, createdAt: new Date().toISOString() });
    commentInput.value = '';
    updateReactions();
    saveReactions(reactions);
  });

  updateReactions();
  social.append(heading, reactionRow, actions, commentSection);
  return social;
};

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
let postKey = '';

if (userId) {
  const post = findUserPost(userId);
  if (post) {
    postKey = `user-${post.id}`;
    detailMarkup = renderUserDetail(post);
  }
} else if (topic) {
  const detail = findDefaultPost(topic);
  if (detail) {
    postKey = `default-${detail.id}`;
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

  if (postKey) {
    const reactions = loadReactions();
    detailContainer.append(buildDetailSocial(postKey, reactions));
  }
}

if (backLink) {
  backLink.href = 'hub.html#hub-list';
}
