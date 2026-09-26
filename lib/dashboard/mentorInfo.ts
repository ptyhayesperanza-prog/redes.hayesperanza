import type { createClient } from "@/lib/supabase/server";
import { colorMentorHex } from "@/lib/colorMentor";

/** Nombre y color de cada mentoría, para agrupar tablas en la vista pastor/admin. */
export async function obtenerMentorInfoPorId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: mentores } = await supabase.from("mentores").select("id, nombre, color").order("nombre");
  return Object.fromEntries(
    (mentores ?? []).map((m) => [m.id, { nombre: m.nombre, colorHex: colorMentorHex(m.color) }]),
  );
}
