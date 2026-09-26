import { createClient } from "@/lib/supabase/server";
import { obtenerRedesConMetricas } from "@/lib/dashboard/redesConMetricas";

type ComentarioItem = {
  redNombre: string;
  semanaInicio: string;
  autor: string;
  texto: string;
};

export default async function ComentariosDeLideresPage() {
  const supabase = await createClient();
  const redes = await obtenerRedesConMetricas(supabase);
  const redIds = redes.map((r) => r.id);
  const nombrePorRed = new Map(redes.map((r) => [r.id, r.nombre]));

  const { data: reportes } =
    redIds.length > 0
      ? await supabase
          .from("reportes_semanales")
          .select("id, red_id, semana_inicio, discipulados, comentario_lider")
          .in("red_id", redIds)
          .order("semana_inicio", { ascending: false })
      : { data: [] };

  const reporteIds = (reportes ?? []).map((r) => r.id);
  const reportePorId = new Map((reportes ?? []).map((r) => [r.id, r]));

  const { data: notasMiembro } =
    reporteIds.length > 0
      ? await supabase
          .from("asistencia_semanal")
          .select(
            "reporte_id, nombre, discipulado, comentario_miembro, miembros_red!asistencia_semanal_miembro_id_fkey(nombre, apellido)",
          )
          .in("reporte_id", reporteIds)
      : { data: [] };

  const items: ComentarioItem[] = [];

  (reportes ?? []).forEach((r) => {
    const redNombre = nombrePorRed.get(r.red_id) ?? "Red";
    if (r.comentario_lider) {
      items.push({ redNombre, semanaInicio: r.semana_inicio, autor: "Comentario general", texto: r.comentario_lider });
    }
    if (r.discipulados) {
      items.push({ redNombre, semanaInicio: r.semana_inicio, autor: "Discipulados (general)", texto: r.discipulados });
    }
  });

  (notasMiembro ?? []).forEach((n) => {
    const reporte = reportePorId.get(n.reporte_id);
    if (!reporte) return;
    const redNombre = nombrePorRed.get(reporte.red_id) ?? "Red";
    const nombrePersona = n.miembros_red
      ? `${n.miembros_red.nombre} ${n.miembros_red.apellido ?? ""}`.trim()
      : (n.nombre ?? "Visita");
    if (n.comentario_miembro) {
      items.push({
        redNombre,
        semanaInicio: reporte.semana_inicio,
        autor: `Sobre ${nombrePersona}`,
        texto: n.comentario_miembro,
      });
    }
    if (n.discipulado) {
      items.push({
        redNombre,
        semanaInicio: reporte.semana_inicio,
        autor: `Discipulado — ${nombrePersona}`,
        texto: n.discipulado,
      });
    }
  });

  items.sort((a, b) => b.semanaInicio.localeCompare(a.semanaInicio));

  return (
    <section className="page-section">
      <header className="header-top">
        <h2>Comentarios de Líderes</h2>
        <p>Buzón de reportes y observaciones semanales de todas las redes.</p>
      </header>

      {items.length === 0 ? (
        <div className="placeholder-content">
          <h3>No hay comentarios registrados</h3>
          <p>Las notas de los líderes aparecerán aquí en cuanto reporten una semana.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {items.map((item, i) => (
            <div className="kpi-card" key={i}>
              <div className="kpi-title">
                {item.redNombre} · {item.semanaInicio} · {item.autor}
              </div>
              <p className="intro" style={{ margin: "10px 0 0" }}>
                {item.texto}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
