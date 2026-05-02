import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // Verifica que o chamador é um admin autenticado
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const { name, email, password, role } = await req.json();

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Cria o usuário no Supabase Auth
  const { data: newUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !newUser.user) {
    return NextResponse.json({ error: authError?.message ?? "Erro ao criar usuário." }, { status: 400 });
  }

  // Insere o perfil em public.users
  const { error: insertError } = await adminClient.from("users").insert({
    id: newUser.user.id,
    name,
    email,
    role,
    active: true,
  });

  if (insertError) {
    // Rollback: remove o usuário do Auth se o perfil falhou
    await adminClient.auth.admin.deleteUser(newUser.user.id);
    return NextResponse.json({ error: "Erro ao salvar perfil do usuário." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
