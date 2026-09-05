"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CardPicker } from "@/components/CardPicker";
import { colorMentorHex } from "@/lib/colorMentor";

const inputClass =
  "rounded-lg border bg-transparent px-3 py-2 outline-none focus:ring-2 w-full";
const inputStyle = { borderColor: "var(--surface-border)" };

type Red = { id: string; nombre: string; mentor_id: string | null; lider_referencia: string | null };
type Mentor = { id: string; nombre: string; color: string | null };
type Rol = "lider" | "mentor" | "pastor";

export function RegistroForm() {
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol | null>(null);
  const [redMentorId, setRedMentorId] = useState<string | null>(null);
  const [redId, setRedId] = useState<string | null>(null);
  const [mentorId, setMentorId] = useState<string | null>(null);

  const [redes, setRedes] = useState<Red[]>([]);
  const [mentores, setMentores] = useState<Mentor[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState<"confirmar" | "pendiente" | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("listar_redes_publico").then(({ data }) => setRedes(data ?? []));
    supabase.rpc("listar_mentores_publico").then(({ data }) => setMentores(data ?? []));
  }, []);

  const datosCompletos = nombreCompleto.trim().length >= 3 && email.includes("@") && password.length >= 8;
  const seleccionCompleta =
    rol === "pastor" || (rol === "lider" && !!redId) || (rol === "mentor" && !!mentorId);
  const puedeEnviar = datosCompletos && !!rol && seleccionCompleta;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!puedeEnviar) return;
    setError(null);
    setCargando(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_completo: nombreCompleto,
          rol_sugerido: rol,
          red_id_sugerida: rol === "lider" ? redId : null,
          mentor_id_sugerido: rol === "mentor" ? mentorId : null,
        },
      },
    });

    setCargando(false);

    if (error) {
      setError(
        error.message.toLowerCase().includes("already registered")
          ? "Ya existe una cuenta con ese correo."
          : "No se pudo crear la cuenta. Intenta de nuevo.",
      );
      return;
    }

    setListo(data.session ? "pendiente" : "confirmar");
  }

  if (listo === "confirmar") {
    return (
      <p className="text-sm" style={{ color: "var(--status-al-dia)" }}>
        Cuenta creada. Revisa tu correo para confirmarla y luego avísale al
        admin para que te apruebe — hasta entonces no vas a poder ver ningún
        dato.
      </p>
    );
  }

  if (listo === "pendiente") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm" style={{ color: "var(--status-al-dia)" }}>
          Cuenta creada. Avísale al admin para que confirme tu rol y tu red
          — hasta entonces no vas a poder ver ningún dato.
        </p>
        <Link href="/login" className="text-center text-sm underline opacity-80">
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label htmlFor="nombre_completo" className="text-sm opacity-80">
          Nombre completo
        </label>
        <input
          id="nombre_completo"
          type="text"
          required
          value={nombreCompleto}
          onChange={(e) => setNombreCompleto(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm opacity-80">
          Correo
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm opacity-80">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      </div>

      <div
        className={`flex flex-col gap-3 transition-opacity ${datosCompletos ? "" : "pointer-events-none opacity-40"}`}
      >
        <p className="text-sm opacity-80">¿Cuál es tu rol?</p>
        <CardPicker
          items={[
            { id: "lider", label: "Líder / colíder" },
            { id: "mentor", label: "Mentor" },
            { id: "pastor", label: "Pastor" },
          ]}
          selectedId={rol}
          onSelect={(id) => setRol(id as Rol)}
        />
      </div>

      {rol === "lider" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm opacity-80">¿Cuál es tu mentoría?</p>
          <CardPicker
            items={mentores.map((m) => ({
              id: m.id,
              label: m.nombre,
              sublabel: m.color ?? undefined,
              colorHex: colorMentorHex(m.color),
            }))}
            selectedId={redMentorId}
            onSelect={(id) => {
              setRedMentorId(id);
              setRedId(null);
            }}
            numbered
          />
        </div>
      )}

      {rol === "lider" && redMentorId && (
        <div className="flex flex-col gap-3">
          <p className="text-sm opacity-80">¿Cuál es tu red?</p>
          <CardPicker
            items={redes
              .filter((r) => r.mentor_id === redMentorId)
              .map((r) => ({
                id: r.id,
                label: r.nombre,
                sublabel: r.lider_referencia ?? undefined,
              }))}
            selectedId={redId}
            onSelect={setRedId}
            numbered
          />
        </div>
      )}

      {rol === "mentor" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm opacity-80">¿Cuál mentoría eres?</p>
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
        </div>
      )}

      <p className="text-xs opacity-60">
        Esto es solo una sugerencia — un admin confirma tu rol y tu red antes
        de darte acceso.
      </p>

      {error && (
        <p className="text-sm" style={{ color: "var(--status-falto)" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando || !puedeEnviar}
        className="mt-2 rounded-lg px-4 py-2 font-medium text-[var(--accent-foreground)] disabled:opacity-40"
        style={{ background: "var(--accent)" }}
      >
        {cargando ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <Link href="/login" className="text-center text-sm underline opacity-80">
        ¿Ya tienes cuenta? Inicia sesión
      </Link>
    </form>
  );
}
