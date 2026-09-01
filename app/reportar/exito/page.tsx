import Link from "next/link";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/GlassCard";
import { SubirFotos } from "./SubirFotos";

export default async function ReporteExitoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) redirect("/reportar");

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-8">
      <GlassCard className="w-full max-w-md">
        <h1
          className="font-[family-name:var(--font-fraunces)] text-xl"
          style={{ color: "var(--status-al-dia)" }}
        >
          Reporte guardado ✓
        </h1>
        <p className="mt-1 mb-6 text-sm opacity-80">
          Puedes agregar hasta 2 fotos de la reunión (opcional).
        </p>

        <SubirFotos reporteId={id} />

        <Link href="/reportar" className="mt-8 block text-center text-sm underline opacity-80">
          Volver al formulario
        </Link>
      </GlassCard>
    </main>
  );
}
