"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_FOTOS = 2;

export function SubirFotos({ reporteId }: { reporteId: string }) {
  const [fotos, setFotos] = useState<string[]>([]);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("fotos_reporte")
      .select("id")
      .eq("reporte_id", reporteId)
      .then(({ data }) => setFotos((data ?? []).map((f) => f.id)));
  }, [reporteId]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (fotos.length >= MAX_FOTOS) {
      setError(`Ya subiste el máximo de ${MAX_FOTOS} fotos.`);
      return;
    }

    setError(null);
    setSubiendo(true);

    const supabase = createClient();
    const ruta = `${reporteId}/${crypto.randomUUID()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("fotos-reportes")
      .upload(ruta, file);

    if (uploadError) {
      setSubiendo(false);
      setError("No se pudo subir la foto.");
      return;
    }

    const { data: fila, error: insertError } = await supabase
      .from("fotos_reporte")
      .insert({ reporte_id: reporteId, ruta_storage: ruta } as never)
      .select("id")
      .single();

    setSubiendo(false);

    if (insertError || !fila) {
      setError("La foto se subió pero no se pudo registrar.");
      return;
    }

    setFotos((prev) => [...prev, fila.id]);
  }

  return (
    <div>
      <p className="text-sm opacity-80">
        Fotos de la reunión ({fotos.length}/{MAX_FOTOS})
      </p>
      {fotos.length < MAX_FOTOS && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={subiendo}
          className="mt-2 text-sm"
        />
      )}
      {subiendo && <p className="mt-1 text-sm opacity-70">Subiendo...</p>}
      {error && (
        <p className="mt-1 text-sm" style={{ color: "var(--status-falto)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
