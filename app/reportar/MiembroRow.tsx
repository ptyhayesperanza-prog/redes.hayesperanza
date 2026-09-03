"use client";

const inputClass =
  "rounded-lg border bg-transparent px-2 py-1 text-xs outline-none focus:ring-2 w-full";
const inputStyle = { borderColor: "var(--surface-border)" };

export type Miembro = {
  id: string;
  nombre: string;
  apellido: string | null;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
  fecha_nacimiento: string | null;
};

export function MiembroRow({
  miembro,
  onVerPerfil,
}: {
  miembro: Miembro;
  onVerPerfil: (m: Miembro) => void;
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-xl border p-3"
      style={{ borderColor: "var(--surface-border)" }}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onVerPerfil(miembro)}
          className="text-left text-sm font-medium underline decoration-dotted"
        >
          {miembro.nombre}
          {miembro.telefono && (
            <span className="ml-2 font-[family-name:var(--font-ibm-plex-mono)] text-xs font-normal opacity-60">
              {miembro.telefono}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <label className="flex items-center gap-1">
          <input type="checkbox" name="asistio" value={miembro.id} className="h-3.5 w-3.5" />
          Asistió
        </label>
        <label className="flex items-center gap-1">
          <input type="checkbox" name="congrega" value={miembro.id} className="h-3.5 w-3.5" />
          Se congrega
        </label>
        <label className="flex items-center gap-1">
          <input
            type="checkbox"
            name="ofrenda_miembro"
            value={miembro.id}
            className="h-3.5 w-3.5"
          />
          Dio ofrenda
        </label>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          type="text"
          name={`discipulado_${miembro.id}`}
          placeholder="Discipulado (llamada, visita...)"
          maxLength={200}
          className={inputClass}
          style={inputStyle}
        />
        <input
          type="text"
          name={`comentario_${miembro.id}`}
          placeholder="Comentario sobre esta persona"
          maxLength={200}
          className={inputClass}
          style={inputStyle}
        />
      </div>
    </div>
  );
}
