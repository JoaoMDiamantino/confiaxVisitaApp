import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function parseJwtClaims(token: string): Record<string, unknown> | null {
  try {
    const seg = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(seg, "base64").toString());
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Usuário não autenticado: redireciona para login (exceto a própria rota /login)
  if (!user && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Usuário autenticado tentando acessar /login: redireciona
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Lê role e active do JWT (sem round-trip ao banco).
  // Requer custom_access_token_hook ativo em: Supabase Dashboard → Auth Hooks.
  // Enquanto o hook não estiver ativo, cai no fallback DB abaixo.
  let jwtRole: string | undefined;
  let jwtActive: boolean | undefined;
  let claimsFromJwt = false;

  if (user) {
    const { data: { session } } = await supabase.auth.getSession();
    const claims = session?.access_token ? parseJwtClaims(session.access_token) : null;
    if (claims?.user_role !== undefined) {
      jwtRole = claims.user_role as string;
      jwtActive = claims.user_active as boolean;
      claimsFromJwt = true;
    }
  }

  async function getProfile() {
    if (claimsFromJwt) return { role: jwtRole, active: jwtActive };
    const { data: profile } = await supabase
      .from("users")
      .select("role, active")
      .eq("id", user!.id)
      .single();
    return profile ?? { role: undefined, active: undefined };
  }

  // Proteção das rotas admin por role
  if (user && pathname.startsWith("/admin")) {
    const profile = await getProfile();

    if (!profile?.active) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Proteção das rotas do vendedor por role
  if (user && (pathname.startsWith("/dashboard") || pathname.startsWith("/visitas"))) {
    const profile = await getProfile();

    if (!profile?.active) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (profile?.role !== "vendedor") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
