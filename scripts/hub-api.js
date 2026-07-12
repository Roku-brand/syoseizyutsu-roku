const parseJson = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || '通信に失敗しました。');
  }
  return data;
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      accept: 'application/json',
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers ?? {}),
    },
  });
  return parseJson(response);
};

export const getPostKey = (post) => `${post.source}-${post.id}`;

export const fetchHubState = async () => {
  const data = await requestJson('/api/hub/posts');
  return {
    posts: Array.isArray(data.posts) ? data.posts : [],
    reactions: data.reactions && typeof data.reactions === 'object' ? data.reactions : {},
  };
};

export const fetchHubPost = async (id) => {
  const data = await requestJson(`/api/hub/posts?id=${encodeURIComponent(id)}`);
  return data.post ?? null;
};

export const createHubPost = async (post) => {
  const data = await requestJson('/api/hub/posts', {
    method: 'POST',
    body: JSON.stringify(post),
  });
  return data.post;
};

export const deleteHubPost = async (id, accessToken) =>
  requestJson(`/api/hub/posts?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${accessToken}` },
  });

export const clearHubPosts = async (accessToken) =>
  requestJson('/api/hub/posts', {
    method: 'DELETE',
    headers: { authorization: `Bearer ${accessToken}` },
  });

export const fetchReaction = async (key) => {
  const data = await requestJson(`/api/hub/reactions?key=${encodeURIComponent(key)}`);
  return data.reaction ?? { likes: 0, comments: [] };
};

export const sendReaction = async (payload) => {
  const data = await requestJson('/api/hub/reactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.reaction ?? { likes: 0, comments: [] };
};
