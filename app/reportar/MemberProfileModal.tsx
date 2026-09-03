"use client";

type Miembro = {
  id: string;
  nombre: string;
  apellido: string | null;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
  fecha_nacimiento: string | null;
};

// fecha_nacimiento es un DATE puro ("YYYY-MM-DD"). new Date(string) lo
// interpreta como medianoche UTC, y en zonas horarias detras de UTC
// (como Panama) eso se muestra como el dia anterior. Se parsea a mano
// para construir una fecha en hora local y evitar el corrimiento.
function parsearFechaLocal(fecha: string): Date {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

function calcularEdad(fechaNacimiento: string): number {
  const hoy = new Date();
  const nacimiento = parsearFechaLocal(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const noHaCumplidoAun =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());
  if (noHaCumplidoAun) edad -= 1;
  return edad;
}

export function MemberProfileModal({
  miembro,
  onClose,
}: {
  miembro: Miembro;
  onClose: () => void;
}) {
  const edad = miembro.fecha_nacimiento ? calcularEdad(miembro.fecha_nacimiento) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-6 shadow-lg backdrop-blur-md"
        style={{ background: "var(--surface)", borderColor: "var(--surface-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-[var(--accent)]">
          {miembro.nombre} {miembro.apellido ?? ""}
        </h2>

        <dl className="mt-4 flex flex-col gap-2 text-sm">
          {edad !== null && (
            <div className="flex justify-between gap-4">
              <dt className="opacity-60">Edad</dt>
              <dd>{edad} años</dd>
            </div>
          )}
          {miembro.telefono && (
            <div className="flex justify-between gap-4">
              <dt className="opacity-60">Teléfono</dt>
              <dd className="font-[family-name:var(--font-ibm-plex-mono)]">{miembro.telefono}</dd>
            </div>
          )}
          {miembro.correo && (
            <div className="flex justify-between gap-4">
              <dt className="opacity-60">Correo</dt>
              <dd>{miembro.correo}</dd>
            </div>
          )}
          {miembro.direccion && (
            <div className="flex justify-between gap-4">
              <dt className="shrink-0 opacity-60">Dirección</dt>
              <dd className="text-right">{miembro.direccion}</dd>
            </div>
          )}
          {miembro.fecha_nacimiento && (
            <div className="flex justify-between gap-4">
              <dt className="opacity-60">Cumpleaños</dt>
              <dd>
                {parsearFechaLocal(miembro.fecha_nacimiento).toLocaleDateString("es", {
                  day: "numeric",
                  month: "long",
                })}
              </dd>
            </div>
          )}
          {!miembro.telefono && !miembro.correo && !miembro.direccion && !miembro.fecha_nacimiento && (
            <p className="opacity-60">Todavía no hay más datos de este miembro.</p>
          )}
        </dl>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg px-4 py-2 text-sm font-medium text-[var(--accent-foreground)]"
          style={{ background: "var(--accent)" }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
