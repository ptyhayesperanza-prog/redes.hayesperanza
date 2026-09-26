import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { RedesTable } from "@/components/dashboard/RedesTable";
import { obtenerRedesConMetricas } from "@/lib/dashboard/redesConMetricas";
import { colorMentorHex } from "@/lib/colorMentor";

export default async function AdminVistaGeneralPage() {
  const supabase = await createClient();

  const [{ data: mentores }, { data: pendientes }, redes] = await Promise.all([
    supabase.from("mentores").select("id, nombre, color").order("nombre"),
    supabase.rpc("listar_usuarios_pendientes"),
    obtenerRedesConMetricas(supabase),
  ]);

  const mentorInfoPorId = Object.fromEntries(
    (mentores ?? []).map((m) => [m.id, { nombre: m.nombre, colorHex: colorMentorHex(m.color) }]),
  );

  const totalMiembros = redes.reduce((s, r) => s + (r.ultimoReporte?.totalMiembros ?? 0), 0);
  const totalAsistencia = redes.reduce((s, r) => s + (r.ultimoReporte?.asistieron ?? 0), 0);
  const redesConInformes = redes.filter((r) => r.ultimoReporte !== null).length;

  return (
    <section className="page-section">
      <header className="header-top">
        <h2>Panel de Administración</h2>
        <p>Resumen general de todas las redes y mentorías.</p>
      </header>

      <div className="kpi-grid">
        <KpiCard title="Redes activas" value={redes.length} />
        <KpiCard title="Asistencia (última semana de cada red)" value={totalAsistencia} highlight />
        <KpiCard title="Total miembros" value={totalMiembros} />
        <KpiCard title="Redes con informes" value={`${redesConInformes} / ${redes.length}`} />
      </div>

      {pendientes && pendientes.length > 0 && (
        <div className="scope">
          <strong>{pendientes.length} usuario(s) esperando aprobación.</strong>{" "}
          <Link href="/admin/usuarios" style={{ textDecoration: "underline" }}>
            Ir a Usuarios pendientes
          </Link>
        </div>
      )}

      <RedesTable redes={redes} mentorInfoPorId={mentorInfoPorId} />
    </section>
  );
}
