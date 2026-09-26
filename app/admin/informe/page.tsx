import { createClient } from "@/lib/supabase/server";
import { obtenerRedesConMetricas } from "@/lib/dashboard/redesConMetricas";
import { obtenerMentorInfoPorId } from "@/lib/dashboard/mentorInfo";
import { BotonExportarPdf, InformeGeneral } from "@/components/dashboard/InformeGeneral";

export default async function AdminInformeGeneralPage() {
  const supabase = await createClient();
  const [mentorInfoPorId, redes] = await Promise.all([
    obtenerMentorInfoPorId(supabase),
    obtenerRedesConMetricas(supabase),
  ]);

  return (
    <section className="page-section">
      <header className="header-top">
        <h2>Informe General de Mentorías</h2>
        <p>Resumen de todas las redes, agrupadas según la mentoría responsable.</p>
      </header>
      <div className="report-toolbar">
        <p>Último reporte de cada red</p>
        <BotonExportarPdf />
      </div>
      <InformeGeneral redes={redes} mentorInfoPorId={mentorInfoPorId} />
    </section>
  );
}
