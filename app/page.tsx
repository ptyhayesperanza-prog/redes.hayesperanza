import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { error } = await supabase.from("redes").select("id", { count: "exact", head: true });

  const conectado = !error;

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-8">
      <div
        className="max-w-md rounded-2xl border p-8 shadow-sm backdrop-blur-md"
        style={{
          background: "var(--surface)",
          borderColor: "var(--surface-border)",
        }}
      >
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--accent)]">
          Redes Hay Esperanza
        </h1>
        <p className="mt-2 text-sm opacity-80">
          Panel de reportes semanales — en construcción.
        </p>
        <p className="mt-6 font-[family-name:var(--font-ibm-plex-mono)] text-sm">
          Supabase:{" "}
          {conectado ? (
            <span style={{ color: "var(--status-al-dia)" }}>conectado ✓</span>
          ) : (
            <span style={{ color: "var(--status-falto)" }}>
              sin conexión ({error?.message})
            </span>
          )}
        </p>
      </div>
    </main>
  );
}
