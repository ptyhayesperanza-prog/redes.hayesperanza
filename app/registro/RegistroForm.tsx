"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function RegistroForm() {
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState<"confirmar" | "pendiente" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre_completo: nombreCompleto } },
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

    // Si el proyecto exige confirmar el correo, Supabase no devuelve
    // sesion todavia.
    setListo(data.session ? "pendiente" : "confirmar");
  }

  if (listo === "confirmar") {
    return (
      <p className="text-sm" style={{ color: "var(--status-al-dia)" }}>
        Cuenta creada. Revisa tu correo para confirmarla y luego avísale al
        admin para que te asigne tu rol y tu red.
      </p>
    );
  }

  if (listo === "pendiente") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm" style={{ color: "var(--status-al-dia)" }}>
          Cuenta creada. Avísale al admin para que te asigne tu rol y tu red
          — hasta entonces no vas a poder ver ningún dato.
        </p>
        <Link href="/login" className="text-center text-sm underline opacity-80">
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          className="rounded-lg border bg-transparent px-3 py-2 outline-none focus:ring-2"
          style={{ borderColor: "var(--surface-border)" }}
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
          className="rounded-lg border bg-transparent px-3 py-2 outline-none focus:ring-2"
          style={{ borderColor: "var(--surface-border)" }}
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
          className="rounded-lg border bg-transparent px-3 py-2 outline-none focus:ring-2"
          style={{ borderColor: "var(--surface-border)" }}
        />
      </div>

      {error && (
        <p className="text-sm" style={{ color: "var(--status-falto)" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="mt-2 rounded-lg px-4 py-2 font-medium text-[var(--accent-foreground)] disabled:opacity-60"
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
