import { formatearFecha } from "@/lib/fecha";
import { createClient } from "@/lib/supabase/server";
import { obtenerRedesConMetricas } from "@/lib/dashboard/redesConMetricas";
import { KpiCard } from "@/components/dashboard/KpiCard";

export default async function InvitacionesYVisitasPage() {
  const supabase = await createClient();
  const redes = await obtenerRedesConMetricas(supabase);
  const redIds = redes.map((r) => r.id);
  const nombrePorRed = new Map(redes.map((r) => [r.id, r.nombre]));

  const { data: reportes } =
    redIds.length > 0
      ? await supabase
          .from("reportes_semanales")
          .select("id, red_id, semana_inicio")
          .in("red_id", redIds)
      : { data: [] };

  const reporteIds = (reportes ?? []).map((r) => r.id);
  const reportePorId = new Map((reportes ?? []).map((r) => [r.id, r]));

  const { data: visitas } =
    reporteIds.length > 0
      ? await supabase
          .from("asistencia_semanal")
          .select("reporte_id, nombre, invitado_por, miembros_red!asistencia_semanal_invitado_por_fkey(nombre, apellido)")
          .in("reporte_id", reporteIds)
          .eq("tipo", "nuevo")
      : { data: [] };

  const filas = (visitas ?? [])
    .map((v) => {
      const reporte = reportePorId.get(v.reporte_id);
      if (!reporte) return null;
      const invitadoPorNombre = v.miembros_red
        ? `${v.miembros_red.nombre} ${v.miembros_red.apellido ?? ""}`.trim()
        : "Sin registrar";
      return {
        redNombre: nombrePorRed.get(reporte.red_id) ?? "Red",
        semanaInicio: reporte.semana_inicio,
        nombre: v.nombre ?? "Visita sin nombre",
        invitadoPor: invitadoPorNombre,
      };
    })
    .filter((f) => f !== null)
    .sort((a, b) => b.semanaInicio.localeCompare(a.semanaInicio));

  return (
    <section className="page-section">
      <header className="header-top">
        <h2>Invitaciones y Visitas</h2>
        <p>Seguimiento a nuevos asistentes en toda la iglesia.</p>
      </header>

      <div className="kpi-grid">
        <KpiCard title="Visitas registradas" value={filas.length} note="En todas las redes" highlight />
      </div>

      {filas.length === 0 ? (
        <div className="placeholder-content">
          <h3>No hay visitas registradas</h3>
          <p>Las nuevas visitas de las redes aparecerán aquí.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Visita</th>
                <th>Red</th>
                <th>Invitado por</th>
                <th>Semana</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                <tr key={i}>
                  <td className="red-name">{f.nombre}</td>
                  <td>{f.redNombre}</td>
                  <td>{f.invitadoPor}</td>
                  <td>{formatearFecha(f.semanaInicio)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
