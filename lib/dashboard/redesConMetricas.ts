import type { createClient } from "@/lib/supabase/server";

export type RedConMetricas = {
  id: string;
  nombre: string;
  mentorId: string | null;
  liderLabel: string;
  ultimoReporte: {
    id: string;
    semanaInicio: string;
    totalMiembros: number;
    asistieron: number;
    faltaron: number;
    visitas: number;
    congregan: number;
    ofrenda: number;
  } | null;
};

/**
 * Redes visibles para la sesión actual (RLS decide el alcance: mentor ve
 * las suyas, pastor/admin ven todas) con el líder real (o su referencia de
 * texto si nadie se ha registrado aún) y las métricas de su reporte más
 * reciente. Usado por /mentor y /pastor — la diferencia de alcance entre
 * ambos la resuelve Postgres, no este código.
 */
export async function obtenerRedesConMetricas(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<RedConMetricas[]> {
  const { data: redes } = await supabase
    .from("redes")
    .select("id, nombre, mentor_id, colider, lider_referencia")
    .order("nombre");

  if (!redes || redes.length === 0) return [];

  const redIds = redes.map((r) => r.id);

  const [{ data: lideres }, { data: reportes }] = await Promise.all([
    supabase
      .from("perfiles")
      .select("red_id, nombre_completo")
      .eq("rol", "lider")
      .in("red_id", redIds),
    supabase
      .from("reportes_semanales")
      .select(
        "id, red_id, semana_inicio, total_miembros, total_fieles, total_nuevos, se_congregan, se_recogio_ofrenda, ofrenda",
      )
      .in("red_id", redIds)
      .order("semana_inicio", { ascending: false }),
  ]);

  const lideresPorRed = new Map<string, string[]>();
  (lideres ?? []).forEach((l) => {
    if (!l.red_id) return;
    const lista = lideresPorRed.get(l.red_id) ?? [];
    lista.push(l.nombre_completo);
    lideresPorRed.set(l.red_id, lista);
  });

  const ultimoReportePorRed = new Map<string, NonNullable<typeof reportes>[number]>();
  (reportes ?? []).forEach((r) => {
    if (!ultimoReportePorRed.has(r.red_id)) ultimoReportePorRed.set(r.red_id, r);
  });

  return redes.map((red) => {
    const nombresLideresReales = lideresPorRed.get(red.id);
    const liderLabel =
      nombresLideresReales && nombresLideresReales.length > 0
        ? nombresLideresReales.join(" / ")
        : red.lider_referencia || red.colider || "Sin líder asignado";

    const ultimo = ultimoReportePorRed.get(red.id);

    return {
      id: red.id,
      nombre: red.nombre,
      mentorId: red.mentor_id,
      liderLabel,
      ultimoReporte: ultimo
        ? {
            id: ultimo.id,
            semanaInicio: ultimo.semana_inicio,
            totalMiembros: ultimo.total_miembros ?? 0,
            asistieron: (ultimo.total_fieles ?? 0) + (ultimo.total_nuevos ?? 0),
            faltaron: Math.max(0, (ultimo.total_miembros ?? 0) - (ultimo.total_fieles ?? 0)),
            visitas: ultimo.total_nuevos ?? 0,
            congregan: ultimo.se_congregan ?? 0,
            ofrenda: ultimo.se_recogio_ofrenda ? (ultimo.ofrenda ?? 0) : 0,
          }
        : null,
    };
  });
}
