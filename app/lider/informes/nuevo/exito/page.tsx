import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/supabase/get-perfil";
import { createClient } from "@/lib/supabase/server";
import { formatearFecha } from "@/lib/fecha";
import { SubirFotos } from "./SubirFotos";

export default async function ReporteExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) redirect("/lider/informes/nuevo");

  // Antes mostraba "Reporte guardado ✓" con cualquier id en la URL. Solo se
  // confirma si el reporte existe y es de la red de este líder (RLS ya
  // impide ver el de otra red; el filtro por red_id lo deja explícito).
  const { perfil } = (await getUsuarioActual())!;
  const supabase = await createClient();
  const { data: reporte } = await supabase
    .from("reportes_semanales")
    .select("id, semana_inicio, semana_fin")
    .eq("id", id)
    .eq("red_id", perfil!.red_id!)
    .maybeSingle();

  if (!reporte) redirect("/lider/informes");

  return (
    <section className="page-section">
      <header className="header-top">
        <h2 style={{ color: "var(--status-al-dia, #16a34a)" }}>Reporte guardado ✓</h2>
        <p>
          Semana del {formatearFecha(reporte.semana_inicio)} al {formatearFecha(reporte.semana_fin)}.
          Puedes agregar hasta 2 fotos de la reunión (opcional).
        </p>
      </header>

      <div className="kpi-card">
        <SubirFotos reporteId={reporte.id} />
      </div>

      <div className="acciones" style={{ marginTop: "20px" }}>
        <Link href="/lider/informes" className="btn-view">
          Ver mis informes
        </Link>
        <Link href="/lider" className="btn-view secondary">
          Volver a Vista General
        </Link>
      </div>
    </section>
  );
}
