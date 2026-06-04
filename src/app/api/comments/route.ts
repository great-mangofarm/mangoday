import { NextResponse, type NextRequest } from "next/server";
import { getUserSession, getAdminSession } from "@/lib/auth/dal";
import { sessionKey } from "@/lib/auth/session";
import { configuredProviders } from "@/lib/auth/providers";
import { getVisibleComments } from "@/lib/comments";

/**
 * GET /api/comments?postId=<uuid>
 * 공개 댓글 목록 + 현재 뷰어 정보. 글 페이지를 정적으로 유지하기 위해 클라이언트에서 호출.
 */
export async function GET(request: NextRequest) {
  const postId = request.nextUrl.searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "postId 필요" }, { status: 400 });
  }

  const [rows, session, admin] = await Promise.all([
    getVisibleComments(postId),
    getUserSession(),
    getAdminSession(),
  ]);

  const myKey = session ? sessionKey(session) : null;
  const isAdmin = !!admin;

  const comments = rows.map((c) => ({
    id: c.id,
    name: c.author_name,
    image: c.author_image,
    provider: c.author_provider,
    content: c.content,
    createdAt: c.created_at,
    mine: myKey != null && c.author_key === myKey,
  }));

  return NextResponse.json({
    comments,
    viewer: {
      loggedIn: !!session,
      name: session?.name ?? null,
      picture: session?.picture ?? null,
      isAdmin,
      providers: configuredProviders(),
    },
  });
}
