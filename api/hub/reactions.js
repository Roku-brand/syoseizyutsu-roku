import {
  applyReactionAction,
  errorResponse,
  getReaction,
  jsonResponse,
  listReactions,
} from '../../lib/hub-store.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key) {
      const reaction = await getReaction(key);
      return jsonResponse({ reaction });
    }

    const reactions = await listReactions();
    return jsonResponse({ reactions });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request) {
  try {
    const input = await request.json();
    const reaction = await applyReactionAction(input);
    return jsonResponse({ reaction });
  } catch (error) {
    return errorResponse(error);
  }
}
