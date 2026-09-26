import { dinero } from "@/lib/formato";
import Link from "next/link";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/dashboard/KpiCard";

export default async function LiderVistaGeneralPage() {
  const { perfil } = (await getUsuarioActual())!;
  const redId = perfil!.red_id!;
  const supabase = await createClient();

  const [{ count: miembrosActivos }, { count: informesGuardados }, { data: ultimo }] =
    await Promise.all([
      supabase
        .from("miembros_red")
        .select("id", { count: "exact", head: true })
        .eq("red_id", redId)
        .eq("activo", true),
      supabase
        .from("reportes_semanales")
        .select("id", { count: "exact", head: true })
        .eq("red_id", redId),
      supabase
        .from("reportes_semanales")
        .select("total_fieles, total_nuevos, se_recogio_ofrenda, ofrenda")
        .eq("red_id", redId)
        .order("semana_inicio", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const ultimaAsistencia = ultimo ? (ultimo.total_fieles ?? 0) + (ultimo.total_nuevos ?? 0) : null;
  const ultimaOfrenda = ultimo && ultimo.se_recogio_ofrenda ? (ultimo.ofrenda ?? 0) : null;

  return (
    <section className="page-section">
      <header className="header-top">
        <div className="eyebrow">MI RED</div>
        <h2>Panel de Líderes</h2>
        <p>Cuida de tus miembros y registra cada reunión de tu red.</p>
      </header>

      <div className="kpi-grid">
        <KpiCard title="Miembros activos" value={miembrosActivos ?? 0} />
        <KpiCard title="Informes guardados" value={informesGuardados ?? 0} />
        <KpiCard title="Última asistencia" value={ultimaAsistencia ?? "—"} />
        <KpiCard
          title="Última ofrenda"
          value={ultimaOfrenda !== null ? dinero(ultimaOfrenda) : "—"}
        />
      </div>

      <div className="toolbar">
        <h3>Tu próxima tarea</h3>
      </div>
      <div className="kpi-card">
        <h3>Todo listo para acompañar a tu red</h3>
        <p className="intro">
          Agrega a tus miembros y después marca quiénes asistieron a la reunión. El
          informe calculará los totales por ti.
        </p>
        <div className="acciones">
          <Link href="/lider/miembros" className="btn-view">
            Registrar miembros
          </Link>
          <Link href="/lider/informes/nuevo" className="btn-view secondary">
            Crear informe
          </Link>
        </div>
      </div>
    </section>
  );
}
