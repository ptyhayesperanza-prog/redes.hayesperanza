"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { guardarMiembro } from "./actions";
import { hoyISO } from "@/lib/fecha";

export type MiembroEditable = {
  id: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  fecha_nacimiento: string | null;
  activo: boolean;
} | null;

export function MiembroModal({
  miembro,
  onClose,
}: {
  miembro: MiembroEditable;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, startTransition] = useTransition();

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  function cerrar() {
    dialogRef.current?.close();
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal-content"
      onClose={onClose}
      aria-labelledby="miembro-titulo"
    >
      <div className="modal-header">
        <h3 className="modal-title" id="miembro-titulo">
          {miembro ? "Editar miembro" : "Agregar miembro"}
        </h3>
        <button className="close-btn" type="button" onClick={cerrar} aria-label="Cerrar">
          ×
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const datos = new FormData(e.currentTarget);
          startTransition(async () => {
            const resultado = await guardarMiembro(datos);
            if (resultado.error) setError(resultado.error);
            else cerrar();
          });
        }}
      >
        {miembro && <input type="hidden" name="id" value={miembro.id} />}
        <div className="form-grid">
          <label>
            Nombre *
            <input
              name="nombre"
              required
              maxLength={100}
              defaultValue={miembro?.nombre ?? ""}
              autoComplete="given-name"
            />
          </label>
          <label>
            Apellido
            <input
              name="apellido"
              maxLength={100}
              defaultValue={miembro?.apellido ?? ""}
              autoComplete="family-name"
            />
          </label>
          <label>
            Teléfono
            <input
              name="telefono"
              type="tel"
              maxLength={30}
              defaultValue={miembro?.telefono ?? ""}
              autoComplete="tel"
            />
          </label>
          <label>
            Correo electrónico
            <input
              name="correo"
              type="email"
              maxLength={160}
              defaultValue={miembro?.correo ?? ""}
              autoComplete="email"
            />
          </label>
          <label>
            Fecha de nacimiento
            <input
              name="fecha_nacimiento"
              type="date"
              max={hoyISO()}
              defaultValue={miembro?.fecha_nacimiento ?? ""}
            />
          </label>
          <label>
            Estado
            <select name="estado" defaultValue={miembro?.activo === false ? "inactivo" : "activo"}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </label>
        </div>
        <label>
          Dirección
          <input
            name="direccion"
            maxLength={250}
            defaultValue={miembro?.direccion ?? ""}
            autoComplete="street-address"
          />
        </label>
        {error && (
          <p className="mensaje error" role="alert">
            {error}
          </p>
        )}
        <div className="acciones">
          <button className="btn-view" type="submit" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar miembro"}
          </button>
          <button className="btn-view secondary" type="button" onClick={cerrar}>
            Cancelar
          </button>
        </div>
      </form>
    </dialog>
  );
}
