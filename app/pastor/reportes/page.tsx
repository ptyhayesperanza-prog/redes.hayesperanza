import { createClient } from "@/lib/supabase/server";
import { ReportesTable, type FilaReporte } from "@/components/dashboard/ReportesTable";
import { obtenerRedesConMetricas } from "@/lib/dashboard/redesConMetricas";

export default async function ReportesDeRedesPage() {
  const supabase = await createClient();
  const redes = await obtenerRedesConMetricas(supabase);
  const redIds = redes.map((r) => r.id);

  const { data: reportes } =
    redIds.length > 0
      ? await supabase
          .from("reportes_semanales")
          .select(
            "id, red_id, semana_inicio, total_miembros, total_fieles, total_nuevos, se_recogio_ofrenda, ofrenda",
          )
          .in("red_id", redIds)
          .order("semana_inicio", { ascending: false })
      : { data: [] };

  const redPorId = new Map(redes.map((r) => [r.id, r]));

  const filas: FilaReporte[] = (reportes ?? []).map((r) => {
    const red = redPorId.get(r.red_id);
    return {
      id: r.id,
      redNombre: red?.nombre ?? "Red",
      liderLabel: red?.liderLabel ?? "—",
      semanaInicio: r.semana_inicio,
      totalMiembros: r.total_miembros ?? 0,
      asistieron: (r.total_fieles ?? 0) + (r.total_nuevos ?? 0),
      visitas: r.total_nuevos ?? 0,
      ofrenda: r.se_recogio_ofrenda ? (r.ofrenda ?? 0) : 0,
    };
  });

  return (
    <section className="page-section">
      <header className="header-top">
        <h2>Reportes de Redes</h2>
        <p>Consulta el informe de cualquier red de la iglesia.</p>
      </header>
      <ReportesTable filas={filas} />
    </section>
  );
}
