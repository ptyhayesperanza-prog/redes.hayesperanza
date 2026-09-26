import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { createClient } from "@/lib/supabase/server";
import { InformesClient } from "./InformesClient";

export default async function MisInformesPage() {
  const { perfil } = (await getUsuarioActual())!;
  const redId = perfil!.red_id!;
  const supabase = await createClient();

  const { data: reportes } = await supabase
    .from("reportes_semanales")
    .select("id, semana_inicio, total_miembros, total_fieles, total_nuevos, se_recogio_ofrenda, ofrenda")
    .eq("red_id", redId)
    .order("semana_inicio", { ascending: false });

  const informes = (reportes ?? []).map((r) => ({
    id: r.id,
    semanaInicio: r.semana_inicio,
    totalMiembros: r.total_miembros ?? 0,
    asistieron: (r.total_fieles ?? 0) + (r.total_nuevos ?? 0),
    visitas: r.total_nuevos ?? 0,
    ofrenda: r.se_recogio_ofrenda ? (r.ofrenda ?? 0) : 0,
  }));

  return (
    <section className="page-section">
      <header className="header-top">
        <h2>Mis Informes</h2>
        <p>Historial de reuniones de tu red.</p>
      </header>
      <InformesClient informes={informes} liderLabel={perfil!.nombre_completo} />
    </section>
  );
}
