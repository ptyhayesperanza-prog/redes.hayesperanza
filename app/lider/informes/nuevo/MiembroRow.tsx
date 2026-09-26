"use client";

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
    <div className="attendance-card">
      <button
        type="button"
        onClick={() => onVerPerfil(miembro)}
        style={{
          textAlign: "left",
          fontWeight: 600,
          fontSize: "14px",
          background: "none",
          border: 0,
          padding: 0,
          cursor: "pointer",
          textDecoration: "underline dotted",
          color: "inherit",
        }}
      >
        {miembro.nombre} {miembro.apellido ?? ""}
        {miembro.telefono && (
          <span style={{ marginLeft: "8px", fontWeight: 400, opacity: 0.6, fontSize: "12px" }}>
            {miembro.telefono}
          </span>
        )}
      </button>

      <div className="attendance-checks">
        <label>
          <input type="checkbox" name="asistio" value={miembro.id} />
          Asistió
        </label>
        <label>
          <input type="checkbox" name="congrega" value={miembro.id} />
          Se congrega
        </label>
        <label>
          <input type="checkbox" name="ofrenda_miembro" value={miembro.id} />
          Dio ofrenda
        </label>
      </div>

      <input
        type="text"
        name={`discipulado_${miembro.id}`}
        placeholder="Discipulado (llamada, visita...)"
        maxLength={200}
      />
      <input
        type="text"
        name={`comentario_${miembro.id}`}
        placeholder="Comentario sobre esta persona"
        maxLength={200}
      />
    </div>
  );
}
