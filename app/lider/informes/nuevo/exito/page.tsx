import Link from "next/link";
import { redirect } from "next/navigation";
import { SubirFotos } from "./SubirFotos";

export default async function ReporteExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) redirect("/lider/informes/nuevo");

  return (
    <section className="page-section">
      <header className="header-top">
        <h2 style={{ color: "var(--status-al-dia, #16a34a)" }}>Reporte guardado ✓</h2>
        <p>Puedes agregar hasta 2 fotos de la reunión (opcional).</p>
      </header>

      <div className="kpi-card">
        <SubirFotos reporteId={id} />
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
