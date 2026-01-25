const form = document.querySelector('#hub-create-form');

const storageKey = 'hubUserPosts';

const normalizeLines = (value) =>
  value
    .split('\n')
    .map((line) => line.replace(/^[-・*\s]+/, '').trim())
    .filter((line) => line.length > 0);

const normalizeTags = (value) =>
  value
    .replace(/[、]/g, ',')
    .split(',')
    .flatMap((part) => part.trim().split(/\s+/))
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);

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

form?.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const creator = formData.get('creator')?.toString().trim() ?? '';
  const title = formData.get('title')?.toString().trim() ?? '';
  const bullets = normalizeLines(formData.get('bullets')?.toString() ?? '');
  const tags = normalizeTags(formData.get('tags')?.toString() ?? '');
  const note = formData.get('note')?.toString().trim() ?? '';

  const newPost = {
    id: Date.now().toString(36),
    creator,
    title,
    bullets,
    tags,
    note,
    createdAt: new Date().toISOString(),
  };

  const posts = loadPosts();
  posts.unshift(newPost);
  savePosts(posts);

  window.location.href = 'hub.html#hub-list';
});
