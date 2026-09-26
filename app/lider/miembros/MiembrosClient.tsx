"use client";

import { useMemo, useState, useTransition } from "react";
import { MiembroModal, type MiembroEditable } from "./MiembroModal";
import { cambiarEstadoMiembro } from "./actions";

export type Miembro = {
  id: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  fecha_nacimiento: string | null;
  activo: boolean;
};

export function MiembrosClient({ miembros }: { miembros: Miembro[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<MiembroEditable | "nuevo" | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase("es");
    if (!q) return miembros;
    return miembros.filter((m) =>
      `${m.nombre} ${m.apellido ?? ""} ${m.telefono ?? ""}`.toLocaleLowerCase("es").includes(q),
    );
  }, [miembros, busqueda]);

  return (
    <>
      <div className="toolbar">
        <label htmlFor="buscar">
          Buscar miembro{" "}
          <input
            id="buscar"
            type="search"
            placeholder="Nombre o teléfono"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </label>
        <button className="btn-view" type="button" onClick={() => setEditando("nuevo")}>
          Agregar miembro
        </button>
      </div>

      {error && (
        <p className="mensaje error" role="alert">
          {error}
        </p>
      )}

      {filtrados.length === 0 ? (
        <p className="empty">
          {miembros.length === 0
            ? "Aún no tienes miembros registrados. Agrega el primero para comenzar."
            : "No hay miembros que coincidan con la búsqueda."}
        </p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Miembro</th>
                <th>Contacto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="red-name">
                      {m.nombre} {m.apellido ?? ""}
                    </div>
                  </td>
                  <td>
                    <div>{m.telefono || "Sin teléfono"}</div>
                    <div className="red-leader">{m.correo || "Sin correo"}</div>
                  </td>
                  <td>
                    <span className={`badge${m.activo ? "" : " inactivo"}`}>
                      {m.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <div className="acciones">
                      <button
                        className="btn-view"
                        type="button"
                        onClick={() => setEditando(m)}
                        aria-label={`Editar a ${m.nombre}`}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-view secondary"
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            const resultado = await cambiarEstadoMiembro(m.id, !m.activo);
                            setError(resultado.error);
                          })
                        }
                      >
                        {m.activo ? "Desactivar" : "Reactivar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editando && (
        <MiembroModal
          miembro={editando === "nuevo" ? null : editando}
          onClose={() => setEditando(null)}
        />
      )}
    </>
  );
}
