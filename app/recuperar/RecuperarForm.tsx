"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function RecuperarForm() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-contrasena`,
    });

    setCargando(false);

    if (error) {
      setError("No se pudo enviar el correo. Intenta de nuevo.");
      return;
    }

    setEnviado(true);
  }

  if (enviado) {
    return (
      <p className="text-sm" style={{ color: "var(--status-al-dia)" }}>
        Si existe una cuenta con ese correo, te llegó un enlace para poner una
        contraseña nueva. Revisa tu bandeja de entrada.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        {cargando ? "Enviando..." : "Enviar enlace"}
      </button>
    </form>
  );
}
