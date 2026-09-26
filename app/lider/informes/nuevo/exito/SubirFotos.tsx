"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Los mismos límites están forzados en la base (trigger + config del bucket).
const MAX_FOTOS = 2;
const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

// crypto.randomUUID() no existe en navegadores de celular algo viejos
// (p. ej. Safari de iOS < 15.4) ni fuera de https: la subida fallaba con
// "crypto.randomUUID is not a function". getRandomValues sí está en todos.
function idAleatorio(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // versión 4
  b[8] = (b[8] & 0x3f) | 0x80; // variante RFC 4122
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

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
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      setError("Solo se aceptan fotos JPG, PNG, WebP o HEIC.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("La foto pesa más de 5 MB.");
      return;
    }

    setError(null);
    setSubiendo(true);

    const supabase = createClient();
    // Solo se conserva la extensión: los nombres de archivo de los
    // celulares traen espacios, acentos o caracteres que el storage rechaza.
    const extension = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const ruta = `${reporteId}/${idAleatorio()}.${extension || "jpg"}`;

    const { error: uploadError } = await supabase.storage
      .from("fotos-reportes")
      .upload(ruta, file, { contentType: file.type });

    if (uploadError) {
      setSubiendo(false);
      setError("No se pudo subir la foto.");
      return;
    }

    // subida_por lo fuerza un trigger en la base (siempre quien sube).
    const { data: fila, error: insertError } = await supabase
      .from("fotos_reporte")
      .insert({ reporte_id: reporteId, ruta_storage: ruta } as never)
      .select("id")
      .single();

    if (insertError || !fila) {
      // Sin fila en fotos_reporte el archivo quedaría huérfano en el bucket.
      await supabase.storage.from("fotos-reportes").remove([ruta]);
      setSubiendo(false);
      setError(
        insertError?.message.includes("maximo 2 fotos")
          ? `Este reporte ya tiene ${MAX_FOTOS} fotos.`
          : "No se pudo registrar la foto. Intenta de nuevo.",
      );
      return;
    }

    setSubiendo(false);

    setFotos((prev) => [...prev, fila.id]);
  }

  return (
    <div>
      <p className="intro">
        Fotos de la reunión ({fotos.length}/{MAX_FOTOS})
      </p>
      {fotos.length < MAX_FOTOS && (
        <input ref={inputRef} type="file" accept={TIPOS_PERMITIDOS.join(",")} onChange={handleFile} disabled={subiendo} />
      )}
      {subiendo && <p className="intro">Subiendo...</p>}
      {error && <p className="mensaje error">{error}</p>}
    </div>
  );
}
