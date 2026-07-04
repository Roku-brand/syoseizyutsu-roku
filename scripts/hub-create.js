import { createHubPost } from './hub-api.js';

const form = document.querySelector('#hub-create-form');
const bulletList = document.querySelector('[data-bullet-list]');
const addBulletButton = document.querySelector('[data-add-bullet]');
const submitButton = form?.querySelector('button[type="submit"]');

const statusMessage = document.createElement('p');
statusMessage.className = 'helper-text hub-form-status';
form?.querySelector('.hub-form-actions')?.prepend(statusMessage);

const setStatus = (message) => {
  statusMessage.textContent = message;
};

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

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    creator: formData.get('creator')?.toString().trim() ?? '',
    title: formData.get('title')?.toString().trim() ?? '',
    bullets: Array.from(form.querySelectorAll('input[name="bullets[]"]'))
      .map((input) => input.value.trim())
      .filter((value) => value.length > 0),
    tags: normalizeTags(formData.get('tags')?.toString() ?? ''),
    note: formData.get('note')?.toString().trim() ?? '',
  };

  submitButton.disabled = true;
  setStatus('投稿を保存しています。');

  try {
    const post = await createHubPost(payload);
    window.location.href = `hub-detail.html?id=${encodeURIComponent(post.id)}`;
  } catch (error) {
    setStatus(error.message);
    submitButton.disabled = false;
  }
});
