"use server";

import { getUserSession, getAdminSession } from "@/lib/auth/dal";
import { sessionKey } from "@/lib/auth/session";
import {
  deleteCommentRow,
  getCommentAuthorKey,
  insertComment,
  isPostCommentable,
} from "@/lib/comments";

const MAX_LEN = 2000;

export interface CommentActionResult {
  ok: boolean;
  error?: string;
}

export async function createComment(
  postId: string,
  content: string,
): Promise<CommentActionResult> {
  const session = await getUserSession();
  if (!session) return { ok: false, error: "로그인이 필요해요." };

  const text = content.trim();
  if (!text) return { ok: false, error: "내용을 입력해 주세요." };
  if (text.length > MAX_LEN) {
    return { ok: false, error: `댓글은 ${MAX_LEN}자 이하로 작성해 주세요.` };
  }

  if (!(await isPostCommentable(postId))) {
    return { ok: false, error: "댓글을 달 수 없는 글이에요." };
  }

  try {
    await insertComment({
      postId,
      authorName: session.name || "익명",
      authorProvider: session.provider,
      authorKey: sessionKey(session),
      authorImage: session.picture ?? null,
      content: text,
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "작성 실패" };
  }
}

export async function deleteComment(id: string): Promise<CommentActionResult> {
  const session = await getUserSession();
  if (!session) return { ok: false, error: "로그인이 필요해요." };

  const admin = await getAdminSession();
  const ownerKey = await getCommentAuthorKey(id);
  if (!ownerKey) return { ok: false, error: "이미 삭제된 댓글이에요." };

  const isOwner = ownerKey === sessionKey(session);
  if (!isOwner && !admin) {
    return { ok: false, error: "삭제 권한이 없어요." };
  }

  try {
    await deleteCommentRow(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "삭제 실패" };
  }
}
