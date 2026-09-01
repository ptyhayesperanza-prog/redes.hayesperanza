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
    .single();

  if (!perfil) return null;

  return { user, perfil };
}
