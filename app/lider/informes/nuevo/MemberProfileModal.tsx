"use client";

import { useEffect, useRef } from "react";

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const edad = miembro.fecha_nacimiento ? calcularEdad(miembro.fecha_nacimiento) : null;

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function cerrar() {
    dialogRef.current?.close();
    onClose();
  }

  return (
    <dialog ref={dialogRef} className="modal-content" onClose={onClose} aria-labelledby="perfil-titulo">
      <div className="modal-header">
        <h3 className="modal-title" id="perfil-titulo">
          {miembro.nombre} {miembro.apellido ?? ""}
        </h3>
        <button className="close-btn" type="button" onClick={cerrar} aria-label="Cerrar">
          ×
        </button>
      </div>

      <div className="modal-data-grid">
        {edad !== null && <DataItem label="Edad" value={`${edad} años`} />}
        {miembro.telefono && <DataItem label="Teléfono" value={miembro.telefono} />}
        {miembro.correo && <DataItem label="Correo" value={miembro.correo} />}
        {miembro.direccion && <DataItem label="Dirección" value={miembro.direccion} />}
        {miembro.fecha_nacimiento && (
          <DataItem
            label="Cumpleaños"
            value={parsearFechaLocal(miembro.fecha_nacimiento).toLocaleDateString("es", {
              day: "numeric",
              month: "long",
            })}
          />
        )}
      </div>
      {!miembro.telefono && !miembro.correo && !miembro.direccion && !miembro.fecha_nacimiento && (
        <p className="intro">Todavía no hay más datos de este miembro.</p>
      )}
    </dialog>
  );
}

function DataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="data-item">
      <div className="data-label">{label}</div>
      <div className="data-value" style={{ fontSize: "16px" }}>
        {value}
      </div>
    </div>
  );
}
