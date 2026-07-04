import {
  assertAdminRequest,
  clearPosts,
  createPost,
  deletePost,
  errorResponse,
  getPost,
  jsonResponse,
  listPosts,
  listReactions,
} from '../../lib/hub-store.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      const post = await getPost(id);
      if (!post) {
        return jsonResponse({ error: '指定された投稿が見つかりません。' }, { status: 404 });
      }
      return jsonResponse({ post });
    }

    const [posts, reactions] = await Promise.all([listPosts(), listReactions()]);
    return jsonResponse({ posts, reactions });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request) {
  try {
    const input = await request.json();
    const post = await createPost(input);
    return jsonResponse({ post }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request) {
  try {
    assertAdminRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      await deletePost(id);
      return jsonResponse({ ok: true });
    }

    const deleted = await clearPosts();
    return jsonResponse({ ok: true, deleted });
  } catch (error) {
    return errorResponse(error);
  }
}
