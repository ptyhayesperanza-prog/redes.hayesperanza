import { createClient } from "@/lib/supabase/server";

export async function getUsuarioActual() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, nombre_completo, rol, red_id, mentor_id")
    .eq("id", user.id)
    .maybeSingle();

  // perfil es null si la cuenta se autoregistro y el admin todavia no le
  // asigna rol/red — sigue "logueado" pero sin ningun acceso a datos.
  return { user, perfil };
}
