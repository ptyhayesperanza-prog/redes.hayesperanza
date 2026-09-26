import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Destino del enlace de "confirma tu correo" que manda Supabase al
 * registrarse (emailRedirectTo en RegistroForm). Antes el enlace caía en "/"
 * con un ?code= que nadie procesaba y la persona terminaba en /login sin
 * saber si su correo había quedado confirmado.
 *
 * Supabase ya confirmó el correo antes de redirigir aquí; lo único que falta
 * es abrir la sesión. Eso solo funciona en el mismo navegador donde se hizo
 * el registro (PKCE). Si se abre en otro, el correo igual quedó confirmado:
 * se manda a /login con un aviso para que entre con su contraseña.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;

  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }

  // Location relativa: el navegador la resuelve contra el mismo sitio en el
  // que está (no depende del host que vea el servidor detrás del proxy de
  // Vercel) y es imposible que mande a otro dominio.
  return new Response(null, {
    status: 303,
    headers: { Location: ok ? "/" : "/login?aviso=confirmado" },
  });
}
