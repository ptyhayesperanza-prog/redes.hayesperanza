"use client";

import { useState } from "react";
import { CardPicker } from "@/components/CardPicker";
import { colorMentorHex } from "@/lib/colorMentor";
import { asignarPerfil } from "./actions";

type Red = { id: string; nombre: string };
type Mentor = { id: string; nombre: string; color: string | null };
type Rol = "lider" | "mentor" | "pastor" | "admin";

const inputClass =
  "rounded-lg border bg-transparent px-3 py-2 outline-none focus:ring-2 w-full";
const inputStyle = { borderColor: "var(--surface-border)" };

export function AsignarForm({
  usuarioId,
  email,
  nombreSugerido,
  rolSugerido,
  redIdSugerida,
  mentorIdSugerido,
  redes,
  mentores,
}: {
  usuarioId: string;
  email: string;
  nombreSugerido: string | null;
  rolSugerido: string | null;
  redIdSugerida: string | null;
  mentorIdSugerido: string | null;
  redes: Red[];
  mentores: Mentor[];
}) {
  const rolInicial: Rol =
    rolSugerido === "mentor" || rolSugerido === "pastor" ? rolSugerido : "lider";

  const [rol, setRol] = useState<Rol>(rolInicial);
  const [redId, setRedId] = useState<string | null>(redIdSugerida);
  const [mentorId, setMentorId] = useState<string | null>(mentorIdSugerido);
  const [enviando, setEnviando] = useState(false);

  return (
    <form
      action={asignarPerfil}
      onSubmit={() => setEnviando(true)}
      className="flex flex-col gap-3 rounded-xl border p-4"
      style={{ borderColor: "var(--surface-border)" }}
    >
      <input type="hidden" name="id" value={usuarioId} />
      <input type="hidden" name="rol" value={rol} />
      {rol === "lider" && <input type="hidden" name="red_id" value={redId ?? ""} />}
      {rol === "mentor" && <input type="hidden" name="mentor_id" value={mentorId ?? ""} />}

      <p className="text-sm opacity-80">{email}</p>
      {rolSugerido && (
        <p className="text-xs opacity-60">
          Sugirió: {rolSugerido}
          {redIdSugerida &&
            ` — ${redes.find((r) => r.id === redIdSugerida)?.nombre ?? "red no encontrada"}`}
          {mentorIdSugerido &&
            ` — ${mentores.find((m) => m.id === mentorIdSugerido)?.nombre ?? "mentor no encontrado"}`}
        </p>
      )}

      <input
        type="text"
        name="nombre_completo"
        defaultValue={nombreSugerido ?? ""}
        placeholder="Nombre completo"
        required
        className={inputClass}
        style={inputStyle}
      />

      <CardPicker
        items={[
          { id: "lider", label: "Líder / colíder" },
          { id: "mentor", label: "Mentor" },
          { id: "pastor", label: "Pastor" },
          { id: "admin", label: "Admin" },
        ]}
        selectedId={rol}
        onSelect={(id) => setRol(id as Rol)}
      />

      {rol === "lider" && (
        <CardPicker
          items={redes.map((r) => ({ id: r.id, label: r.nombre }))}
          selectedId={redId}
          onSelect={setRedId}
          numbered
        />
      )}

      {rol === "mentor" && (
        <CardPicker
          items={mentores.map((m) => ({
            id: m.id,
            label: m.nombre,
            sublabel: m.color ?? undefined,
            colorHex: colorMentorHex(m.color),
          }))}
          selectedId={mentorId}
          onSelect={setMentorId}
          numbered
        />
      )}

      <button
        type="submit"
        disabled={enviando || (rol === "lider" && !redId) || (rol === "mentor" && !mentorId)}
        className="mt-1 rounded-lg px-3 py-2 text-sm font-medium text-[var(--accent-foreground)] disabled:opacity-40"
        style={{ background: "var(--accent)" }}
      >
        {enviando ? "Asignando..." : "Asignar"}
      </button>
    </form>
  );
}
