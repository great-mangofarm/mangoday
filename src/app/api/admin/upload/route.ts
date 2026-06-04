import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/dal";
import { getSupabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/admin/upload  (multipart, field "file")
 * 관리자만. Supabase Storage(post-images, 공개)로 올리고 공개 URL 반환.
 */
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "10MB 이하만 업로드할 수 있어요." }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const day = new Date().toISOString().slice(0, 10);
  const path = `${day}/${crypto.randomUUID()}.${ext}`;

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from("post-images")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = supabase.storage.from("post-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
