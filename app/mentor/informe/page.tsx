import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { createClient } from "@/lib/supabase/server";
import { obtenerRedesConMetricas } from "@/lib/dashboard/redesConMetricas";
import { BotonExportarPdf, InformeGeneral } from "@/components/dashboard/InformeGeneral";

export default async function InformeGeneralMentoriaPage() {
  const { perfil } = (await getUsuarioActual())!;
  const supabase = await createClient();

  const [{ data: mentor }, redes] = await Promise.all([
    supabase.from("mentores").select("nombre").eq("id", perfil!.mentor_id!).single(),
    obtenerRedesConMetricas(supabase),
  ]);

  return (
    <section className="page-section">
      <header className="header-top">
        <div className="eyebrow">INFORME DE MENTORÍA</div>
        <h2>Informe general de mentoría</h2>
        <p>Resumen de todas las redes bajo tu administración.</p>
      </header>
      <div className="report-toolbar">
        <div className="scope" style={{ margin: 0 }}>
          <strong>Mentoría de {mentor?.nombre ?? "—"}</strong>
        </div>
        <BotonExportarPdf />
      </div>
      <InformeGeneral redes={redes} />
    </section>
  );
}
