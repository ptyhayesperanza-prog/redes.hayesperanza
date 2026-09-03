"use client";

import { useState } from "react";
import { asignarPerfil } from "./actions";

type Red = { id: string; nombre: string };
type Mentor = { id: string; nombre: string };

const inputClass =
  "rounded-lg border bg-transparent px-3 py-2 outline-none focus:ring-2 w-full";
const inputStyle = { borderColor: "var(--surface-border)" };

export function AsignarForm({
  usuarioId,
  email,
  nombreSugerido,
  redes,
  mentores,
}: {
  usuarioId: string;
  email: string;
  nombreSugerido: string | null;
  redes: Red[];
  mentores: Mentor[];
}) {
  const [rol, setRol] = useState("lider");
  const [enviando, setEnviando] = useState(false);

  return (
    <form
      action={asignarPerfil}
      onSubmit={() => setEnviando(true)}
      className="flex flex-col gap-2 rounded-xl border p-4"
      style={{ borderColor: "var(--surface-border)" }}
    >
      <input type="hidden" name="id" value={usuarioId} />
      <p className="text-sm opacity-80">{email}</p>

      <input
        type="text"
        name="nombre_completo"
        defaultValue={nombreSugerido ?? ""}
        placeholder="Nombre completo"
        required
        className={inputClass}
        style={inputStyle}
      />

      <select
        name="rol"
        value={rol}
        onChange={(e) => setRol(e.target.value)}
        className={inputClass}
        style={inputStyle}
      >
        <option value="lider">Líder / colíder</option>
        <option value="mentor">Mentor</option>
        <option value="pastor">Pastor</option>
        <option value="admin">Admin</option>
      </select>

      {rol === "lider" && (
        <select name="red_id" required className={inputClass} style={inputStyle}>
          <option value="">— Elige la red —</option>
          {redes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      )}

      {rol === "mentor" && (
        <select name="mentor_id" required className={inputClass} style={inputStyle}>
          <option value="">— Elige el mentor —</option>
          {mentores.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="mt-1 rounded-lg px-3 py-2 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-60"
        style={{ background: "var(--accent)" }}
      >
        {enviando ? "Asignando..." : "Asignar"}
      </button>
    </form>
  );
}
