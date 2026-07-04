import { del, get, list, put } from '@vercel/blob';

const POST_PREFIX = 'hub/posts/';
const REACTION_PREFIX = 'hub/reactions/';
const JSON_CONTENT_TYPE = 'application/json; charset=utf-8';

export class ApiError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const jsonResponse = (payload, init = {}) =>
  new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    headers: {
      'content-type': JSON_CONTENT_TYPE,
      'cache-control': 'no-store',
      ...(init.headers ?? {}),
    },
  });

export const errorResponse = (error) => {
  const status = error instanceof ApiError ? error.status : 500;
  const message =
    error instanceof ApiError
      ? error.message
      : 'サーバー側で処理に失敗しました。時間を置いて再試行してください。';
  return jsonResponse({ error: message }, { status });
};

const cleanText = (value, maxLength) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

const cleanLongText = (value, maxLength) =>
  String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);

const normalizeTags = (value) => {
  const source = Array.isArray(value) ? value : String(value ?? '').split(/[,\s、]+/);
  return [...new Set(source.map((tag) => cleanText(tag, 24)).filter(Boolean))].slice(0, 10);
};

const makeId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const requireBlobStorage = () => {
  if (
    !process.env.BLOB_READ_WRITE_TOKEN &&
    !(process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)
  ) {
    throw new ApiError(
      'Vercel Blob が未設定です。Vercel の Storage で Blob を作成し、プロジェクトに接続してください。',
      503,
    );
  }
};

const postPath = (id) => `${POST_PREFIX}${encodeURIComponent(id)}.json`;
const reactionPath = (key) => `${REACTION_PREFIX}${encodeURIComponent(key)}.json`;

const extractReactionKey = (pathname) => {
  const encoded = pathname.slice(REACTION_PREFIX.length).replace(/\.json$/, '');
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
};

const readStreamText = async (stream) => new Response(stream).text();

const readJsonBlob = async (pathname, fallback = null) => {
  requireBlobStorage();
  const result = await get(pathname, { access: 'private' });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return fallback;
  }
  const text = await readStreamText(result.stream);
  return JSON.parse(text);
};

const listBlobs = async (prefix) => {
  requireBlobStorage();
  const blobs = [];
  let cursor;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.cursor;
    if (!page.hasMore) {
      break;
    }
  } while (cursor);
  return blobs;
};

export const validatePostInput = (input) => {
  const creator = cleanText(input?.creator, 40);
  const title = cleanText(input?.title, 80);
  const note = cleanLongText(input?.note, 700);
  const bullets = (Array.isArray(input?.bullets) ? input.bullets : [])
    .map((item) => cleanLongText(item, 180))
    .filter(Boolean)
    .slice(0, 20);
  const tags = normalizeTags(input?.tags);

  if (!creator) {
    throw new ApiError('作成者名を入力してください。');
  }
  if (!title) {
    throw new ApiError('タイトルを入力してください。');
  }
  if (bullets.length === 0) {
    throw new ApiError('処世術リストを1件以上入力してください。');
  }
  if (tags.length === 0) {
    throw new ApiError('タグを1件以上入力してください。');
  }
  if (!note) {
    throw new ApiError('作成者からひと言を入力してください。');
  }

  return { creator, title, note, bullets, tags };
};

export const createPost = async (input) => {
  const data = validatePostInput(input);
  const now = new Date().toISOString();
  const post = {
    id: makeId(),
    source: 'user',
    creator: data.creator,
    title: data.title,
    bullets: data.bullets,
    tags: data.tags,
    note: data.note,
    createdAt: now,
    updatedAt: now,
  };

  requireBlobStorage();
  await put(postPath(post.id), JSON.stringify(post, null, 2), {
    access: 'private',
    contentType: JSON_CONTENT_TYPE,
    addRandomSuffix: false,
    cacheControlMaxAge: 60,
  });

  return post;
};

export const getPost = async (id) => {
  const cleanId = cleanText(id, 120);
  if (!cleanId) {
    throw new ApiError('投稿IDが指定されていません。');
  }
  return readJsonBlob(postPath(cleanId), null);
};

export const listPosts = async () => {
  const blobs = await listBlobs(POST_PREFIX);
  const posts = await Promise.all(blobs.map((blob) => readJsonBlob(blob.pathname, null)));
  return posts
    .filter(Boolean)
    .map((post) => ({ ...post, source: 'user' }))
    .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
};

export const deletePost = async (id) => {
  const cleanId = cleanText(id, 120);
  if (!cleanId) {
    throw new ApiError('削除する投稿IDが指定されていません。');
  }
  requireBlobStorage();
  await del(postPath(cleanId));
  await del(reactionPath(`user-${cleanId}`));
};

export const clearPosts = async () => {
  const [posts, reactions] = await Promise.all([listBlobs(POST_PREFIX), listBlobs(REACTION_PREFIX)]);
  const targets = [
    ...posts.map((blob) => blob.pathname),
    ...reactions
      .filter((blob) => extractReactionKey(blob.pathname).startsWith('user-'))
      .map((blob) => blob.pathname),
  ];
  if (targets.length) {
    await del(targets);
  }
  return targets.length;
};

const cleanReactionKey = (key) => {
  const value = cleanText(key, 160);
  if (!/^(user|default)-.+/.test(value)) {
    throw new ApiError('リアクション対象が不正です。');
  }
  return value;
};

const normalizeReaction = (reaction) => ({
  likes: Math.max(0, Number(reaction?.likes) || 0),
  comments: Array.isArray(reaction?.comments)
    ? reaction.comments
        .map((comment) => ({
          text: cleanLongText(comment?.text, 500),
          createdAt: cleanText(comment?.createdAt, 40) || new Date().toISOString(),
        }))
        .filter((comment) => comment.text)
        .slice(-100)
    : [],
});

export const getReaction = async (key) => {
  const cleanKey = cleanReactionKey(key);
  const reaction = await readJsonBlob(reactionPath(cleanKey), { likes: 0, comments: [] });
  return normalizeReaction(reaction);
};

export const listReactions = async () => {
  const blobs = await listBlobs(REACTION_PREFIX);
  const entries = await Promise.all(
    blobs.map(async (blob) => {
      const key = extractReactionKey(blob.pathname);
      const reaction = await readJsonBlob(blob.pathname, { likes: 0, comments: [] });
      return [key, normalizeReaction(reaction)];
    }),
  );
  return Object.fromEntries(entries);
};

export const saveReaction = async (key, reaction) => {
  const cleanKey = cleanReactionKey(key);
  const state = normalizeReaction(reaction);
  requireBlobStorage();
  await put(reactionPath(cleanKey), JSON.stringify(state, null, 2), {
    access: 'private',
    contentType: JSON_CONTENT_TYPE,
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
  return state;
};

export const applyReactionAction = async ({ key, action, text }) => {
  const state = await getReaction(key);
  if (action === 'like') {
    state.likes += 1;
    return saveReaction(key, state);
  }
  if (action === 'comment') {
    const commentText = cleanLongText(text, 500);
    if (!commentText) {
      throw new ApiError('コメントを入力してください。');
    }
    state.comments.push({ text: commentText, createdAt: new Date().toISOString() });
    return saveReaction(key, state);
  }
  throw new ApiError('未対応のリアクションです。');
};

export const assertAdminRequest = (request) => {
  const expected = process.env.HUB_ADMIN_TOKEN;
  if (!expected) {
    throw new ApiError('管理者トークン HUB_ADMIN_TOKEN が未設定です。', 503);
  }
  const actual = request.headers.get('x-admin-token') ?? '';
  if (actual !== expected) {
    throw new ApiError('管理者トークンが正しくありません。', 401);
  }
};
