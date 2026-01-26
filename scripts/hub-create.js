const form = document.querySelector('#hub-create-form');
const bulletList = document.querySelector('[data-bullet-list]');
const addBulletButton = document.querySelector('[data-add-bullet]');

const storageKey = 'hubUserPosts';

const createBulletRow = (value = '') => {
  const row = document.createElement('div');
  row.className = 'hub-bullet-row';

  const marker = document.createElement('span');
  marker.className = 'hub-bullet-marker';
  marker.setAttribute('aria-hidden', 'true');
  marker.textContent = '・';

  const input = document.createElement('input');
  input.className = 'hub-form-input hub-bullet-input';
  input.type = 'text';
  input.name = 'bullets[]';
  input.placeholder = '例：補足があれば短く添える';
  input.value = value;

  const removeButton = document.createElement('button');
  removeButton.className = 'hub-bullet-remove';
  removeButton.type = 'button';
  removeButton.dataset.removeBullet = 'true';
  removeButton.setAttribute('aria-label', '行を削除');
  removeButton.textContent = '×';

  row.append(marker, input, removeButton);

  removeButton.addEventListener('click', () => {
    row.remove();
    updateRemoveButtons();
  });

  return row;
};

const updateRemoveButtons = () => {
  if (!bulletList) {
    return;
  }
  const rows = bulletList.querySelectorAll('.hub-bullet-row');
  const isSingle = rows.length <= 1;
  rows.forEach((row) => {
    const removeButton = row.querySelector('[data-remove-bullet]');
    if (removeButton) {
      removeButton.disabled = isSingle;
      removeButton.setAttribute('aria-disabled', String(isSingle));
    }
  });
};

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

if (bulletList && addBulletButton) {
  bulletList.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (target.matches('[data-remove-bullet]')) {
      const row = target.closest('.hub-bullet-row');
      row?.remove();
      updateRemoveButtons();
    }
  });

  addBulletButton.addEventListener('click', () => {
    const row = createBulletRow();
    bulletList.appendChild(row);
    updateRemoveButtons();
    row.querySelector('input')?.focus();
  });

  updateRemoveButtons();
}

form?.addEventListener('submit', (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const creator = formData.get('creator')?.toString().trim() ?? '';
  const title = formData.get('title')?.toString().trim() ?? '';
  const bullets = Array.from(form.querySelectorAll('input[name="bullets[]"]'))
    .map((input) => input.value.trim())
    .filter((value) => value.length > 0);
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
