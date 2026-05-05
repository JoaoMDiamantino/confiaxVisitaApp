import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const path = request.nextUrl.searchParams.get("path");
  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("visita-fotos").createSignedUrl(path, 3600);

  if (error || !data) return NextResponse.json({ error: "Failed to generate URL" }, { status: 500 });

  return NextResponse.json({ signedUrl: data.signedUrl });
}
