import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RedesTable } from "@/components/dashboard/RedesTable";
import { obtenerRedesConMetricas } from "@/lib/dashboard/redesConMetricas";

export default async function MentorVistaGeneralPage() {
  const { perfil } = (await getUsuarioActual())!;
  const supabase = await createClient();

  const [{ data: mentor }, redes] = await Promise.all([
    supabase.from("mentores").select("nombre").eq("id", perfil!.mentor_id!).single(),
    obtenerRedesConMetricas(supabase),
  ]);

  const totalMiembros = redes.reduce((s, r) => s + (r.ultimoReporte?.totalMiembros ?? 0), 0);
  const totalAsistencia = redes.reduce((s, r) => s + (r.ultimoReporte?.asistieron ?? 0), 0);
  const totalVisitas = redes.reduce((s, r) => s + (r.ultimoReporte?.visitas ?? 0), 0);

  return (
    <section className="page-section">
      <header className="header-top">
        <div className="eyebrow">MI MENTORÍA</div>
        <h2>Panel de Mentores</h2>
        <p>El crecimiento y seguimiento de las redes a tu cargo.</p>
      </header>

      <div className="scope">
        <strong>Mentoría de {mentor?.nombre ?? "—"}</strong>
        <br />
        Resumen de tus redes asignadas, basado en el último reporte de cada una.
      </div>

      <div className="kpi-grid">
        <KpiCard title="Redes asignadas" value={redes.length} note="Bajo tu mentoría" />
        <KpiCard title="Asistencia" value={totalAsistencia} note="Último reporte de cada red" highlight />
        <KpiCard title="Nuevos visitantes" value={totalVisitas} note="En tus redes" />
        <KpiCard title="Total miembros" value={totalMiembros} note="En tus redes asignadas" />
      </div>

      <RedesTable redes={redes} />
    </section>
  );
}
