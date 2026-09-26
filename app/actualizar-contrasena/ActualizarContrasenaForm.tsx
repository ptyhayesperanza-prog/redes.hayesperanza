"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ActualizarContrasenaForm() {
  const router = useRouter();
  const [listo, setListo] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    // El enlace del correo llega en uno de dos formatos:
    // - ?code=... (PKCE): cuando se pidió desde /recuperar. Solo funciona en
    //   el mismo navegador donde se pidió (ahí quedó guardado el verificador).
    // - #access_token=...&refresh_token=... (implícito): cuando el correo se
    //   manda desde el dashboard de Supabase o por API. Funciona en cualquier
    //   navegador, pero el cliente PKCE no lo lee solo: hay que pasarlo a mano.
    const hash = new URLSearchParams(url.hash.slice(1));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");
    const errorEnlace = hash.get("error_description") ?? url.searchParams.get("error_description");

    const ENLACE_INVALIDO = "El enlace no es válido o ya expiró. Pide uno nuevo desde /recuperar.";

    async function prepararSesion() {
      if (errorEnlace) {
        setError(ENLACE_INVALIDO);
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) setError(ENLACE_INVALIDO);
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) setError(ENLACE_INVALIDO);
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setError("Abre esta página desde el enlace que te llegó por correo. Si no tienes uno, pídelo en /recuperar.");
        }
      }
      // No dejar los tokens a la vista en la barra de direcciones ni en el historial.
      if (code || url.hash) window.history.replaceState(null, "", url.pathname);
      setListo(true);
    }

    prepararSesion();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setCargando(false);

    if (error) {
      const m = error.message.toLowerCase();
      setError(
        m.includes("session")
          ? "Tu enlace ya no es válido. Pide uno nuevo desde /recuperar."
          : m.includes("different")
            ? "La contraseña nueva tiene que ser distinta de la anterior."
            : m.includes("at least") || m.includes("weak")
              ? "La contraseña es muy débil: usa al menos 8 caracteres."
              : "No se pudo actualizar la contraseña: " + error.message,
      );
      return;
    }

    setGuardado(true);
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1200);
  }

  if (!listo) {
    return <p className="text-sm opacity-80">Verificando enlace...</p>;
  }

  if (guardado) {
    return (
      <p className="text-sm" style={{ color: "var(--status-al-dia)" }}>
        Contraseña actualizada. Entrando...
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm opacity-80">
          Nueva contraseña
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
        {cargando ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}
