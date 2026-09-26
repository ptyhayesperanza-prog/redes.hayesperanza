import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RedesTable } from "@/components/dashboard/RedesTable";
import { obtenerRedesConMetricas } from "@/lib/dashboard/redesConMetricas";
import { colorMentorHex } from "@/lib/colorMentor";

export default async function PastorVistaGeneralPage() {
  const supabase = await createClient();

  const [{ data: mentores }, redes] = await Promise.all([
    supabase.from("mentores").select("id, nombre, color").order("nombre"),
    obtenerRedesConMetricas(supabase),
  ]);

  const mentorInfoPorId = Object.fromEntries(
    (mentores ?? []).map((m) => [m.id, { nombre: m.nombre, colorHex: colorMentorHex(m.color) }]),
  );

  const totalMiembros = redes.reduce((s, r) => s + (r.ultimoReporte?.totalMiembros ?? 0), 0);
  const totalAsistencia = redes.reduce((s, r) => s + (r.ultimoReporte?.asistieron ?? 0), 0);
  const totalVisitas = redes.reduce((s, r) => s + (r.ultimoReporte?.visitas ?? 0), 0);
  const redesConInformes = redes.filter((r) => r.ultimoReporte !== null).length;

  return (
    <section className="page-section">
      <header className="header-top">
        <h2>Panel Pastoral General</h2>
        <p>Resumen administrativo y labor semanal de todas las redes.</p>
      </header>

      <div className="kpi-grid">
        <KpiCard title="Asistencia total (última semana de cada red)" value={totalAsistencia} />
        <KpiCard title="Nuevos visitantes" value={totalVisitas} highlight />
        <KpiCard title="Total miembros" value={totalMiembros} />
        <KpiCard title="Redes con informes" value={`${redesConInformes} / ${redes.length}`} />
      </div>

      <RedesTable redes={redes} mentorInfoPorId={mentorInfoPorId} />
    </section>
  );
}
